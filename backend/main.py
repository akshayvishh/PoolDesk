"""
PoolDesk FastAPI Backend
Provides REST endpoints for owner authentication, pool occupancy,
swimmer registration, pass lifecycle, and business intelligence reports.
"""
import os
import random
import string
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from database import (
    test_connection,
    get_registrations_col,
    get_pools_col,
    MONGODB_URI,
    DATABASE_NAME,
    env_path
)
from models import (
    Pool,
    PoolOccupancy,
    Registration,
    RegistrationCreate,
    ExtensionRequest,
    CancelRequest,
    LoginRequest,
    UserProfile
)
from seed_data import mock_pools, generate_seed_registrations

app = FastAPI(
    title="PoolDesk API",
    description="Aquatics facility desktop backend with MongoDB Atlas integration",
    version="2.4.0"
)

# CORS setup for local frontend
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory fallback cache when Atlas URI is not yet entered
_in_memory_pools = [dict(p) for p in mock_pools]
_in_memory_registrations = generate_seed_registrations()


def is_db_connected() -> bool:
    if not MONGODB_URI:
        return False
    ok, _ = test_connection()
    return ok


def generate_pass_id() -> str:
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y%m%d")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"PD-{date_str}-{suffix}"


def calculate_expiry(entry_time_iso: str, pass_type: str, closing_hour_ist: int = 22) -> str:
    entry = datetime.fromisoformat(entry_time_iso.replace("Z", "+00:00"))
    if pass_type == "hourly":
        return (entry + timedelta(hours=1)).isoformat()
    else:
        # Full-day: 10:00 PM IST (UTC+5:30)
        ist_entry = entry + timedelta(hours=5, minutes=30)
        ist_closing = ist_entry.replace(hour=closing_hour_ist, minute=0, second=0, microsecond=0)
        if ist_closing <= ist_entry:
            ist_closing += timedelta(days=1)
        utc_closing = ist_closing - timedelta(hours=5, minutes=30)
        return utc_closing.isoformat()


# ─── HEALTH & DIAGNOSTICS ─────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "PoolDesk Aquatics API",
        "version": "2.4.0",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health_check():
    connected, message = test_connection()
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "configured": bool(MONGODB_URI),
            "connected": connected,
            "target": DATABASE_NAME,
            "env_path": str(env_path),
            "details": message
        }
    }


@app.get("/api/db/test")
def db_diagnostic():
    connected, message = test_connection()
    return {
        "connected": connected,
        "message": message,
        "env_path": str(env_path),
        "database_name": DATABASE_NAME
    }


# ─── AUTHENTICATION ───────────────────────────────────────────────

@app.post("/api/auth/login")
def login(creds: LoginRequest):
    # Operator / Owner Demo Authentication
    valid_users = ["admin", "admin@aquatics.gov", "owner@pooldesk.local"]
    if creds.username.lower().strip() in valid_users and len(creds.password) >= 4:
        return {
            "success": True,
            "token": "demo-token-" + "".join(random.choices(string.ascii_lowercase, k=16)),
            "user": {
                "name": "Akshay Vishwakarma",
                "role": "Owner / Admin",
                "station": "Station 01"
            }
        }
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid operator credentials.")


# ─── POOLS & CAPACITY ─────────────────────────────────────────────

@app.get("/api/pools", response_model=List[Pool])
def list_pools():
    if is_db_connected():
        try:
            col = get_pools_col()
            if col.count_documents({}) == 0:
                col.insert_many([dict(p) for p in mock_pools])
            pools = list(col.find({}, {"_id": 0}))
            return pools
        except Exception:
            pass
    return _in_memory_pools


@app.get("/api/pools/occupancy", response_model=List[PoolOccupancy])
def get_occupancy():
    pools_data = list_pools()
    active_regs = []

    if is_db_connected():
        try:
            col = get_registrations_col()
            active_regs = list(col.find({"status": "active"}, {"_id": 0}))
        except Exception:
            active_regs = [r for r in _in_memory_registrations if r.get("status") == "active"]
    else:
        active_regs = [r for r in _in_memory_registrations if r.get("status") == "active"]

    result = []
    for p in pools_data:
        active_count = len([r for r in active_regs if r.get("pool") == p.get("name")])
        cap = p.get("capacity", 20)
        result.append(
            PoolOccupancy(
                id=p["id"],
                name=p["name"],
                capacity=cap,
                description=p["description"],
                active=active_count,
                available=max(0, cap - active_count)
            )
        )
    return result


# ─── REGISTRATIONS ────────────────────────────────────────────────

@app.get("/api/registrations")
def get_registrations(
    search: Optional[str] = Query(None),
    pool: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    passType: Optional[str] = Query(None),
    paymentMethod: Optional[str] = Query(None)
):
    regs = []
    if is_db_connected():
        try:
            col = get_registrations_col()
            if col.count_documents({}) == 0:
                col.insert_many([dict(r) for r in _in_memory_registrations])
            query = {}
            if pool and pool != "All":
                query["pool"] = pool
            if status and status != "All":
                query["status"] = status
            if passType and passType != "All":
                query["passType"] = passType
            if paymentMethod and paymentMethod != "All":
                query["paymentMethod"] = paymentMethod
            regs = list(col.find(query, {"_id": 0}).sort("createdAt", -1))
        except Exception:
            regs = list(_in_memory_registrations)
    else:
        regs = list(_in_memory_registrations)

    # In-memory filter fallback / search query
    filtered = []
    for r in regs:
        if pool and pool != "All" and r.get("pool") != pool:
            continue
        if status and status != "All" and r.get("status") != status:
            continue
        if passType and passType != "All" and r.get("passType") != passType:
            continue
        if paymentMethod and paymentMethod != "All" and r.get("paymentMethod") != paymentMethod:
            continue
        if search:
            q = search.lower().strip()
            if q not in r.get("name", "").lower() and q not in r.get("phone", "") and q not in r.get("passId", "").lower():
                continue
        filtered.append(r)

    # Sort descending
    filtered.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return filtered


