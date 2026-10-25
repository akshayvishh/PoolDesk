from typing import List, Optional
from pydantic import BaseModel, Field

class Pool(BaseModel):
    id: str
    name: str
    capacity: int
    description: str

class PoolOccupancy(Pool):
    active: int
    available: int

class ExtensionItem(BaseModel):
    type: str
    time: str
    amount: float
    paymentMethod: str

class RegistrationCreate(BaseModel):
    name: str = Field(..., min_length=2)
    phone: str = Field(..., pattern=r"^\+?\d{10,13}$")
    pool: str
    passType: str # "hourly" | "fullday"
    paymentMethod: str # "cash" | "online"

class Registration(BaseModel):
    id: str
    passId: str
    name: str
    phone: str
    pool: str
    passType: str
    amount: float
    paymentMethod: str
    entryTime: str
    expiryTime: str
    status: str # "active" | "completed" | "cancelled"
    createdAt: str
    updatedAt: str
    checkoutTime: Optional[str] = None
    cancelReason: Optional[str] = None
    cancelledAt: Optional[str] = None
    extensionHistory: List[ExtensionItem] = []

class ExtensionRequest(BaseModel):
    type: str # "hourly" | "fullday"
    paymentMethod: str # "cash" | "online"

class CancelRequest(BaseModel):
    reason: str = Field(..., min_length=3)

class LoginRequest(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    name: str
    role: str
    station: str
