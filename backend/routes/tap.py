from fastapi import APIRouter, HTTPException, Depends, Form, Query
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
from datetime import datetime, timezone, date
import uuid
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── B0: Venue TAP config & stats ────────────────────────────────
@router.get("/config")
async def get_tap_config(venue_id: str, user: dict = Depends(require_auth)):
    """B0 — Get venue TAP configuration (bar mode, policies)."""
    db = get_mongo_db()
    cfg = await db.venue_configs.find_one({"venue_id": venue_id}, {"_id": 0})
    bar_mode = "disco"
    if cfg:
        bar_mode = cfg.get("bar_mode", "disco")
    return {
        "venue_id": venue_id,
        "bar_mode": bar_mode,
        "currency": "BRL",
        "allow_tabs": True,
        "require_nfc": bar_mode == "event",
    }


@router.get("/stats")
async def get_tap_stats(venue_id: str, user: dict = Depends(require_auth)):
    """B0 — Real-time stats for TAP dashboard."""
    db = get_mongo_db()
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    open_tabs = await db.tap_sessions.count_documents({
        "venue_id": venue_id, "status": "open"
    })
    pipeline = [
        {"$match": {"venue_id": venue_id, "status": "open"}},
        {"$group": {"_id": None, "total": {"$sum": "$running_total"}}}
    ]
    agg = await db.tap_sessions.aggregate(pipeline).to_list(1)
    running_total = agg[0]["total"] if agg else 0

    closed_today = await db.tap_sessions.count_documents({
        "venue_id": venue_id, "status": "closed", "closed_at": {"$gte": today_start}
    })
    pipeline_revenue = [
        {"$match": {"venue_id": venue_id, "status": "closed", "closed_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$running_total"}}}
    ]
    agg_rev = await db.tap_sessions.aggregate(pipeline_revenue).to_list(1)
    revenue_today = agg_rev[0]["total"] if agg_rev else 0

    return {
        "open_tabs": open_tabs,
        "running_total": running_total,
        "closed_today": closed_today,
        "revenue_today": revenue_today,
    }


# ─── Catalog ─────────────────────────────────────────────────────
@router.get("/catalog")
async def get_catalog(venue_id: str, user: dict = Depends(require_auth)):
    """Get venue catalog items for TAP ordering."""
    db = get_mongo_db()
    cursor = db.venue_catalog.find(
        {"venue_id": venue_id, "active": True}, {"_id": 0}
    ).sort("category", 1)
    items = await cursor.to_list(200)
    return {"items": items}


@router.post("/catalog")
async def add_catalog_item(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    name: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    is_alcohol: bool = Form(False),
):
    """Add item to venue catalog."""
    db = get_mongo_db()
    item = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "name": name,
        "category": category,
        "price": price,
        "is_alcohol": is_alcohol,
        "active": True,
        "created_at": datetime.now(timezone.utc),
    }
    await db.venue_catalog.insert_one(item)
    return {"id": item["id"], "name": name, "price": price}


# ─── B1: Tab (session) management ────────────────────────────────
@router.post("/session/open")
async def open_tab(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    guest_name: str = Form(None),
    guest_id: str = Form(None),
    table_id: str = Form(None),
    nfc_card_id: str = Form(None),
):
    """B1 — Open a new tab/session."""
    db = get_mongo_db()
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    session = {
        "id": session_id,
        "venue_id": venue_id,
        "guest_name": guest_name or "Guest",
        "guest_id": guest_id,
        "table_id": table_id,
        "nfc_card_id": nfc_card_id,
        "status": "open",
        "items": [],
        "running_total": 0,
        "payments": [],
        "staff_id": user.get("sub"),
        "opened_at": now,
        "closed_at": None,
    }
    await db.tap_sessions.insert_one(session)
    return {
        "session_id": session_id,
        "guest_name": session["guest_name"],
        "status": "open",
        "opened_at": now.isoformat(),
    }


@router.get("/sessions")
async def list_sessions(
    venue_id: str,
    status: str = "open",
    user: dict = Depends(require_auth),
):
    """B1 — List open (or closed) tabs for a venue."""
    db = get_mongo_db()
    query = {"venue_id": venue_id, "status": status}
    cursor = db.tap_sessions.find(query, {"_id": 0}).sort("opened_at", -1)
    sessions = await cursor.to_list(100)
    for s in sessions:
        s["opened_at"] = s["opened_at"].isoformat() if s.get("opened_at") else None
        s["closed_at"] = s["closed_at"].isoformat() if s.get("closed_at") else None
    return {"sessions": sessions, "total": len(sessions)}


@router.get("/session/{session_id}")
async def get_session(session_id: str, user: dict = Depends(require_auth)):
    """B1 — Get tab details with items."""
    db = get_mongo_db()
    session = await db.tap_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")
    session["opened_at"] = session["opened_at"].isoformat() if session.get("opened_at") else None
    session["closed_at"] = session["closed_at"].isoformat() if session.get("closed_at") else None
    return session


@router.post("/session/{session_id}/add")
async def add_item_to_tab(
    session_id: str,
    user: dict = Depends(require_auth),
    item_id: str = Form(...),
    qty: int = Form(1),
    notes: str = Form(None),
):
    """B1 — Add catalog item to an open tab."""
    db = get_mongo_db()
    session = await db.tap_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")
    if session["status"] != "open":
        raise HTTPException(400, "Tab is closed")

    catalog_item = await db.venue_catalog.find_one(
        {"id": item_id, "venue_id": session["venue_id"]}, {"_id": 0}
    )
    if not catalog_item:
        raise HTTPException(404, "Catalog item not found")

    line_item = {
        "id": str(uuid.uuid4()),
        "item_id": item_id,
        "name": catalog_item["name"],
        "category": catalog_item["category"],
        "price": catalog_item["price"],
        "qty": qty,
        "subtotal": catalog_item["price"] * qty,
        "notes": notes,
        "added_at": datetime.now(timezone.utc).isoformat(),
        "staff_id": user.get("sub"),
    }

    new_total = session["running_total"] + line_item["subtotal"]
    await db.tap_sessions.update_one(
        {"id": session_id},
        {"$push": {"items": line_item}, "$set": {"running_total": new_total}},
    )

    return {
        "line_item_id": line_item["id"],
        "name": line_item["name"],
        "qty": qty,
        "subtotal": line_item["subtotal"],
        "running_total": new_total,
    }


@router.post("/session/{session_id}/close")
async def close_tab(
    session_id: str,
    user: dict = Depends(require_auth),
    payment_method: str = Form("card"),
):
    """B1 — Close tab and record payment in PG."""
    db = get_mongo_db()
    pool = get_postgres_pool()
    now = datetime.now(timezone.utc)

    session = await db.tap_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")
    if session["status"] != "open":
        raise HTTPException(400, "Tab already closed")

    # Close in MongoDB
    await db.tap_sessions.update_one(
        {"id": session_id},
        {"$set": {"status": "closed", "closed_at": now}},
    )

    # Record payment in PG for financial audit trail
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO invoice_events
               (venue_id, event_type, amount, currency, payment_method, reference_id, created_at)
               VALUES ($1::uuid, 'tap_checkout', $2, 'BRL', $3, $4, $5)""",
            uuid.UUID(session["venue_id"]),
            session["running_total"],
            payment_method,
            session_id,
            now,
        )

    return {
        "session_id": session_id,
        "status": "closed",
        "total": session["running_total"],
        "payment_method": payment_method,
        "closed_at": now.isoformat(),
    }
