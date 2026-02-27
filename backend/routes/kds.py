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


def _check_kds_entitlement(user: dict) -> bool:
    """Feature-gate: check if user/venue has KDS add-on enabled."""
    roles = user.get("roles", [])
    for r in roles:
        perms = r.get("permissions", {})
        if isinstance(perms, dict) and perms.get("kds"):
            return True
    return False


# ─── List KDS tickets ─────────────────────────────────────────────
@router.get("/tickets")
async def list_kds_tickets(
    venue_id: str,
    destination: str = "kitchen",
    status: str = None,
    user: dict = Depends(require_auth),
):
    if not _check_kds_entitlement(user):
        raise HTTPException(403, "KDS add-on not enabled for this venue")

    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)

    query = """
        SELECT k.id, k.tap_session_id, k.table_id, k.destination, k.status,
               k.estimated_minutes, k.started_at, k.ready_at, k.created_at, k.meta,
               vt.table_number
        FROM kds_tickets k
        LEFT JOIN venue_tables vt ON vt.id = k.table_id
        WHERE k.venue_id = $1 AND k.destination = $2
    """
    params = [vid, destination]

    if status:
        query += " AND k.status = $3"
        params.append(status)
    else:
        query += " AND k.status != 'completed'"

    query += " ORDER BY CASE k.status WHEN 'pending' THEN 0 WHEN 'preparing' THEN 1 WHEN 'ready' THEN 2 ELSE 3 END, k.created_at"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

        tickets = []
        for r in rows:
            # Get items for this ticket
            items = await conn.fetch(
                "SELECT id, item_name, qty, notes FROM kds_ticket_items WHERE ticket_id = $1",
                r["id"],
            )
            meta = _parse_meta(r["meta"])

            tickets.append({
                "id": str(r["id"]),
                "session_id": str(r["tap_session_id"]) if r["tap_session_id"] else None,
                "table_id": str(r["table_id"]) if r["table_id"] else None,
                "table_number": r["table_number"],
                "destination": r["destination"],
                "status": r["status"],
                "estimated_minutes": r["estimated_minutes"],
                "started_at": r["started_at"].isoformat() if r["started_at"] else None,
                "ready_at": r["ready_at"].isoformat() if r["ready_at"] else None,
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "guest_name": meta.get("guest_name"),
                "items": [
                    {"id": str(i["id"]), "name": i["item_name"], "qty": i["qty"], "notes": i["notes"]}
                    for i in items
                ],
            })

    return {"tickets": tickets, "total": len(tickets)}


# ─── Send items to KDS (route from TAP) ──────────────────────────
@router.post("/send")
async def send_to_kds(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    session_id: str = Form(...),
    item_ids: str = Form(...),
):
    """Route items from a tap session to KDS. Drinks→bar, Food→kitchen."""
    if not _check_kds_entitlement(user):
        raise HTTPException(403, "KDS add-on not enabled for this venue")

    pool = get_postgres_pool()
    vid = uuid.UUID(venue_id)
    sid = uuid.UUID(session_id)
    staff_id = uuid.UUID(user["sub"])
    ids = [uuid.UUID(x.strip()) for x in item_ids.split(",") if x.strip()]

    if not ids:
        raise HTTPException(400, "No items to send")

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT table_id, meta FROM tap_sessions WHERE id = $1", sid
        )
        if not session:
            raise HTTPException(404, "Session not found")

        meta = _parse_meta(session["meta"])
        table_id = session["table_id"]

        # Fetch items
        rows = await conn.fetch(
            """SELECT id, item_name, category, qty, is_alcohol, notes
               FROM tap_items WHERE id = ANY($1) AND tap_session_id = $2""",
            ids, sid,
        )

        # Group by destination
        bar_items = [r for r in rows if r["is_alcohol"]]
        kitchen_items = [r for r in rows if not r["is_alcohol"]]

        created_tickets = []

        for destination, items in [("bar", bar_items), ("kitchen", kitchen_items)]:
            if not items:
                continue
            ticket_meta = json_mod.dumps({"guest_name": meta.get("guest_name")})
            ticket = await conn.fetchrow(
                """INSERT INTO kds_tickets
                   (venue_id, tap_session_id, table_id, destination, status, created_by_user_id, meta)
                   VALUES ($1, $2, $3, $4, 'pending', $5, $6::jsonb)
                   RETURNING id""",
                vid, sid, table_id, destination, staff_id, ticket_meta,
            )
            for item in items:
                await conn.execute(
                    """INSERT INTO kds_ticket_items (ticket_id, tap_item_id, item_name, qty, notes)
                       VALUES ($1, $2, $3, $4, $5)""",
                    ticket["id"], item["id"], item["item_name"], item["qty"], item["notes"],
                )
            created_tickets.append({
                "ticket_id": str(ticket["id"]),
                "destination": destination,
                "items_count": len(items),
            })

    return {"tickets": created_tickets, "total": len(created_tickets)}


# ─── Update ticket status ─────────────────────────────────────────
@router.post("/ticket/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    user: dict = Depends(require_auth),
    status: str = Form(...),
    estimated_minutes: int = Form(None),
):
    if not _check_kds_entitlement(user):
        raise HTTPException(403, "KDS add-on not enabled for this venue")

    valid = ("pending", "preparing", "ready", "completed")
    if status not in valid:
        raise HTTPException(400, f"Status must be one of {valid}")

    pool = get_postgres_pool()
    tid = uuid.UUID(ticket_id)
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        ticket = await conn.fetchrow("SELECT id, status FROM kds_tickets WHERE id = $1", tid)
        if not ticket:
            raise HTTPException(404, "Ticket not found")

        updates = {"status": status}
        set_clauses = ["status = $2"]
        params = [tid, status]
        idx = 3

        if status == "preparing":
            set_clauses.append(f"started_at = ${idx}")
            params.append(now)
            idx += 1
        if status == "ready":
            set_clauses.append(f"ready_at = ${idx}")
            params.append(now)
            idx += 1
        if status == "completed":
            set_clauses.append(f"completed_at = ${idx}")
            params.append(now)
            idx += 1
        if estimated_minutes is not None:
            set_clauses.append(f"estimated_minutes = ${idx}")
            params.append(estimated_minutes)
            idx += 1

        await conn.execute(
            f"UPDATE kds_tickets SET {', '.join(set_clauses)} WHERE id = $1",
            *params,
        )

    return {
        "ticket_id": str(tid),
        "status": status,
        "estimated_minutes": estimated_minutes,
    }
