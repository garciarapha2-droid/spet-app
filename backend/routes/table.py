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

        meta = json_mod.dumps({"guest_name": guest_name, "covers": covers})
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
        session = await conn.fetchrow("SELECT total FROM tap_sessions WHERE id = $1", sid)

        await conn.execute(
            "UPDATE tap_sessions SET status = 'closed', closed_at = $1, closed_by_user_id = $2 WHERE id = $3",
            now, staff_id, sid,
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
        "status": "available",
        "total": float(session["total"]),
        "payment_method": payment_method,
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
                "covers": meta.get("covers", 1),
                "opened_at": session["opened_at"].isoformat() if session["opened_at"] else None,
            }

            rows = await conn.fetch(
                """SELECT id, item_name, category, unit_price, qty, line_total, is_alcohol, notes, created_at
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
