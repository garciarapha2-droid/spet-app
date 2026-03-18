from fastapi import APIRouter, HTTPException, Depends, Form, UploadFile, File, Request
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
from ws_manager import ws_manager
from datetime import datetime, timezone, date
import uuid
import json as json_mod
import base64
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
        "currency": "USD",
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
    )
    items = await cursor.to_list(200)
    # Sort by fixed category order, then alphabetically within each category
    CATEGORY_ORDER = {
        "Beers": 0, "Cocktails": 1, "Spirits": 2, "Non-alcoholic": 3,
        "Snacks": 4, "Starters": 5, "Mains": 6, "Plates": 7,
    }
    items.sort(key=lambda x: (CATEGORY_ORDER.get(x.get("category", ""), 99), x.get("name", "").lower()))
    return {"items": items}


@router.post("/catalog")
async def add_catalog_item(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    name: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    is_alcohol: bool = Form(False),
    image_url: str = Form(None),
    default_ingredients: str = Form(None),
):
    db = get_mongo_db()
    ingredients_list = []
    if default_ingredients:
        try:
            ingredients_list = json_mod.loads(default_ingredients)
        except Exception:
            ingredients_list = [i.strip() for i in default_ingredients.split(",") if i.strip()]
    item = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "name": name,
        "category": category,
        "price": price,
        "is_alcohol": is_alcohol,
        "image_url": image_url,
        "default_ingredients": ingredients_list,
        "active": True,
        "created_at": datetime.now(timezone.utc),
    }
    await db.venue_catalog.insert_one(item)
    item.pop("_id", None)
    return {"id": item["id"], "name": name, "price": price, "category": category, "image_url": image_url}


