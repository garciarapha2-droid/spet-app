from fastapi import APIRouter, HTTPException, Depends
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

MODULE_DEFS = [
    {"key": "pulse", "name": "Pulse", "description": "Entry, Guests & Identity", "permission": "pulse", "min_role": None},
    {"key": "tap", "name": "TAP", "description": "Bar, Tabs & Checkout", "permission": "tap", "min_role": None},
    {"key": "table", "name": "Table", "description": "Table Management & Orders", "permission": "table", "min_role": None},
    {"key": "kds", "name": "Kitchen (KDS)", "description": "Kitchen Display System", "permission": "kds", "min_role": None},
    {"key": "manager", "name": "Manager", "description": "Venue Operations & Reports", "permission": None, "min_role": "manager"},
    {"key": "owner", "name": "Owner", "description": "Multi-Venue Insights & Analytics", "permission": None, "min_role": "owner"},
    {"key": "ceo", "name": "CEO", "description": "Platform-Wide Metrics", "permission": None, "min_role": "ceo"},
]

ROLE_HIERARCHY = {
    "super_admin": 100,
    "platform_admin": 90,
    "ceo": 80,
    "owner": 70,
    "manager": 60,
    "host": 30,
    "tap": 30,
    "bartender": 30,
    "server": 30,
    "kitchen": 30,
    "cashier": 30,
}


def _user_has_access(user: dict, module: dict) -> bool:
    roles = user.get("roles", [])
    if not roles:
        return False

    for r in roles:
        role_name = r.get("role", "")
        role_level = ROLE_HIERARCHY.get(role_name, 0)

        # Super admin / platform admin get everything
        if role_level >= 90:
            return True

        # Permission-based modules (pulse, tap, table, kds)
        if module["permission"]:
            perms = r.get("permissions", {})
            if isinstance(perms, str):
                import json
                try:
                    perms = json.loads(perms)
                except Exception:
                    perms = {}
            if perms.get(module["permission"]):
                return True

        # Role-based modules (manager, owner, ceo)
        if module["min_role"]:
            min_level = ROLE_HIERARCHY.get(module["min_role"], 100)
            if role_level >= min_level:
                return True

    return False


@router.get("/home")
async def venue_home(user: dict = Depends(require_auth)):
    """Return venue info + available modules for the current user."""
    db = get_mongo_db()
    pool = get_postgres_pool()

    roles = user.get("roles", [])

    # Collect all venue_ids from user's roles
    venue_ids = []
    company_ids = []
    for r in roles:
        if r.get("venue_id"):
            venue_ids.append(r["venue_id"])
        if r.get("company_id"):
            company_ids.append(r["company_id"])

    # Get venue info from MongoDB (venue_configs has venue_name)
    venues = []
    if venue_ids:
        for vid in set(venue_ids):
            cfg = await db.venue_configs.find_one({"venue_id": vid}, {"_id": 0})
            if cfg:
                venues.append({
                    "id": vid,
                    "name": cfg.get("venue_name", "Venue"),
                })
            else:
                # Try venues collection
                v = await db.venues.find_one({"id": vid}, {"_id": 0})
                venues.append({
                    "id": vid,
                    "name": v.get("name", "Venue") if v else "Venue",
                })

    # If no venues found, try getting from companies
    if not venues and company_ids:
        for cid in set(company_ids):
            async with pool.acquire() as conn:
                company = await conn.fetchrow(
                    "SELECT id, name FROM companies WHERE id = $1::uuid", cid
                )
            if company:
                venues.append({
                    "id": cid,
                    "name": str(company["name"]),
                })

    active_venue = venues[0] if venues else {"id": None, "name": "No Venue"}

    # Build modules list with access status
    modules = []
    for m in MODULE_DEFS:
        has_access = _user_has_access(user, m)
        modules.append({
            "key": m["key"],
            "name": m["name"],
            "description": m["description"],
            "enabled": has_access,
            "locked_reason": None if has_access else "Upgrade required or no access",
        })

    return {
        "venues": venues,
        "active_venue": active_venue,
        "modules": modules,
        "user_email": user.get("email", ""),
        "user_role": roles[0]["role"] if roles else "unknown",
    }
