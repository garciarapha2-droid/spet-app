from fastapi import APIRouter, HTTPException, Depends, Form
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
from datetime import datetime, timezone
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
        except Exception:
            return {}
    return {}


# ─── List tables ──────────────────────────────────────────────────
@router.get("/tables")
async def list_tables(venue_id: str, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT t.id, t.table_number, t.zone, t.capacity, t.status,
                      t.current_session_id, s.total, s.meta as session_meta
               FROM venue_tables t
               LEFT JOIN tap_sessions s ON s.id = t.current_session_id AND s.status = 'open'
               WHERE t.venue_id = $1
               ORDER BY t.zone, t.table_number::int""",
            vid,
        )
    tables = []
    for r in rows:
        meta = _parse_meta(r["session_meta"]) if r["session_meta"] else {}
        tables.append({
            "id": str(r["id"]),
            "table_number": r["table_number"],
            "zone": r["zone"],
            "capacity": r["capacity"],
            "status": r["status"],
            "session_id": str(r["current_session_id"]) if r["current_session_id"] else None,
            "session_total": float(r["total"]) if r["total"] else 0,
            "session_guest": meta.get("guest_name", None),
            "tab_number": meta.get("tab_number", None),
            "server_name": meta.get("server_name", None),
        })
    return {"tables": tables, "total": len(tables)}


# ─── Open table → creates tap_session linked to table ─────────────
@router.post("/open")
async def open_table(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    table_id: str = Form(...),
    guest_name: str = Form("Guest"),
    covers: int = Form(1),
    server_name: str = Form(None),
    bartender_id: str = Form(None),
):
    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)
    tid = uuid.UUID(table_id)
    staff_id = uuid.UUID(user["sub"])

    async with pool.acquire() as conn:
        table = await conn.fetchrow(
            "SELECT id, status, table_number FROM venue_tables WHERE id = $1 AND venue_id = $2",
            tid, vid,
        )
        if not table:
            raise HTTPException(404, "Table not found")
        if table["status"] == "occupied":
            raise HTTPException(400, "Table already occupied")

        meta_dict = {"guest_name": guest_name, "covers": covers}
        if server_name:
            meta_dict["server_name"] = server_name
        if bartender_id:
            meta_dict["bartender_id"] = bartender_id
        meta = json_mod.dumps(meta_dict)
        session = await conn.fetchrow(
            """INSERT INTO tap_sessions
               (venue_id, table_id, session_type, opened_by_user_id, status, meta)
               VALUES ($1, $2, 'table', $3, 'open', $4::jsonb)
               RETURNING id, opened_at""",
            vid, tid, staff_id, meta,
        )

        await conn.execute(
            "UPDATE venue_tables SET status = 'occupied', current_session_id = $1 WHERE id = $2",
            session["id"], tid,
        )

    return {
        "table_id": str(tid),
        "table_number": table["table_number"],
        "session_id": str(session["id"]),
        "guest_name": guest_name,
        "status": "occupied",
        "opened_at": session["opened_at"].isoformat(),
    }


# ─── Close table → close tap session + free table ─────────────────
@router.post("/close")
async def close_table(
    user: dict = Depends(require_auth),
    table_id: str = Form(...),
    payment_method: str = Form("card"),
    payment_location: str = Form("pay_here"),
):
    pool = get_postgres_pool()
    tid = uuid.UUID(table_id)
    staff_id = uuid.UUID(user["sub"])
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        table = await conn.fetchrow(
            "SELECT id, venue_id, current_session_id, table_number FROM venue_tables WHERE id = $1",
            tid,
        )
        if not table or not table["current_session_id"]:
            raise HTTPException(400, "Table has no active session")

        sid = table["current_session_id"]
        session = await conn.fetchrow("SELECT total, meta FROM tap_sessions WHERE id = $1", sid)

        # Update meta with payment info
        meta = _parse_meta(session["meta"])
        meta["payment_location"] = payment_location
        meta["tip_amount"] = 0
        meta["tip_recorded"] = False

        await conn.execute(
            "UPDATE tap_sessions SET status = 'closed', closed_at = $1, closed_by_user_id = $2, meta = $3::jsonb WHERE id = $4",
            now, staff_id, json_mod.dumps(meta), sid,
        )
        await conn.execute(
            """INSERT INTO tap_payments (venue_id, tap_session_id, amount, method, paid_by_user_id, paid_at)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            table["venue_id"], sid, session["total"], payment_method, staff_id, now,
        )
        await conn.execute(
            "UPDATE venue_tables SET status = 'available', current_session_id = NULL WHERE id = $1",
            tid,
        )

    return {
        "table_id": str(tid),
        "table_number": table["table_number"],
        "session_id": str(sid),
        "status": "available",
        "total": float(session["total"]),
        "payment_method": payment_method,
        "payment_location": payment_location,
        "tip_pending": payment_location == "pay_here",
    }


