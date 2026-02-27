from fastapi import APIRouter, HTTPException, Depends, Form
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
from datetime import datetime, timezone, date
import uuid
import json as json_mod
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def _parse_meta(raw):
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            return json_mod.loads(raw)
        except (json_mod.JSONDecodeError, TypeError):
            return {}
    return {}


VENUE_UUID = uuid.UUID("40a24e04-75b6-435d-bfff-ab0d469ce543")


# ─── B0: Venue TAP config & stats ────────────────────────────────
@router.get("/config")
async def get_tap_config(venue_id: str, user: dict = Depends(require_auth)):
    """B0 — Get venue TAP configuration (bar mode, policies)."""
    db = get_mongo_db()
    cfg = await db.venue_configs.find_one({"venue_id": venue_id}, {"_id": 0})
    bar_mode = cfg.get("bar_mode", "disco") if cfg else "disco"
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
    pool = get_postgres_pool()
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    vid = uuid.UUID(venue_id)

    async with pool.acquire() as conn:
        open_tabs = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id = $1 AND status = 'open'", vid
        )
        running = await conn.fetchval(
            "SELECT COALESCE(SUM(total), 0) FROM tap_sessions WHERE venue_id = $1 AND status = 'open'", vid
        )
        closed_today = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id = $1 AND status = 'closed' AND closed_at >= $2",
            vid, today_start
        )
        revenue = await conn.fetchval(
            "SELECT COALESCE(SUM(total), 0) FROM tap_sessions WHERE venue_id = $1 AND status = 'closed' AND closed_at >= $2",
            vid, today_start
        )

    return {
        "open_tabs": open_tabs,
        "running_total": float(running),
        "closed_today": closed_today,
        "revenue_today": float(revenue),
    }


# ─── Catalog (MongoDB — non-transactional config) ────────────────
@router.get("/catalog")
async def get_catalog(venue_id: str, user: dict = Depends(require_auth)):
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


# ─── B1: Tab (session) management — ALL in PostgreSQL ─────────────
@router.post("/session/open")
async def open_tab(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    guest_name: str = Form("Guest"),
    guest_id: str = Form(None),
    table_id: str = Form(None),
    nfc_card_id: str = Form(None),
    session_type: str = Form("tap"),
):
    """B1 — Open a new tab/session in PG."""
    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)
    staff_id = uuid.UUID(user["sub"])

    meta_json = json_mod.dumps({"guest_name": guest_name})

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO tap_sessions
               (venue_id, guest_id, nfc_card_id, table_id, session_type,
                opened_by_user_id, status, meta)
               VALUES ($1, $2, $3, $4, $5, $6, 'open', $7::jsonb)
               RETURNING id, opened_at""",
            vid,
            uuid.UUID(guest_id) if guest_id else None,
            uuid.UUID(nfc_card_id) if nfc_card_id else None,
            uuid.UUID(table_id) if table_id else None,
            session_type,
            staff_id,
            meta_json,
        )

    return {
        "session_id": str(row["id"]),
        "guest_name": guest_name,
        "status": "open",
        "opened_at": row["opened_at"].isoformat(),
    }


@router.get("/sessions")
async def list_sessions(
    venue_id: str,
    status: str = "open",
    user: dict = Depends(require_auth),
):
    """B1 — List open/closed tabs for a venue."""
    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT s.id, s.status, s.session_type, s.total, s.subtotal,
                      s.opened_at, s.closed_at, s.meta
               FROM tap_sessions s
               WHERE s.venue_id = $1 AND s.status = $2
               ORDER BY s.opened_at DESC""",
            vid, status,
        )

    sessions = []
    for r in rows:
        raw_meta = r["meta"]
        meta = _parse_meta(raw_meta)
        sessions.append({
            "id": str(r["id"]),
            "guest_name": meta.get("guest_name", "Guest"),
            "status": r["status"],
            "session_type": r["session_type"],
            "total": float(r["total"]),
            "subtotal": float(r["subtotal"]),
            "opened_at": r["opened_at"].isoformat() if r["opened_at"] else None,
            "closed_at": r["closed_at"].isoformat() if r["closed_at"] else None,
        })
    return {"sessions": sessions, "total": len(sessions)}


@router.get("/session/{session_id}")
async def get_session(session_id: str, user: dict = Depends(require_auth)):
    """B1 — Get tab details with items."""
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            """SELECT id, venue_id, status, session_type, total, subtotal,
                      opened_at, closed_at, meta
               FROM tap_sessions WHERE id = $1""",
            sid,
        )
        if not session:
            raise HTTPException(404, "Session not found")

        items = await conn.fetch(
            """SELECT id, item_name, category, unit_price, qty, line_total,
                      is_alcohol, notes, created_at
               FROM tap_items
               WHERE tap_session_id = $1 AND voided_at IS NULL
               ORDER BY created_at""",
            sid,
        )

    raw_meta = session["meta"]
    meta = _parse_meta(raw_meta)
    return {
        "id": str(session["id"]),
        "venue_id": str(session["venue_id"]),
        "guest_name": meta.get("guest_name", "Guest"),
        "status": session["status"],
        "session_type": session["session_type"],
        "total": float(session["total"]),
        "subtotal": float(session["subtotal"]),
        "opened_at": session["opened_at"].isoformat() if session["opened_at"] else None,
        "closed_at": session["closed_at"].isoformat() if session["closed_at"] else None,
        "items": [
            {
                "id": str(it["id"]),
                "name": it["item_name"],
                "category": it["category"],
                "unit_price": float(it["unit_price"]),
                "qty": it["qty"],
                "line_total": float(it["line_total"]),
                "is_alcohol": it["is_alcohol"],
                "notes": it["notes"],
                "created_at": it["created_at"].isoformat() if it["created_at"] else None,
            }
            for it in items
        ],
    }


