from fastapi import APIRouter, HTTPException, Depends
from middleware.auth_middleware import require_auth
from database import get_mongo_db
from models.requests import GuestIntakeRequest, GuestSearchRequest
import uuid
from datetime import datetime, timezone

router = APIRouter()

@router.post("/guest/intake")
async def guest_intake(request: GuestIntakeRequest, user: dict = Depends(require_auth)):
    """Club/Restaurant Host - Guest intake"""
    # TODO: Implement full Pulse guest intake flow
    return {"message": "Pulse module - Coming soon", "guest_id": str(uuid.uuid4())}

@router.post("/guest/search")
async def search_guests(request: GuestSearchRequest, user: dict = Depends(require_auth)):
    """Search for existing guests (dedupe)"""
    # TODO: Implement venue-only guest search
    return {"matches": []}

@router.get("/guest/{guest_id}")
async def get_guest(guest_id: str, user: dict = Depends(require_auth)):
    """Get guest details with risk/value signals"""
    # TODO: Implement guest profile with chips
    return {"message": "Guest profile - Coming soon"}
