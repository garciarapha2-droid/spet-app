from fastapi import APIRouter, HTTPException, Depends
from middleware.auth_middleware import require_auth

router = APIRouter()

@router.get("/dashboard")
async def get_ceo_dashboard(user: dict = Depends(require_auth)):
    """CEO Dashboard - Platform-wide metrics"""
    # Check if user has platform_admin or ceo role
    if not any(role.get('role') in ['platform_admin', 'ceo'] for role in user.get('roles', [])):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # TODO: Implement CEO dashboard
    return {
        "message": "CEO Dashboard - Coming soon",
        "kpis": {
            "companies_active": 0,
            "venues_active": 0,
            "mrr": 0,
            "profit_net": 0,
            "churn_rate": 0
        },
        "module_adoption": []
    }

@router.get("/companies")
async def get_companies(user: dict = Depends(require_auth)):
    """Get all companies (platform view)"""
    # TODO: Implement companies list
    return {"companies": []}
