from fastapi import APIRouter, HTTPException, Depends
from middleware.auth_middleware import require_auth

router = APIRouter()

@router.get("/overview")
async def get_overview(user: dict = Depends(require_auth), venue_id: str = None):
    """Manager Dashboard - Overview KPIs"""
    # TODO: Implement manager overview
    return {
        "message": "Manager Dashboard - Coming soon",
        "kpis": {
            "revenue_total": 0,
            "ticket_average": 0,
            "guests_unique": 0,
            "tabs_open": 0
        }
    }

@router.get("/catalog")
async def get_catalog(user: dict = Depends(require_auth), venue_id: str = None):
    """Get venue catalog/menu"""
    # TODO: Implement catalog retrieval
    return {"items": []}
