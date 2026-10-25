"""
CLI Connection Tester for MongoDB Atlas
Run: python test_db.py
"""
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure local backend dir is in python path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from database import test_connection, MONGODB_URI, DATABASE_NAME, env_path

def main():
    print("=" * 60)
    print(" PoolDesk — MongoDB Atlas Connection Diagnostic")
    print("=" * 60)
    print(f"Environment File: {env_path}")
    print(f"Target Database : {DATABASE_NAME}")

    if not MONGODB_URI:
        print("\n[!] STATUS: NOT CONFIGURED")
        print(f"Please open: {env_path}")
        print("and set MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority")
        sys.exit(1)

    # Mask credentials for display
    masked_uri = MONGODB_URI
    if "@" in masked_uri:
        prefix, host_part = masked_uri.split("@", 1)
        protocol = prefix.split("://")[0]
        masked_uri = f"{protocol}://****:****@{host_part}"

    print(f"Connection URI   : {masked_uri}")
    print("\nPinging MongoDB Atlas cluster...")

    success, message = test_connection()

    if success:
        print("\n[+] SUCCESS: Connected to MongoDB Atlas!")
        print(f"Details: {message}")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n[-] FAILED: Could not connect to MongoDB Atlas.")
        print(f"Details:\n{message}")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()