@router.put("/catalog/{item_id}")
async def update_catalog_item(
    item_id: str,
    user: dict = Depends(require_auth),
    name: str = Form(None),
    category: str = Form(None),
    price: float = Form(None),
    is_alcohol: bool = Form(None),
    image_url: str = Form(None),
    default_ingredients: str = Form(None),
):
    db = get_mongo_db()
    update = {}
    if name is not None:
        update["name"] = name
    if category is not None:
        update["category"] = category
    if price is not None:
        update["price"] = price
    if is_alcohol is not None:
        update["is_alcohol"] = is_alcohol
    if image_url is not None:
        update["image_url"] = image_url
    if default_ingredients is not None:
        try:
            update["default_ingredients"] = json_mod.loads(default_ingredients)
        except Exception:
            update["default_ingredients"] = [i.strip() for i in default_ingredients.split(",") if i.strip()]
    if not update:
        raise HTTPException(400, "Nothing to update")
    result = await db.venue_catalog.update_one({"id": item_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Item not found")
    return {"id": item_id, "updated": True}


@router.get("/catalog/{item_id}")
async def get_catalog_item(item_id: str, user: dict = Depends(require_auth)):
    """Get single catalog item with ingredients."""
    db = get_mongo_db()
    item = await db.venue_catalog.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Item not found")
    return item


@router.delete("/catalog/{item_id}")
async def delete_catalog_item(item_id: str, user: dict = Depends(require_auth)):
    db = get_mongo_db()
    result = await db.venue_catalog.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Item not found")
    return {"id": item_id, "deleted": True}


@router.post("/catalog/{item_id}/photo")
async def upload_catalog_photo(
    item_id: str,
    user: dict = Depends(require_auth),
    photo: UploadFile = File(...),
):
    """Upload photo for a catalog item — store as base64 data URL."""
    db = get_mongo_db()
    content = await photo.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 5MB)")
    b64 = base64.b64encode(content).decode()
    ct = photo.content_type or "image/jpeg"
    data_url = f"data:{ct};base64,{b64}"
    result = await db.venue_catalog.update_one({"id": item_id}, {"$set": {"image_url": data_url}})
    if result.matched_count == 0:
        raise HTTPException(404, "Item not found")
    return {"id": item_id, "image_url": data_url}


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
    bartender_id: str = Form(None),
    bartender_name: str = Form(None),
):
    """B1 — Open a new tab/session in PG."""
    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)
    staff_id = uuid.UUID(user["sub"])

    async with pool.acquire() as conn:
        # Generate sequential tab number for today
        today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id = $1 AND opened_at >= $2",
            vid, today_start
        )
        tab_number = 100 + count + 1

        meta_dict = {"guest_name": guest_name, "tab_number": tab_number}
        if bartender_id:
            meta_dict["bartender_id"] = bartender_id
        if bartender_name:
            meta_dict["bartender_name"] = bartender_name
        meta_json = json_mod.dumps(meta_dict)

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
        "tab_number": tab_number,
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
            "session_id": str(r["id"]),
            "guest_name": meta.get("guest_name", "Guest"),
            "tab_number": meta.get("tab_number"),
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
    """B1 — Get tab details with items and guest photo."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    sid = uuid.UUID(session_id)

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            """SELECT id, venue_id, status, session_type, total, subtotal,
                      opened_at, closed_at, meta, guest_id
               FROM tap_sessions WHERE id = $1""",
            sid,
        )
        if not session:
            raise HTTPException(404, "Session not found")

        items = await conn.fetch(
            """SELECT id, item_name, category, unit_price, qty, line_total,
                      is_alcohol, notes, modifiers, catalog_item_id, created_at
               FROM tap_items
               WHERE tap_session_id = $1 AND voided_at IS NULL
               ORDER BY created_at""",
            sid,
        )

    raw_meta = session["meta"]
    meta = _parse_meta(raw_meta)

    # Fetch guest photo from MongoDB if guest_id exists
    guest_photo = None
    guest_id_str = str(session["guest_id"]) if session["guest_id"] else None
    if guest_id_str:
        guest_doc = await db.venue_guests.find_one(
            {"id": guest_id_str}, {"_id": 0, "photo": 1, "name": 1}
        )
        if guest_doc:
            guest_photo = guest_doc.get("photo")

    return {
        "id": str(session["id"]),
        "venue_id": str(session["venue_id"]),
        "guest_name": meta.get("guest_name", "Guest"),
        "guest_id": guest_id_str,
        "guest_photo": guest_photo,
        "tab_number": meta.get("tab_number"),
        "status": session["status"],
        "session_type": session["session_type"],
        "total": float(session["total"]),
        "subtotal": float(session["subtotal"]),
        "tip_amount": meta.get("tip_amount", 0),
        "tip_percent": meta.get("tip_percent", 0),
        "tip_recorded": meta.get("tip_recorded", False),
        "opened_at": session["opened_at"].isoformat() if session["opened_at"] else None,
        "closed_at": session["closed_at"].isoformat() if session["closed_at"] else None,
        "id_verified": meta.get("id_verified", False),
        "id_verified_at": meta.get("id_verified_at"),
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
                "modifiers": _parse_meta(it["modifiers"]) if it["modifiers"] else {},
                "catalog_item_id": str(it["catalog_item_id"]) if it["catalog_item_id"] else None,
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
    bartender_id: str = Form(None),
    modifiers: str = Form(None),
):
    """B1 — Add catalog item to an open tab (item in PG, catalog in MongoDB)."""
    db = get_mongo_db()
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    staff_id = uuid.UUID(user["sub"])

    # Parse modifiers JSON
    mods = {}
    if modifiers:
        try:
            mods = json_mod.loads(modifiers)
        except Exception:
            pass

    # Verify session exists and is open
    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, venue_id, status, meta FROM tap_sessions WHERE id = $1", sid
        )
    if not session:
        raise HTTPException(404, "Session not found")
    if session["status"] != "open":
        raise HTTPException(400, "Tab is closed")

    # Store bartender_id in session meta if provided
    if bartender_id:
        meta = _parse_meta(session["meta"])
        if meta.get("bartender_id") != bartender_id:
            meta["bartender_id"] = bartender_id
            # Also store bartender name for display
            barman = await db.venue_barmen.find_one({"id": bartender_id}, {"_id": 0, "name": 1})
            if barman:
                meta["bartender_name"] = barman["name"]
            async with pool.acquire() as conn:
                await conn.execute(
                    "UPDATE tap_sessions SET meta = $1::jsonb WHERE id = $2",
                    json_mod.dumps(meta), sid)

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
                unit_price, qty, line_total, is_alcohol, notes, modifiers, created_by_user_id)
               VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
               RETURNING id""",
            session["venue_id"], sid, uuid.UUID(item_id),
            catalog_item["name"], catalog_item["category"],
            catalog_item["price"], qty, line_total,
            catalog_item.get("is_alcohol", False), notes, json_mod.dumps(mods), staff_id,
        )
        # Update session totals
        await conn.execute(
            """UPDATE tap_sessions
               SET subtotal = subtotal + $1, total = subtotal + $1
               WHERE id = $2""",
            line_total, sid,
        )
        new_total = await conn.fetchval("SELECT total FROM tap_sessions WHERE id = $1", sid)

    # Auto-route to KDS
    try:
        async with pool.acquire() as conn2:
            sess = await conn2.fetchrow("SELECT table_id, meta FROM tap_sessions WHERE id = $1", sid)
        meta = _parse_meta(sess["meta"]) if sess else {}
        await _auto_route_to_kds(
            pool, session["venue_id"], sid, item_row["id"],
            catalog_item["name"], qty, catalog_item.get("is_alcohol", False),
            staff_id, sess["table_id"] if sess else None, meta.get("guest_name", "Guest"),
            notes=notes, modifiers=mods)
    except Exception as e:
        logger.warning(f"KDS auto-route failed: {e}")

    # Broadcast real-time update to Manager
    await ws_manager.broadcast(str(session["venue_id"]), "item_added", {
        "session_id": str(sid), "item": catalog_item["name"], "qty": qty, "total": float(new_total)
    })

    return {
        "line_item_id": str(item_row["id"]),
        "name": catalog_item["name"],
        "qty": qty,
        "line_total": float(line_total),
        "session_total": float(new_total),
    }