# ─── Get table detail with items ──────────────────────────────────
@router.get("/{table_id}")
async def get_table_detail(table_id: str, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    tid = uuid.UUID(table_id)

    async with pool.acquire() as conn:
        table = await conn.fetchrow(
            "SELECT id, venue_id, table_number, zone, capacity, status, current_session_id FROM venue_tables WHERE id = $1",
            tid,
        )
        if not table:
            raise HTTPException(404, "Table not found")

        items = []
        session_data = None
        if table["current_session_id"]:
            session = await conn.fetchrow(
                "SELECT id, total, subtotal, meta, opened_at FROM tap_sessions WHERE id = $1",
                table["current_session_id"],
            )
            meta = _parse_meta(session["meta"]) if session else {}
            session_data = {
                "id": str(session["id"]),
                "total": float(session["total"]),
                "guest_name": meta.get("guest_name", "Guest"),
                "tab_number": meta.get("tab_number"),
                "server_name": meta.get("server_name"),
                "covers": meta.get("covers", 1),
                "opened_at": session["opened_at"].isoformat() if session["opened_at"] else None,
                "id_verified": meta.get("id_verified", False),
                "id_verified_at": meta.get("id_verified_at"),
            }

            rows = await conn.fetch(
                """SELECT id, item_name, category, unit_price, qty, line_total, is_alcohol, notes, modifiers, catalog_item_id, created_at
                   FROM tap_items WHERE tap_session_id = $1 AND voided_at IS NULL ORDER BY created_at""",
                table["current_session_id"],
            )
            items = [
                {
                    "id": str(r["id"]),
                    "name": r["item_name"],
                    "category": r["category"],
                    "unit_price": float(r["unit_price"]),
                    "qty": r["qty"],
                    "line_total": float(r["line_total"]),
                    "is_alcohol": r["is_alcohol"],
                    "notes": r["notes"],
                    "modifiers": _parse_meta(r["modifiers"]) if r["modifiers"] else {},
                    "catalog_item_id": str(r["catalog_item_id"]) if r["catalog_item_id"] else None,
                }
                for r in rows
            ]

    return {
        "id": str(table["id"]),
        "table_number": table["table_number"],
        "zone": table["zone"],
        "capacity": table["capacity"],
        "status": table["status"],
        "session": session_data,
        "items": items,
    }


# ─── Add table ──────────────────────────────────────────────────
@router.post("/tables/add")
async def add_table(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    table_number: str = Form(...),
    zone: str = Form("main"),
    capacity: int = Form(4),
):
    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id FROM venue_tables WHERE venue_id = $1 AND table_number = $2",
            vid, table_number,
        )
        if existing:
            raise HTTPException(400, f"Table {table_number} already exists")
        row = await conn.fetchrow(
            """INSERT INTO venue_tables (venue_id, table_number, zone, capacity, status)
               VALUES ($1, $2, $3, $4, 'available') RETURNING id""",
            vid, table_number, zone, capacity,
        )
    return {"id": str(row["id"]), "table_number": table_number, "zone": zone, "capacity": capacity}


@router.post("/tables/{table_id}/edit")
async def edit_table(
    table_id: str,
    user: dict = Depends(require_auth),
    table_number: str = Form(None),
    zone: str = Form(None),
    capacity: int = Form(None),
):
    pool = get_postgres_pool()
    tid = uuid.UUID(table_id)
    updates = []
    params = []
    idx = 1
    if table_number is not None:
        updates.append(f"table_number = ${idx}")
        params.append(table_number)
        idx += 1
    if zone is not None:
        updates.append(f"zone = ${idx}")
        params.append(zone)
        idx += 1
    if capacity is not None:
        updates.append(f"capacity = ${idx}")
        params.append(capacity)
        idx += 1
    if not updates:
        raise HTTPException(400, "Nothing to update")
    params.append(tid)
    async with pool.acquire() as conn:
        await conn.execute(
            f"UPDATE venue_tables SET {', '.join(updates)} WHERE id = ${idx}",
            *params,
        )
    return {"id": table_id, "updated": True}


