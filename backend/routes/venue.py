from fastapi import APIRouter, HTTPException, Depends, Form
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
from datetime import datetime, timezone, timedelta
import uuid
import json
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
    "super_admin": 100, "platform_admin": 90, "ceo": 80, "owner": 70,
    "manager": 60, "host": 30, "tap": 30, "bartender": 30,
    "server": 30, "kitchen": 30, "cashier": 30,
}


def _user_has_access(user: dict, module: dict) -> bool:
    roles = user.get("roles", [])
    for r in roles:
        role_name = r.get("role", "")
        role_level = ROLE_HIERARCHY.get(role_name, 0)
        if role_level >= 90:
            return True
        if module["permission"]:
            perms = r.get("permissions", {})
            if isinstance(perms, str):
                try:
                    perms = json.loads(perms)
                except Exception:
                    perms = {}
            if perms.get(module["permission"]):
                return True
        if module["min_role"]:
            min_level = ROLE_HIERARCHY.get(module["min_role"], 100)
            if role_level >= min_level:
                return True
    return False


def _serialize_dt(obj):
    """Convert datetime fields to ISO strings."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


@router.get("/home")
async def venue_home(user: dict = Depends(require_auth)):
    db = get_mongo_db()
    pool = get_postgres_pool()
    roles = user.get("roles", [])

    venue_ids = []
    company_ids = []
    for r in roles:
        if r.get("venue_id"):
            venue_ids.append(r["venue_id"])
        if r.get("company_id"):
            company_ids.append(r["company_id"])

    venues = []
    if venue_ids:
        for vid in set(venue_ids):
            cfg = await db.venue_configs.find_one({"venue_id": vid}, {"_id": 0})
            if cfg:
                venues.append({"id": vid, "name": cfg.get("venue_name", "Venue")})
            else:
                v = await db.venues.find_one({"id": vid}, {"_id": 0})
                venues.append({"id": vid, "name": v.get("name", "Venue") if v else "Venue"})

    if not venues and company_ids:
        for cid in set(company_ids):
            async with pool.acquire() as conn:
                company = await conn.fetchrow("SELECT id, name FROM companies WHERE id = $1::uuid", cid)
            if company:
                venues.append({"id": cid, "name": str(company["name"])})

    active_venue = venues[0] if venues else {"id": None, "name": "No Venue"}
    modules = []
    for m in MODULE_DEFS:
        has_access = _user_has_access(user, m)
        modules.append({
            "key": m["key"], "name": m["name"], "description": m["description"],
            "enabled": has_access,
            "locked_reason": None if has_access else "Upgrade required or no access",
        })

    return {
        "venues": venues, "active_venue": active_venue, "modules": modules,
        "user_email": user.get("email", ""),
        "user_role": roles[0]["role"] if roles else "unknown",
    }


# ─── Events ──────────────────────────────────────────────────────
@router.get("/{venue_id}/events")
async def list_events(venue_id: str, date: str = None, user: dict = Depends(require_auth)):
    db = get_mongo_db()
    query = {"venue_id": venue_id}
    if date:
        day_start = datetime.strptime(date, "%Y-%m-%d").replace(hour=0, minute=0, second=0, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        query["start_at"] = {"$gte": day_start, "$lt": day_end}
    cursor = db.events.find(query, {"_id": 0}).sort("start_at", -1)
    events = await cursor.to_list(100)
    for e in events:
        for k in ("start_at", "end_at", "created_at", "updated_at"):
            if isinstance(e.get(k), datetime):
                e[k] = e[k].isoformat()
    return {"events": events, "total": len(events)}


@router.post("/{venue_id}/events")
async def create_event(
    venue_id: str,
    user: dict = Depends(require_auth),
    name: str = Form(...),
    date: str = Form(...),
    cover_price: float = Form(0),
    cover_consumption_price: float = Form(0),
    card_mode: str = Form("temporary"),
):
    db = get_mongo_db()
    now = datetime.now(timezone.utc)
    start = datetime.strptime(date, "%Y-%m-%d").replace(hour=22, minute=0, tzinfo=timezone.utc)
    event = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "name": name,
        "start_at": start,
        "end_at": None,
        "cover_price": cover_price,
        "cover_consumption_price": cover_consumption_price,
        "card_mode": card_mode,
        "is_active": True,
        "created_at": now,
    }
    await db.events.insert_one(event)
    event.pop("_id", None)
    for k in ("start_at", "end_at", "created_at"):
        if isinstance(event.get(k), datetime):
            event[k] = event[k].isoformat()
    return event


@router.get("/{venue_id}/events/dates")
async def get_event_dates(venue_id: str, month: str = None, user: dict = Depends(require_auth)):
    """Get dates that have events for calendar highlighting."""
    db = get_mongo_db()
    query = {"venue_id": venue_id}
    if month:
        year, m = int(month.split("-")[0]), int(month.split("-")[1])
        start = datetime(year, m, 1, tzinfo=timezone.utc)
        if m == 12:
            end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(year, m + 1, 1, tzinfo=timezone.utc)
        query["start_at"] = {"$gte": start, "$lt": end}
    cursor = db.events.find(query, {"_id": 0, "start_at": 1})
    events = await cursor.to_list(200)
    dates = list(set(e["start_at"].strftime("%Y-%m-%d") for e in events if isinstance(e.get("start_at"), datetime)))
    return {"dates": sorted(dates)}
