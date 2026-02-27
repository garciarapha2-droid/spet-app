from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, List
from datetime import datetime
from uuid import UUID

# Auth requests
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    company_name: Optional[str] = None

# Guest/Pulse requests
class GuestIntakeRequest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    photo_url: Optional[str] = None
    entry_type: str  # vip, cover, cover_consumption, consumption_only
    cover_paid: bool = False
    event_id: str

class GuestSearchRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    venue_id: str

# TAP requests
class TapSessionCreateRequest(BaseModel):
    venue_id: str
    event_id: Optional[str] = None
    nfc_card_id: Optional[str] = None
    guest_id: Optional[str] = None
    session_type: str = 'tap'  # tap, table
    table_id: Optional[str] = None

class TapItemAddRequest(BaseModel):
    tap_session_id: str
    catalog_item_id: str
    qty: int = 1
    seat_number: Optional[int] = None
    notes: Optional[str] = None

class TapPaymentRequest(BaseModel):
    tap_session_id: str
    amount: float
    method: str  # cash, card, comp, other
    external_ref: Optional[str] = None

# Catalog requests
class CatalogItemCreate(BaseModel):
    name: str
    category: str
    price: float
    is_alcohol: bool = False
    send_to_kds: bool = False
    kds_station_id: Optional[str] = None
    prep_time_min: Optional[int] = None
    photo_url: Optional[str] = None
    description: Optional[str] = None
    active: bool = True

# Event Wallet requests
class WalletTopUpRequest(BaseModel):
    wallet_id: str
    amount: float
    description: Optional[str] = None

class WalletDebitRequest(BaseModel):
    wallet_id: str
    amount: float
    description: Optional[str] = None

# Billing requests
class CheckoutSessionRequest(BaseModel):
    company_id: str
    plan_key: str  # pulse_monthly, tap_monthly, etc
    success_url: str
    cancel_url: str
    metadata: Optional[Dict] = {}
