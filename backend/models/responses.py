from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List, Any
from datetime import datetime
from uuid import UUID

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str = "USER"
    status: str
    created_at: datetime

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    next: Dict

class GuestResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    status: str
    flags: List[str] = []
    total_spend: float = 0
    visits: int = 0
    last_visit: Optional[datetime] = None

class TapSessionResponse(BaseModel):
    id: str
    venue_id: str
    status: str
    session_type: str
    total: float
    opened_at: datetime
    guest: Optional[GuestResponse] = None

class CatalogItemResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    is_alcohol: bool
    photo_url: Optional[str] = None
    active: bool

class EntitlementResponse(BaseModel):
    module: str
    status: str
    scope: str
    active: bool

class SubscriptionResponse(BaseModel):
    id: str
    status: str
    current_period_end: Optional[datetime] = None
    modules: List[EntitlementResponse] = []
