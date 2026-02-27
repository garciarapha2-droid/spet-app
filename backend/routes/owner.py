from fastapi import APIRouter, HTTPException, Depends
from middleware.auth_middleware import require_auth

router = APIRouter()

@router.get("/dashboard")
async def get_owner_dashboard(user: dict = Depends(require_auth), company_id: str = None):
    """Owner Dashboard - Multi-venue aggregated view"""
    # TODO: Implement owner dashboard
    return {
        "message": "Owner Dashboard - Coming soon",
        "kpis": {
            "revenue_total": 0,
            "profit_estimate": 0,
            "venues_active": 0,
            "growth_percent": 0
        },
        "insights": []
    }

@router.get("/venues")
async def get_venues(user: dict = Depends(require_auth), company_id: str = None):
    """Get all venues for owner"""
    # TODO: Implement venues list
    return {"venues": []}
