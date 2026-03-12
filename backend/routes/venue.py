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
        # Admins and owners have access to all modules
        if role_level >= 70:
            return True
        # Permission-based access
        if module["permission"]:
            perms = r.get("permissions", {})
            if isinstance(perms, str):
                try:
                    perms = json.loads(perms)
                except Exception:
                    perms = {}
            if perms.get(module["permission"]):
                return True
        # Role-based access
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

    # Check venue-level module configs (set by CEO)
    venue_enabled_modules = None
    if active_venue.get("id"):
        venue_cfg = await db.venue_configs.find_one({"venue_id": active_venue["id"]}, {"_id": 0})
        if venue_cfg and "modules" in venue_cfg:
            venue_enabled_modules = set(venue_cfg["modules"])

    modules = []
    for m in MODULE_DEFS:
        has_access = _user_has_access(user, m)
        # If venue has explicit module config, permission-based modules must also be in the venue's allowed list
        if venue_enabled_modules is not None and m["permission"]:
            if m["permission"] not in venue_enabled_modules:
                has_access = False
        modules.append({
            "key": m["key"], "name": m["name"], "description": m["description"],
            "enabled": has_access,
            "locked_reason": None if has_access else "Module not available for this venue",
        })

    return {
        "venues": venues, "active_venue": active_venue, "modules": modules,
        "user_email": user.get("email", ""),
        "user_role": roles[0]["role"] if roles else "unknown",
    }



@router.get("/check-module/{module_key}")
async def check_module_access(module_key: str, venue_id: str = None, user: dict = Depends(require_auth)):
    """Check if the current user has access to a specific module for the given venue."""
    db = get_mongo_db()
    module_def = next((m for m in MODULE_DEFS if m["key"] == module_key), None)
    if not module_def:
        return {"allowed": False, "reason": "Module not found"}

    has_access = _user_has_access(user, module_def)

    if has_access and venue_id and module_def["permission"]:
        venue_cfg = await db.venue_configs.find_one({"venue_id": venue_id}, {"_id": 0})
        if venue_cfg and "modules" in venue_cfg:
            if module_def["permission"] not in venue_cfg["modules"]:
                has_access = False

    return {"allowed": has_access, "module": module_key}


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


# ─── Event Guests (temporal presence) ─────────────────────────────
@router.get("/{venue_id}/events/{event_id}/guests")
async def list_event_guests(venue_id: str, event_id: str, user: dict = Depends(require_auth)):
    """List guests currently assigned to this event (temporal presence)."""
    db = get_mongo_db()
    cursor = db.event_guests.find(
        {"venue_id": venue_id, "event_id": event_id}, {"_id": 0}
    ).sort("added_at", -1)
    event_guests = await cursor.to_list(500)

    # Enrich with guest data from venue_guests
    enriched = []
    for eg in event_guests:
        guest = await db.venue_guests.find_one({"id": eg["guest_id"], "venue_id": venue_id}, {"_id": 0})
        if guest:
            enriched.append({
                "event_guest_id": eg["id"],
                "guest_id": eg["guest_id"],
                "name": guest.get("name", "Unknown"),
                "photo": guest.get("photo"),
                "email": guest.get("email"),
                "phone": guest.get("phone"),
                "visits": guest.get("visits", 0),
                "spend_total": guest.get("spend_total", 0),
                "tags": guest.get("tags", []),
                "added_at": eg["added_at"].isoformat() if isinstance(eg.get("added_at"), datetime) else eg.get("added_at"),
            })

    return {"guests": enriched, "total": len(enriched)}


@router.post("/{venue_id}/events/{event_id}/guests")
async def add_guest_to_event(
    venue_id: str,
    event_id: str,
    user: dict = Depends(require_auth),
    guest_id: str = Form(...),
):
    """Add an existing Pulse guest to an event (temporal presence)."""
    db = get_mongo_db()
    now = datetime.now(timezone.utc)

    # Verify guest exists in Pulse
    guest = await db.venue_guests.find_one({"id": guest_id, "venue_id": venue_id}, {"_id": 0})
    if not guest:
        raise HTTPException(404, "Guest not found in Pulse")

    # Verify event exists
    event = await db.events.find_one({"id": event_id, "venue_id": venue_id}, {"_id": 0})
    if not event:
        raise HTTPException(404, "Event not found")

    # Check if already added
    existing = await db.event_guests.find_one({"event_id": event_id, "guest_id": guest_id})
    if existing:
        raise HTTPException(400, "Guest already in this event")

    eg_doc = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "event_id": event_id,
        "guest_id": guest_id,
        "added_by": user.get("sub"),
        "added_at": now,
    }
    await db.event_guests.insert_one(eg_doc)
    eg_doc.pop("_id", None)
    eg_doc["added_at"] = now.isoformat()

    return {"event_guest_id": eg_doc["id"], "guest_id": guest_id, "name": guest["name"]}