@app.post("/api/registrations", status_code=status.HTTP_201_CREATED)
def create_registration(reg_in: RegistrationCreate):
    # Verify pool capacity
    occupancies = get_occupancy()
    target_pool = next((p for p in occupancies if p.name == reg_in.pool), None)
    if target_pool and target_pool.active >= target_pool.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{reg_in.pool} is at maximum capacity ({target_pool.capacity} swimmers)."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    pass_id = generate_pass_id()
    amount = 150.0 if reg_in.passType == "hourly" else 300.0
    expiry_iso = calculate_expiry(now_iso, reg_in.passType)

    new_reg = {
        "id": f"reg-{int(datetime.now().timestamp()*1000)}",
        "passId": pass_id,
        "name": reg_in.name.strip(),
        "phone": reg_in.phone.strip(),
        "pool": reg_in.pool,
        "passType": reg_in.passType,
        "amount": amount,
        "paymentMethod": reg_in.paymentMethod,
        "entryTime": now_iso,
        "expiryTime": expiry_iso,
        "status": "active",
        "createdAt": now_iso,
        "updatedAt": now_iso,
        "checkoutTime": None,
        "cancelReason": None,
        "cancelledAt": None,
        "extensionHistory": []
    }

    if is_db_connected():
        try:
            col = get_registrations_col()
            col.insert_one(dict(new_reg))
        except Exception as e:
            # Fallback to in-memory
            _in_memory_registrations.insert(0, new_reg)
    else:
        _in_memory_registrations.insert(0, new_reg)

    return new_reg


@app.patch("/api/registrations/{reg_id}/checkout")
def checkout_swimmer(reg_id: str):
    now_iso = datetime.now(timezone.utc).isoformat()

    if is_db_connected():
        try:
            col = get_registrations_col()
            res = col.find_one_and_update(
                {"id": reg_id},
                {"$set": {"status": "completed", "checkoutTime": now_iso, "updatedAt": now_iso}},
                {"_id": 0}
            )
            if res:
                res["status"] = "completed"
                res["checkoutTime"] = now_iso
                return res
        except Exception:
            pass

    for r in _in_memory_registrations:
        if r["id"] == reg_id:
            r["status"] = "completed"
            r["checkoutTime"] = now_iso
            r["updatedAt"] = now_iso
            return r

    raise HTTPException(status_code=404, detail="Registration not found.")


@app.patch("/api/registrations/{reg_id}/extend")
def extend_pass(reg_id: str, req: ExtensionRequest):
    now_iso = datetime.now(timezone.utc).isoformat()
    new_expiry = calculate_expiry(now_iso, req.type)
    add_amount = 150.0 if req.type == "hourly" else 300.0

    history_item = {
        "type": "Hourly Extension" if req.type == "hourly" else "Full-Day Upgrade",
        "time": now_iso,
        "amount": add_amount,
        "paymentMethod": req.paymentMethod
    }

    if is_db_connected():
        try:
            col = get_registrations_col()
            res = col.find_one_and_update(
                {"id": reg_id},
                {
                    "$set": {"expiryTime": new_expiry, "updatedAt": now_iso},
                    "$push": {"extensionHistory": history_item}
                },
                {"_id": 0}
            )
            if res:
                res["expiryTime"] = new_expiry
                res.setdefault("extensionHistory", []).append(history_item)
                return res
        except Exception:
            pass

    for r in _in_memory_registrations:
        if r["id"] == reg_id:
            r["expiryTime"] = new_expiry
            r["updatedAt"] = now_iso
            r.setdefault("extensionHistory", []).append(history_item)
            return r

    raise HTTPException(status_code=404, detail="Registration not found.")


@app.patch("/api/registrations/{reg_id}/cancel")
def cancel_pass(reg_id: str, req: CancelRequest):
    now_iso = datetime.now(timezone.utc).isoformat()

    if is_db_connected():
        try:
            col = get_registrations_col()
            res = col.find_one_and_update(
                {"id": reg_id},
                {
                    "$set": {
                        "status": "cancelled",
                        "cancelReason": req.reason.strip(),
                        "cancelledAt": now_iso,
                        "updatedAt": now_iso
                    }
                },
                {"_id": 0}
            )
            if res:
                res["status"] = "cancelled"
                res["cancelReason"] = req.reason.strip()
                res["cancelledAt"] = now_iso
                return res
        except Exception:
            pass

    for r in _in_memory_registrations:
        if r["id"] == reg_id:
            r["status"] = "cancelled"
            r["cancelReason"] = req.reason.strip()
            r["cancelledAt"] = now_iso
            r["updatedAt"] = now_iso
            return r

    raise HTTPException(status_code=404, detail="Registration not found.")


# ─── SEED ROUTE ───────────────────────────────────────────────────

@app.post("/api/seed")
def seed_database():
    if not is_db_connected():
        return {"success": False, "message": "MongoDB Atlas is not connected yet."}

    pools_col = get_pools_col()
    regs_col = get_registrations_col()

    pools_col.delete_many({})
    pools_col.insert_many([dict(p) for p in mock_pools])

    regs_col.delete_many({})
    regs_col.insert_many([dict(r) for r in generate_seed_registrations()])

    return {
        "success": True,
        "message": f"Successfully initialized Atlas database '{DATABASE_NAME}' with pools and registrations."
    }
