"""
Database configuration and PyMongo client for PoolDesk.
Connects to MongoDB Atlas using credentials loaded from backend/.env.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, ConfigurationError

# Load environment variables from backend/.env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
DATABASE_NAME = os.getenv("DATABASE_NAME", "pooldesk_db").strip()

_client = None


def get_client() -> MongoClient:
    """Returns singleton PyMongo client instance or raises ValueError if URI is missing."""
    global _client
    if _client is not None:
        return _client

    if not MONGODB_URI:
        raise ValueError(
            f"MONGODB_URI is not configured. Please paste your connection string in: {env_path}"
        )

    # Server selection timeout: 5000 ms to fail fast with friendly message if network/IP is blocked
    _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _client


def get_database():
    """Returns the PoolDesk database instance."""
    client = get_client()
    return client[DATABASE_NAME]


def get_registrations_col():
    return get_database()["registrations"]


def get_pools_col():
    return get_database()["pools"]


def get_users_col():
    return get_database()["users"]


def test_connection():
    """
    Tests connectivity to MongoDB Atlas by pinging the admin database.
    Returns (True, message) or (False, error_details).
    """
    if not MONGODB_URI:
        return False, f"MONGODB_URI is empty in {env_path}. Please add your Atlas connection string."

    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Send a ping to confirm a successful connection
        pong = client.admin.command('ping')
        return True, f"Ping successful: {pong}. Connected to database '{DATABASE_NAME}' on Atlas."
    except ConfigurationError as e:
        return False, f"Configuration Error (invalid URI syntax): {e}"
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        return False, (
            f"Network/Authentication Error connecting to Atlas: {e}\n"
            "Tips:\n"
            "1. Check if your current IP address is added to the MongoDB Atlas Network Access IP Access List.\n"
            "2. Verify that your database username and password in the URI are correct (and password URL-encoded if it contains special characters)."
        )
    except Exception as e:
        return False, f"Unexpected error during connection test: {e}"