@router.delete("/{venue_id}/events/{event_id}/guests/{guest_id}")
async def remove_guest_from_event(
    venue_id: str, event_id: str, guest_id: str,
    user: dict = Depends(require_auth),
):
    """Remove a guest from an event (discard temporal presence)."""
    db = get_mongo_db()
    result = await db.event_guests.delete_one({"event_id": event_id, "guest_id": guest_id, "venue_id": venue_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Guest not found in this event")
    return {"deleted": True, "guest_id": guest_id, "event_id": event_id}


@router.post("/{venue_id}/events/{event_id}/end")
async def end_event(
    venue_id: str, event_id: str,
    user: dict = Depends(require_auth),
):
    """End an event — discard all temporal guest presence (guest data remains in Pulse)."""
    db = get_mongo_db()
    now = datetime.now(timezone.utc)

    event = await db.events.find_one({"id": event_id, "venue_id": venue_id})
    if not event:
        raise HTTPException(404, "Event not found")

    # Mark event as ended
    await db.events.update_one(
        {"id": event_id},
        {"$set": {"is_active": False, "end_at": now, "updated_at": now}},
    )

    # Discard temporal guest presence
    delete_result = await db.event_guests.delete_many({"event_id": event_id, "venue_id": venue_id})

    return {
        "event_id": event_id,
        "ended": True,
        "guests_cleared": delete_result.deleted_count,
        "ended_at": now.isoformat(),
    }


# ─── Event Staff (per-event assignment with snapshot) ─────────────
@router.get("/{venue_id}/events/{event_id}/staff")
async def list_event_staff(venue_id: str, event_id: str, user: dict = Depends(require_auth)):
    """List staff assigned to this event with their role and hourly rate snapshot."""
    db = get_mongo_db()
    cursor = db.event_staff.find(
        {"venue_id": venue_id, "event_id": event_id}, {"_id": 0}
    ).sort("assigned_at", -1)
    staff = await cursor.to_list(100)

    # Enrich with staff name from venue_barmen
    enriched = []
    for s in staff:
        barman = await db.venue_barmen.find_one({"id": s["staff_id"], "venue_id": venue_id}, {"_id": 0})
        enriched.append({
            "event_staff_id": s["id"],
            "staff_id": s["staff_id"],
            "name": barman.get("name", "Unknown") if barman else s.get("name", "Unknown"),
            "role": s["role"],
            "hourly_rate": s["hourly_rate"],
            "assigned_at": s["assigned_at"].isoformat() if isinstance(s.get("assigned_at"), datetime) else s.get("assigned_at"),
        })

    return {"staff": enriched, "total": len(enriched)}


@router.post("/{venue_id}/events/{event_id}/staff")
async def assign_staff_to_event(
    venue_id: str,
    event_id: str,
    user: dict = Depends(require_auth),
    staff_id: str = Form(...),
    role: str = Form(...),
    hourly_rate: float = Form(...),
):
    """Assign a staff member to an event with role and hourly rate snapshot."""
    db = get_mongo_db()
    now = datetime.now(timezone.utc)

    # Verify staff exists
    barman = await db.venue_barmen.find_one({"id": staff_id, "venue_id": venue_id}, {"_id": 0})
    if not barman:
        raise HTTPException(404, "Staff member not found")

    # Verify event exists
    event = await db.events.find_one({"id": event_id, "venue_id": venue_id}, {"_id": 0})
    if not event:
        raise HTTPException(404, "Event not found")

    # Check if already assigned
    existing = await db.event_staff.find_one({"event_id": event_id, "staff_id": staff_id})
    if existing:
        raise HTTPException(400, "Staff already assigned to this event")

    es_doc = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "event_id": event_id,
        "staff_id": staff_id,
        "name": barman.get("name", "Unknown"),
        "role": role,
        "hourly_rate": hourly_rate,
        "assigned_by": user.get("sub"),
        "assigned_at": now,
    }
    await db.event_staff.insert_one(es_doc)
    es_doc.pop("_id", None)
    es_doc["assigned_at"] = now.isoformat()

    return es_doc


@router.delete("/{venue_id}/events/{event_id}/staff/{staff_id}")
async def remove_staff_from_event(
    venue_id: str, event_id: str, staff_id: str,
    user: dict = Depends(require_auth),
):
    """Remove a staff member from an event."""
    db = get_mongo_db()
    result = await db.event_staff.delete_one({"event_id": event_id, "staff_id": staff_id, "venue_id": venue_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Staff not found in this event")
    return {"deleted": True, "staff_id": staff_id, "event_id": event_id}