# ─── Add item to table (via session) ───────────────────────────────
@router.post("/{table_id}/add-item")
async def add_item_to_table(
    table_id: str,
    user: dict = Depends(require_auth),
    item_id: str = Form(...),
    qty: int = Form(1),
    notes: str = Form(None),
):
    """Add a catalog item to a table's active session."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    tid = uuid.UUID(table_id)
    staff_id = uuid.UUID(user["sub"])

    async with pool.acquire() as conn:
        table = await conn.fetchrow(
            "SELECT id, venue_id, current_session_id FROM venue_tables WHERE id = $1", tid
        )
        if not table or not table["current_session_id"]:
            raise HTTPException(400, "Table has no active session")

        sid = table["current_session_id"]
        session = await conn.fetchrow(
            "SELECT id, venue_id, status FROM tap_sessions WHERE id = $1", sid
        )
        if not session or session["status"] != "open":
            raise HTTPException(400, "Session is not open")

        catalog_item = await db.venue_catalog.find_one(
            {"id": item_id, "venue_id": str(session["venue_id"])}, {"_id": 0}
        )
        if not catalog_item:
            raise HTTPException(404, "Catalog item not found")

        line_total = catalog_item["price"] * qty

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
        await conn.execute(
            "UPDATE tap_sessions SET subtotal = subtotal + $1, total = subtotal + $1 WHERE id = $2",
            line_total, sid,
        )
        new_total = await conn.fetchval("SELECT total FROM tap_sessions WHERE id = $1", sid)

    # Auto-route item to KDS (Kitchen or Bar)
    try:
        from routes.tap import _auto_route_to_kds, _parse_meta as _tap_parse_meta
        async with pool.acquire() as conn2:
            sess = await conn2.fetchrow("SELECT meta FROM tap_sessions WHERE id = $1", sid)
        meta = _tap_parse_meta(sess["meta"]) if sess else {}
        await _auto_route_to_kds(
            pool, table["venue_id"], sid, item_row["id"],
            catalog_item["name"], qty, catalog_item.get("is_alcohol", False),
            staff_id, tid, meta.get("guest_name", "Guest"))
    except Exception as e:
        logger.warning(f"KDS auto-route from Table failed: {e}")

    return {
        "line_item_id": str(item_row["id"]),
        "name": catalog_item["name"],
        "qty": qty,
        "line_total": float(line_total),
        "session_total": float(new_total),
    }


@router.delete("/tables/{table_id}")
async def delete_table(table_id: str, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    tid = uuid.UUID(table_id)
    async with pool.acquire() as conn:
        table = await conn.fetchrow("SELECT id, status FROM venue_tables WHERE id = $1", tid)
        if not table:
            raise HTTPException(404, "Table not found")
        if table["status"] == "occupied":
            raise HTTPException(400, "Cannot delete an occupied table")
        await conn.execute("DELETE FROM venue_tables WHERE id = $1", tid)
    return {"id": table_id, "deleted": True}


# ─── Assign / Change server on an occupied table ──────────────────
@router.post("/assign-server")
async def assign_server(
    user: dict = Depends(require_auth),
    table_id: str = Form(...),
    server_name: str = Form(...),
):
    """Assign or change the server for an occupied table."""
    pool = get_postgres_pool()
    tid = uuid.UUID(table_id)

    async with pool.acquire() as conn:
        table = await conn.fetchrow(
            "SELECT id, current_session_id, venue_id FROM venue_tables WHERE id = $1", tid)
        if not table or not table["current_session_id"]:
            raise HTTPException(400, "Table has no active session")

        sid = table["current_session_id"]
        session = await conn.fetchrow("SELECT meta FROM tap_sessions WHERE id = $1", sid)
        meta = _parse_meta(session["meta"]) if session and session["meta"] else {}
        old_server = meta.get("server_name")
        meta["server_name"] = server_name
        await conn.execute(
            "UPDATE tap_sessions SET meta = $1::jsonb WHERE id = $2",
            json_mod.dumps(meta), sid)

        # Audit trail
        now = datetime.now(timezone.utc)
        await conn.execute(
            """INSERT INTO audit_events (event_type, user_id, venue_id, entity_type, metadata, timestamp)
               VALUES ('server_change', $1::uuid, $2, 'table', $3::jsonb, $4)""",
            uuid.UUID(user["sub"]), table["venue_id"],
            json_mod.dumps({"table_id": str(tid), "from": old_server, "to": server_name}), now)

    return {"table_id": str(tid), "server_name": server_name, "previous": old_server}