async def _auto_route_to_kds(pool, venue_id, session_id, item_row_id, item_name, qty, is_alcohol, staff_id, table_id=None, guest_name=None, notes=None, modifiers=None):
    """Auto-route a single item to KDS. Alcohol→bar, Non-alcohol→kitchen."""
    destination = "bar" if is_alcohol else "kitchen"
    meta_json = json_mod.dumps({"guest_name": guest_name or "Guest"})
    mods_json = json_mod.dumps(modifiers or {})
    async with pool.acquire() as conn:
        ticket = await conn.fetchrow(
            """INSERT INTO kds_tickets
               (venue_id, tap_session_id, table_id, destination, status, created_by_user_id, meta)
               VALUES ($1, $2, $3, $4, 'pending', $5, $6::jsonb)
               RETURNING id""",
            venue_id, session_id, table_id, destination, staff_id, meta_json,
        )
        await conn.execute(
            """INSERT INTO kds_ticket_items (ticket_id, tap_item_id, item_name, qty, notes, modifiers)
               VALUES ($1, $2, $3, $4, $5, $6::jsonb)""",
            ticket["id"], item_row_id, item_name, qty, notes, mods_json,
        )


@router.post("/session/{session_id}/close")
async def close_tab(
    session_id: str,
    user: dict = Depends(require_auth),
    payment_method: str = Form("card"),
    payment_location: str = Form("pay_here"),
    bartender_id: str = Form(None),
):
    """B1 — Close tab: update session + record payment in PG.
    payment_location: 'pay_here' (server's card machine) or 'pay_at_register' (cashier)."""
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    staff_id = uuid.UUID(user["sub"])
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, venue_id, total, status, meta, guest_id FROM tap_sessions WHERE id = $1", sid
        )
        if not session:
            raise HTTPException(404, "Session not found")
        if session["status"] != "open":
            raise HTTPException(400, "Tab already closed")

        # Update meta with payment info
        meta = _parse_meta(session["meta"])
        meta["payment_location"] = payment_location
        meta["payment_method"] = payment_method
        meta["tip_amount"] = 0
        meta["tip_recorded"] = False
        if bartender_id:
            meta["bartender_id"] = bartender_id

        # Close session
        await conn.execute(
            """UPDATE tap_sessions
               SET status = 'closed', closed_at = $1, closed_by_user_id = $2, meta = $3::jsonb
               WHERE id = $4""",
            now, staff_id, json_mod.dumps(meta), sid,
        )

        # Record payment
        await conn.execute(
            """INSERT INTO tap_payments
               (venue_id, tap_session_id, amount, method, paid_by_user_id, paid_at)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            session["venue_id"], sid, session["total"], payment_method, staff_id, now,
        )

    # Update guest spend_total in MongoDB
    if session["guest_id"]:
        db = get_mongo_db()
        await db.venue_guests.update_one(
            {"id": str(session["guest_id"]), "venue_id": str(session["venue_id"])},
            {"$inc": {"spend_total": float(session["total"])}},
        )

    # Broadcast real-time update to Manager
    await ws_manager.broadcast(str(session["venue_id"]), "tab_closed", {
        "session_id": str(sid), "total": float(session["total"]), "method": payment_method
    })

    return {
        "session_id": str(sid),
        "status": "closed",
        "total": float(session["total"]),
        "payment_method": payment_method,
        "payment_location": payment_location,
        "closed_at": now.isoformat(),
        "tip_pending": payment_location == "pay_here",
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


# ─── Update item modifiers ────────────────────────────────────────
@router.put("/session/{session_id}/item/{item_id}")
async def update_item_modifiers(
    session_id: str,
    item_id: str,
    request: Request,
    user: dict = Depends(require_auth),
):
    """Update modifiers, extras, and notes for an order item."""
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    iid = uuid.UUID(item_id)

    body = await request.json()
    modifiers = body.get("modifiers", {})
    notes = body.get("notes")

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, status FROM tap_sessions WHERE id = $1", sid
        )
        if not session:
            raise HTTPException(404, "Session not found")
        if session["status"] != "open":
            raise HTTPException(400, "Tab is closed")

        item = await conn.fetchrow(
            "SELECT id FROM tap_items WHERE id = $1 AND tap_session_id = $2 AND voided_at IS NULL",
            iid, sid,
        )
        if not item:
            raise HTTPException(404, "Item not found")

        await conn.execute(
            "UPDATE tap_items SET modifiers = $1::jsonb, notes = $2 WHERE id = $3",
            json_mod.dumps(modifiers), notes, iid,
        )

        # Also update corresponding KDS ticket items if any
        await conn.execute(
            """UPDATE kds_ticket_items SET modifiers = $1::jsonb, notes = $2
               WHERE tap_item_id = $3""",
            json_mod.dumps(modifiers), notes, iid,
        )

    return {"id": str(iid), "updated": True}


# ─── Void/remove item from session ────────────────────────────────
@router.post("/session/{session_id}/void-item")
async def void_item(
    session_id: str,
    user: dict = Depends(require_auth),
    item_id: str = Form(...),
    reason: str = Form(None),
):
    """Void an item from an open tab (ledger-safe: marks voided, doesn't delete)."""
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    iid = uuid.UUID(item_id)
    staff_id = uuid.UUID(user["sub"])
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, status FROM tap_sessions WHERE id = $1", sid
        )
        if not session:
            raise HTTPException(404, "Session not found")
        if session["status"] != "open":
            raise HTTPException(400, "Tab is closed")

        item = await conn.fetchrow(
            "SELECT id, line_total, item_name FROM tap_items WHERE id = $1 AND tap_session_id = $2 AND voided_at IS NULL",
            iid, sid,
        )
        if not item:
            raise HTTPException(404, "Item not found")

        # Void the item (ledger-safe: mark as voided, record who and why)
        await conn.execute(
            "UPDATE tap_items SET voided_at = $1, voided_by_user_id = $2, void_reason = $3 WHERE id = $4",
            now, staff_id, reason, iid,
        )
        # Reduce session total
        await conn.execute(
            "UPDATE tap_sessions SET subtotal = subtotal - $1, total = total - $1 WHERE id = $2",
            item["line_total"], sid,
        )
        new_total = await conn.fetchval("SELECT total FROM tap_sessions WHERE id = $1", sid)

    return {"item_id": str(iid), "voided": True, "item_name": item["item_name"], "session_total": float(new_total)}


# ─── ID Verification (Table compliance — 21+ for alcohol) ─────────
@router.post("/session/{session_id}/verify-id")
async def verify_id(
    session_id: str,
    user: dict = Depends(require_auth),
):
    """Mark a session as ID-verified for alcohol service (Table only)."""
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    staff_id = uuid.UUID(user["sub"])
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, venue_id, meta, status FROM tap_sessions WHERE id = $1", sid
        )
        if not session:
            raise HTTPException(404, "Session not found")
        if session["status"] != "open":
            raise HTTPException(400, "Session is not open")

        meta = _parse_meta(session["meta"])
        meta["id_verified"] = True
        meta["id_verified_at"] = now.isoformat()
        meta["id_verified_by"] = str(staff_id)

        await conn.execute(
            "UPDATE tap_sessions SET meta = $1::jsonb WHERE id = $2",
            json_mod.dumps(meta), sid,
        )

        # Audit trail
        await conn.execute(
            """INSERT INTO audit_events (event_type, user_id, venue_id, entity_type, entity_id, metadata, timestamp)
               VALUES ('id_verification_event', $1, $2, 'tap_session', $3, $4::jsonb, $5)""",
            staff_id, session["venue_id"], sid,
            json_mod.dumps({"session_id": str(sid), "staff_id": str(staff_id)}),
            now,
        )

    return {
        "session_id": str(sid),
        "id_verified": True,
        "id_verified_at": now.isoformat(),
        "verified_by": str(staff_id),
    }