@router.post("/session/{session_id}/add")
async def add_item_to_tab(
    session_id: str,
    user: dict = Depends(require_auth),
    item_id: str = Form(...),
    qty: int = Form(1),
    notes: str = Form(None),
):
    """B1 — Add catalog item to an open tab (item in PG, catalog in MongoDB)."""
    db = get_mongo_db()
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    staff_id = uuid.UUID(user["sub"])

    # Verify session exists and is open
    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, venue_id, status FROM tap_sessions WHERE id = $1", sid
        )
    if not session:
        raise HTTPException(404, "Session not found")
    if session["status"] != "open":
        raise HTTPException(400, "Tab is closed")

    # Get catalog item from MongoDB
    catalog_item = await db.venue_catalog.find_one(
        {"id": item_id, "venue_id": str(session["venue_id"])}, {"_id": 0}
    )
    if not catalog_item:
        raise HTTPException(404, "Catalog item not found")

    line_total = catalog_item["price"] * qty

    # Insert line item and update session total in PG
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow(
            """INSERT INTO tap_items
               (venue_id, tap_session_id, catalog_item_id, item_name, category,
                unit_price, qty, line_total, is_alcohol, notes, created_by_user_id)
               VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11)
               RETURNING id""",
            session["venue_id"], sid, uuid.UUID(item_id),
            catalog_item["name"], catalog_item["category"],
            catalog_item["price"], qty, line_total,
            catalog_item.get("is_alcohol", False), notes, staff_id,
        )
        # Update session totals
        await conn.execute(
            """UPDATE tap_sessions
               SET subtotal = subtotal + $1, total = subtotal + $1
               WHERE id = $2""",
            line_total, sid,
        )
        new_total = await conn.fetchval("SELECT total FROM tap_sessions WHERE id = $1", sid)

    return {
        "line_item_id": str(item_row["id"]),
        "name": catalog_item["name"],
        "qty": qty,
        "line_total": float(line_total),
        "session_total": float(new_total),
    }


@router.post("/session/{session_id}/close")
async def close_tab(
    session_id: str,
    user: dict = Depends(require_auth),
    payment_method: str = Form("card"),
):
    """B1 — Close tab: update session + record payment in PG."""
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    staff_id = uuid.UUID(user["sub"])
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, venue_id, total, status FROM tap_sessions WHERE id = $1", sid
        )
        if not session:
            raise HTTPException(404, "Session not found")
        if session["status"] != "open":
            raise HTTPException(400, "Tab already closed")

        # Close session
        await conn.execute(
            """UPDATE tap_sessions
               SET status = 'closed', closed_at = $1, closed_by_user_id = $2
               WHERE id = $3""",
            now, staff_id, sid,
        )

        # Record payment
        await conn.execute(
            """INSERT INTO tap_payments
               (venue_id, tap_session_id, amount, method, paid_by_user_id, paid_at)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            session["venue_id"], sid, session["total"], payment_method, staff_id, now,
        )

    return {
        "session_id": str(sid),
        "status": "closed",
        "total": float(session["total"]),
        "payment_method": payment_method,
        "closed_at": now.isoformat(),
    }


# ─── Active sessions ───────────────────────────────────────────────
@router.get("/sessions/active")
async def get_active_sessions(venue_id: str, user: dict = Depends(require_auth)):
    """List all open sessions for a venue."""
    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT s.id, s.guest_id, s.status, s.total, s.opened_at, s.meta
               FROM tap_sessions s WHERE s.venue_id = $1 AND s.status = 'open'
               ORDER BY s.opened_at DESC""",
            vid,
        )

    sessions = []
    for r in rows:
        meta = _parse_meta(r["meta"])
        sessions.append({
            "session_id": str(r["id"]),
            "guest_name": meta.get("guest_name", "Guest"),
            "total": float(r["total"]),
            "opened_at": r["opened_at"].isoformat() if r["opened_at"] else None,
        })
    return {"sessions": sessions, "total": len(sessions)}


# ─── Add custom item (no catalog) ─────────────────────────────────
@router.post("/session/{session_id}/add-custom")
async def add_custom_item(
    session_id: str,
    user: dict = Depends(require_auth),
    item_name: str = Form(...),
    category: str = Form("Drinks"),
    unit_price: float = Form(...),
    qty: int = Form(1),
    notes: str = Form(None),
):
    """Add a custom item (not from catalog) to an open tab."""
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    staff_id = uuid.UUID(user["sub"])

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, venue_id, status FROM tap_sessions WHERE id = $1", sid
        )
    if not session:
        raise HTTPException(404, "Session not found")
    if session["status"] != "open":
        raise HTTPException(400, "Tab is closed")

    is_alcohol = category.lower() not in ("sem alcool", "comida", "no alcohol", "food")
    line_total = unit_price * qty

    async with pool.acquire() as conn:
        item_row = await conn.fetchrow(
            """INSERT INTO tap_items
               (venue_id, tap_session_id, item_name, category,
                unit_price, qty, line_total, is_alcohol, notes, created_by_user_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               RETURNING id""",
            session["venue_id"], sid, item_name, category,
            unit_price, qty, line_total, is_alcohol, notes, staff_id,
        )
        await conn.execute(
            """UPDATE tap_sessions
               SET subtotal = subtotal + $1, total = subtotal + $1
               WHERE id = $2""",
            line_total, sid,
        )
        new_total = await conn.fetchval("SELECT total FROM tap_sessions WHERE id = $1", sid)

    return {
        "line_item_id": str(item_row["id"]),
        "name": item_name,
        "qty": qty,
        "line_total": float(line_total),
        "session_total": float(new_total),
    }