# ─── Record Tip (post-payment, manual entry by server) ────────────
@router.post("/session/{session_id}/record-tip")
async def record_tip(
    session_id: str,
    user: dict = Depends(require_auth),
    tip_amount: float = Form(None),
    tip_percent: float = Form(None),
):
    """Record tip from receipt. Server enters $ amount or %. System distributes proportionally."""
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    staff_id = uuid.UUID(user["sub"])
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, venue_id, total, status, meta FROM tap_sessions WHERE id = $1", sid
        )
        if not session:
            raise HTTPException(404, "Session not found")
        if session["status"] != "closed":
            raise HTTPException(400, "Session must be closed before recording tip")

        total = float(session["total"])
        meta = _parse_meta(session["meta"])

        # Calculate tip amount
        if tip_amount is not None and tip_amount > 0:
            final_tip = round(tip_amount, 2)
        elif tip_percent is not None and tip_percent > 0:
            final_tip = round(total * tip_percent / 100, 2)
        else:
            raise HTTPException(400, "Provide tip_amount or tip_percent")

        # Get items by server (created_by_user_id) to distribute proportionally
        # If a bartender_id is assigned to the session, attribute the tip to them
        assigned_bartender = meta.get("bartender_id")
        server_name_meta = meta.get("bartender_name") or meta.get("server_name")

        items = await conn.fetch(
            """SELECT created_by_user_id, SUM(line_total) as sold
               FROM tap_items WHERE tap_session_id = $1 AND voided_at IS NULL
               GROUP BY created_by_user_id""",
            sid,
        )

        total_sold = sum(float(it["sold"]) for it in items)
        tip_distribution = []

        if assigned_bartender:
            # Tip ownership: assign entire tip to the assigned bartender
            tip_distribution.append({
                "staff_id": assigned_bartender,
                "staff_name": server_name_meta or "",
                "sold": total_sold,
                "proportion": 1.0,
                "tip": final_tip,
            })
        else:
            # Fallback: distribute by who added items
            for it in items:
                srv_id = it["created_by_user_id"]
                sold = float(it["sold"])
                proportion = sold / total_sold if total_sold > 0 else 0
                srv_tip = round(final_tip * proportion, 2)
                tip_distribution.append({
                    "staff_id": str(srv_id),
                    "sold": sold,
                    "proportion": round(proportion, 4),
                    "tip": srv_tip,
                })

        # Store tip in meta
        meta["tip_amount"] = final_tip
        meta["tip_percent"] = round(final_tip / total * 100, 1) if total > 0 else 0
        meta["tip_recorded"] = True
        meta["tip_recorded_at"] = now.isoformat()
        meta["tip_recorded_by"] = str(staff_id)
        meta["tip_distribution"] = tip_distribution

        await conn.execute(
            "UPDATE tap_sessions SET meta = $1::jsonb WHERE id = $2",
            json_mod.dumps(meta), sid,
        )

    # Broadcast real-time update to Manager
    await ws_manager.broadcast(str(session["venue_id"]), "tip_recorded", {
        "session_id": str(sid), "tip_amount": final_tip
    })

    return {
        "session_id": str(sid),
        "total": total,
        "tip_amount": final_tip,
        "tip_percent": meta["tip_percent"],
        "distribution": tip_distribution,
        "recorded_at": now.isoformat(),
    }


# ─── Get closed sessions (for tip recording) ──────────────────────
@router.get("/sessions/closed")
async def get_closed_sessions(venue_id: str, user: dict = Depends(require_auth)):
    """List recently closed sessions that may need tip recording."""
    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, total, meta, closed_at
               FROM tap_sessions
               WHERE venue_id = $1 AND status = 'closed' AND closed_at >= $2
               ORDER BY closed_at DESC""",
            vid, today,
        )

    sessions = []
    for r in rows:
        meta = _parse_meta(r["meta"])
        sessions.append({
            "session_id": str(r["id"]),
            "guest_name": meta.get("guest_name", "Guest"),
            "tab_number": meta.get("tab_number"),
            "total": float(r["total"]),
            "tip_recorded": meta.get("tip_recorded", False),
            "tip_amount": meta.get("tip_amount", 0),
            "payment_location": meta.get("payment_location", "unknown"),
            "closed_at": r["closed_at"].isoformat() if r["closed_at"] else None,
        })
    return {"sessions": sessions, "total": len(sessions)}
