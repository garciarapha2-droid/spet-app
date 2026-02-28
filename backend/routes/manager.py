from fastapi import APIRouter, HTTPException, Depends, Form, Query
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
from datetime import datetime, timezone, date, timedelta
import uuid
import json as json_mod
import logging
import csv
import io
import os

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

PROTECTED_EMAILS = {"teste@teste.com"}


def _vid(venue_id: str):
    return uuid.UUID(venue_id)


def _today_start():
    return datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)


def _week_start():
    today = date.today()
    return datetime.combine(today - timedelta(days=today.weekday()), datetime.min.time()).replace(tzinfo=timezone.utc)


def _month_start():
    today = date.today()
    return datetime.combine(today.replace(day=1), datetime.min.time()).replace(tzinfo=timezone.utc)


# ─── OVERVIEW ──────────────────────────────────────────────────────
@router.get("/overview")
async def get_overview(venue_id: str, user: dict = Depends(require_auth)):
    """Manager Overview — KPIs, chart data, alerts."""
    pool = get_postgres_pool()
    vid = _vid(venue_id)
    now = datetime.now(timezone.utc)
    today = _today_start()
    week = _week_start()
    month = _month_start()

    async with pool.acquire() as conn:
        # Revenue KPIs
        rev_today = float(await conn.fetchval(
            "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0)
        rev_week = float(await conn.fetchval(
            "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, week) or 0)
        rev_month = float(await conn.fetchval(
            "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, month) or 0)

        # Avg ticket
        avg_ticket = float(await conn.fetchval(
            "SELECT COALESCE(AVG(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0)

        # Unique guests today
        unique_guests = await conn.fetchval(
            "SELECT COUNT(DISTINCT guest_id) FROM entry_events WHERE venue_id=$1 AND created_at>=$2 AND decision='allowed'",
            vid, today) or 0

        # Open tabs
        open_tabs = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open'", vid) or 0

        running_total = float(await conn.fetchval(
            "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='open'", vid) or 0)

        closed_today = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0

        # Revenue by hour (last 24h)
        rev_by_hour_rows = await conn.fetch(
            """SELECT EXTRACT(HOUR FROM closed_at) as hour, COALESCE(SUM(total),0) as total
               FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2
               GROUP BY EXTRACT(HOUR FROM closed_at) ORDER BY hour""",
            vid, today)
        revenue_by_hour = [{"hour": int(r["hour"]), "total": float(r["total"])} for r in rev_by_hour_rows]

        # Top 10 items today
        top_items_rows = await conn.fetch(
            """SELECT item_name, SUM(qty) as total_qty, SUM(line_total) as total_revenue
               FROM tap_items WHERE venue_id=$1 AND created_at>=$2 AND voided_at IS NULL
               GROUP BY item_name ORDER BY total_revenue DESC LIMIT 10""",
            vid, today)
        top_items = [{"name": r["item_name"], "qty": int(r["total_qty"]), "revenue": float(r["total_revenue"])} for r in top_items_rows]

        # Guest funnel: entries → inside → tabs opened → tabs closed
        total_entries = await conn.fetchval(
            "SELECT COUNT(*) FROM entry_events WHERE venue_id=$1 AND created_at>=$2", vid, today) or 0
        allowed_entries = await conn.fetchval(
            "SELECT COUNT(*) FROM entry_events WHERE venue_id=$1 AND created_at>=$2 AND decision='allowed'", vid, today) or 0
        tabs_opened = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND opened_at>=$2", vid, today) or 0

        # Alerts
        alerts = []
        # Excessive voids today
        void_count = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND voided_at>=$2", vid, today) or 0
        if void_count > 5:
            alerts.append({"type": "warning", "title": "Excessive Voids", "message": f"{void_count} items voided today — review for anomalies"})

        # Tabs open too long (>3 hours)
        long_tabs = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open' AND opened_at<$2",
            vid, now - timedelta(hours=3)) or 0
        if long_tabs > 0:
            alerts.append({"type": "info", "title": "Long Open Tabs", "message": f"{long_tabs} tab(s) open for more than 3 hours"})

    return {
        "kpis": {
            "revenue_today": rev_today,
            "revenue_week": rev_week,
            "revenue_month": rev_month,
            "avg_ticket": round(avg_ticket, 2),
            "unique_guests": unique_guests,
            "open_tabs": open_tabs,
            "running_total": running_total,
            "closed_today": closed_today,
            "void_count": void_count,
        },
        "charts": {
            "revenue_by_hour": revenue_by_hour,
            "top_items": top_items,
            "guest_funnel": {
                "entries": total_entries,
                "allowed": allowed_entries,
                "tabs_opened": tabs_opened,
                "tabs_closed": closed_today,
            },
        },
        "alerts": alerts,
    }


# ─── STAFF & ROLES ────────────────────────────────────────────────
@router.get("/staff")
async def list_staff(venue_id: str, user: dict = Depends(require_auth)):
    """List all staff with roles for this venue."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _vid(venue_id)

    # Get users with access to this venue
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT u.id, u.email, u.status, ua.role, ua.permissions, u.last_login_at
               FROM users u JOIN user_access ua ON u.id=ua.user_id
               WHERE ua.venue_id=$1 ORDER BY ua.role, u.email""", vid)

    staff = []
    for r in rows:
        perms = r["permissions"]
        if isinstance(perms, str):
            try:
                perms = json_mod.loads(perms)
            except Exception:
                perms = {}
        staff.append({
            "id": str(r["id"]),
            "email": r["email"],
            "status": r["status"],
            "role": r["role"],
            "permissions": perms,
            "last_login": r["last_login_at"].isoformat() if r["last_login_at"] else None,
            "is_protected": r["email"] in PROTECTED_EMAILS,
        })

    # Also get barmen/servers from MongoDB
    barmen_cursor = db.venue_barmen.find({"venue_id": venue_id, "active": True}, {"_id": 0})
    barmen = await barmen_cursor.to_list(100)

    # Staff schedule from MongoDB
    schedules_cursor = db.staff_schedules.find({"venue_id": venue_id}, {"_id": 0})
    schedules = await schedules_cursor.to_list(200)

    return {"staff": staff, "barmen": barmen, "schedules": schedules}


@router.post("/staff")
async def add_staff_member(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    name: str = Form(...),
    role: str = Form("server"),
    email: str = Form(None),
):
    """Add a staff/server member."""
    db = get_mongo_db()
    member = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "name": name,
        "role": role,
        "email": email,
        "active": True,
        "created_at": datetime.now(timezone.utc),
    }
    await db.venue_barmen.insert_one(member)
    member.pop("_id", None)
    return member


@router.put("/staff/{staff_id}")
async def update_staff_member(
    staff_id: str,
    user: dict = Depends(require_auth),
    name: str = Form(None),
    role: str = Form(None),
    active: bool = Form(None),
):
    """Update staff member."""
    db = get_mongo_db()
    update = {}
    if name is not None:
        update["name"] = name
    if role is not None:
        update["role"] = role
    if active is not None:
        update["active"] = active
    if not update:
        raise HTTPException(400, "Nothing to update")
    result = await db.venue_barmen.update_one({"id": staff_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Staff not found")
    return {"id": staff_id, "updated": True}


@router.delete("/staff/{staff_id}")
async def delete_staff_member(staff_id: str, user: dict = Depends(require_auth)):
    """Delete a staff member."""
    db = get_mongo_db()
    result = await db.venue_barmen.delete_one({"id": staff_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Staff not found")
    return {"id": staff_id, "deleted": True}


# ─── STAFF SCHEDULE ───────────────────────────────────────────────
@router.get("/schedule")
async def get_schedule(venue_id: str, user: dict = Depends(require_auth)):
    """Get staff schedules."""
    db = get_mongo_db()
    cursor = db.staff_schedules.find({"venue_id": venue_id}, {"_id": 0})
    schedules = await cursor.to_list(200)
    return {"schedules": schedules}


@router.post("/schedule")
async def save_schedule(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    staff_id: str = Form(...),
    staff_name: str = Form(...),
    day: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
):
    """Save a schedule entry."""
    db = get_mongo_db()
    entry = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "staff_id": staff_id,
        "staff_name": staff_name,
        "day": day,
        "start_time": start_time,
        "end_time": end_time,
        "created_at": datetime.now(timezone.utc),
    }
    await db.staff_schedules.insert_one(entry)
    entry.pop("_id", None)
    return entry


@router.delete("/schedule/{schedule_id}")
async def delete_schedule(schedule_id: str, user: dict = Depends(require_auth)):
    db = get_mongo_db()
    result = await db.staff_schedules.delete_one({"id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Schedule not found")
    return {"id": schedule_id, "deleted": True}


# ─── SHIFTS & OPERATIONS ──────────────────────────────────────────
@router.get("/shifts")
async def list_shifts(venue_id: str, user: dict = Depends(require_auth)):
    """List shifts/operations history."""
    db = get_mongo_db()
    cursor = db.venue_shifts.find({"venue_id": venue_id}, {"_id": 0}).sort("created_at", -1).limit(50)
    shifts = await cursor.to_list(50)
    return {"shifts": shifts}


@router.post("/shifts/close")
async def close_shift(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    shift_name: str = Form("Evening Shift"),
    cash_expected: float = Form(0),
    cash_actual: float = Form(0),
    notes: str = Form(None),
):
    """Close a shift with cash reconciliation."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _vid(venue_id)
    now = datetime.now(timezone.utc)
    today = _today_start()

    # Gather shift stats from PG
    async with pool.acquire() as conn:
        tabs_closed = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0
        revenue = float(await conn.fetchval(
            "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0)
        voids = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND voided_at>=$2", vid, today) or 0
        # Payments breakdown
        payments = await conn.fetch(
            "SELECT method, COUNT(*) as cnt, COALESCE(SUM(amount),0) as total FROM tap_payments WHERE venue_id=$1 AND paid_at>=$2 GROUP BY method",
            vid, today)

    payment_breakdown = {r["method"]: {"count": r["cnt"], "total": float(r["total"])} for r in payments}
    cash_diff = cash_actual - cash_expected

    shift = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "shift_name": shift_name,
        "closed_by": user.get("email", user["sub"]),
        "tabs_closed": tabs_closed,
        "revenue": revenue,
        "voids": voids,
        "cash_expected": cash_expected,
        "cash_actual": cash_actual,
        "cash_difference": cash_diff,
        "payment_breakdown": payment_breakdown,
        "notes": notes,
        "created_at": now,
    }
    await db.venue_shifts.insert_one(shift)
    shift.pop("_id", None)

    # Audit trail
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO audit_events (event_type, user_id, venue_id, entity_type, metadata, timestamp)
               VALUES ('shift_close', $1::uuid, $2, 'shift', $3::jsonb, $4)""",
            uuid.UUID(user["sub"]), vid, json_mod.dumps({"shift_id": shift["id"], "cash_diff": cash_diff}), now)

    return shift


# ─── NFC & GUESTS ─────────────────────────────────────────────────
@router.get("/guests")
async def list_guests(venue_id: str, user: dict = Depends(require_auth), search: str = None):
    """List guests for this venue, sorted by highest spender."""
    db = get_mongo_db()
    query = {"venue_id": venue_id}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    # Sort by spend_total descending (highest spender first)
    cursor = db.venue_guests.find(query, {"_id": 0}).sort("spend_total", -1).limit(100)
    guests = await cursor.to_list(100)
    total = await db.venue_guests.count_documents({"venue_id": venue_id})
    return {"guests": guests, "total": total}


@router.get("/guests/{guest_id}")
async def get_guest_detail(guest_id: str, venue_id: str, user: dict = Depends(require_auth)):
    """Get guest profile with visit history, event history, and spend summary."""
    db = get_mongo_db()
    pool = get_postgres_pool()
    vid = _vid(venue_id)

    guest = await db.venue_guests.find_one({"id": guest_id, "venue_id": venue_id}, {"_id": 0})
    if not guest:
        raise HTTPException(404, "Guest not found")

    async with pool.acquire() as conn:
        # Visit history
        entries = await conn.fetch(
            """SELECT entry_type, cover_amount, cover_paid, decision, created_at
               FROM entry_events WHERE venue_id=$1 AND guest_id=$2::uuid
               ORDER BY created_at DESC LIMIT 20""", vid, uuid.UUID(guest_id))

        # Tab sessions
        sessions = await conn.fetch(
            """SELECT id, status, total, opened_at, closed_at, meta
               FROM tap_sessions WHERE venue_id=$1 AND guest_id=$2::uuid
               ORDER BY opened_at DESC LIMIT 20""", vid, uuid.UUID(guest_id))

        # Spend summary
        total_spend = float(await conn.fetchval(
            "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND guest_id=$2::uuid AND status='closed'",
            vid, uuid.UUID(guest_id)) or 0)
        total_sessions = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND guest_id=$2::uuid",
            vid, uuid.UUID(guest_id)) or 0
        avg_spend = round(total_spend / total_sessions, 2) if total_sessions > 0 else 0

        # Event history — events this guest attended (from MongoDB)
    db_inner = get_mongo_db()
    event_guest_docs = await db_inner.event_guests.find(
        {"venue_id": venue_id, "guest_id": guest_id}, {"_id": 0}
    ).sort("added_at", -1).to_list(20)

    events_list = []
    for eg in event_guest_docs:
        ev_doc = await db_inner.events.find_one({"id": eg.get("event_id"), "venue_id": venue_id}, {"_id": 0})
        events_list.append({
            "event_id": eg.get("event_id", ""),
            "event_name": ev_doc.get("name", "Unknown") if ev_doc else "Unknown",
            "event_date": ev_doc.get("start_at").isoformat() if ev_doc and ev_doc.get("start_at") else None,
            "event_status": ev_doc.get("status", "") if ev_doc else "",
            "checked_in_at": eg.get("checked_in_at").isoformat() if eg.get("checked_in_at") else eg.get("added_at", ""),
            "checked_out_at": eg.get("checked_out_at").isoformat() if eg.get("checked_out_at") else None,
        })

    return {
        "guest": guest,
        "spend_summary": {
            "total_spend": total_spend,
            "total_sessions": total_sessions,
            "avg_spend": avg_spend,
        },
        "entries": [{"entry_type": e["entry_type"], "cover_amount": float(e["cover_amount"]) if e["cover_amount"] else 0,
                     "decision": e["decision"], "date": e["created_at"].isoformat()} for e in entries],
        "sessions": [{"id": str(s["id"]), "status": s["status"], "total": float(s["total"]),
                      "opened_at": s["opened_at"].isoformat() if s["opened_at"] else None,
                      "closed_at": s["closed_at"].isoformat() if s["closed_at"] else None} for s in sessions],
        "events": events_list,
    }


# ─── REPORTS & FINANCE ────────────────────────────────────────────
@router.get("/reports/sales")
async def get_sales_report(
    venue_id: str,
    period: str = "today",
    user: dict = Depends(require_auth),
):
    """Sales report: by item, by staff, by hour."""
    pool = get_postgres_pool()
    vid = _vid(venue_id)
    if period == "today":
        since = _today_start()
    elif period == "week":
        since = _week_start()
    elif period == "month":
        since = _month_start()
    else:
        since = _today_start()

    async with pool.acquire() as conn:
        # Sales by item
        by_item = await conn.fetch(
            """SELECT item_name, category, SUM(qty) as qty, SUM(line_total) as revenue
               FROM tap_items WHERE venue_id=$1 AND created_at>=$2 AND voided_at IS NULL
               GROUP BY item_name, category ORDER BY revenue DESC""", vid, since)

        # Sales by hour
        by_hour = await conn.fetch(
            """SELECT EXTRACT(HOUR FROM ti.created_at) as hour, SUM(ti.line_total) as revenue
               FROM tap_items ti WHERE ti.venue_id=$1 AND ti.created_at>=$2 AND ti.voided_at IS NULL
               GROUP BY EXTRACT(HOUR FROM ti.created_at) ORDER BY hour""", vid, since)

        # Exceptions (voids)
        exceptions = await conn.fetch(
            """SELECT ti.item_name, ti.line_total, ti.void_reason, ti.voided_at, u.email as voided_by
               FROM tap_items ti LEFT JOIN users u ON ti.voided_by_user_id=u.id
               WHERE ti.venue_id=$1 AND ti.voided_at>=$2
               ORDER BY ti.voided_at DESC LIMIT 50""", vid, since)

        # Payment methods
        by_method = await conn.fetch(
            "SELECT method, COUNT(*) as cnt, COALESCE(SUM(amount),0) as total FROM tap_payments WHERE venue_id=$1 AND paid_at>=$2 GROUP BY method",
            vid, since)

    return {
        "period": period,
        "by_item": [{"name": r["item_name"], "category": r["category"], "qty": int(r["qty"]), "revenue": float(r["revenue"])} for r in by_item],
        "by_hour": [{"hour": int(r["hour"]), "revenue": float(r["revenue"])} for r in by_hour],
        "exceptions": [{"name": r["item_name"], "amount": float(r["line_total"]), "reason": r["void_reason"],
                        "voided_at": r["voided_at"].isoformat() if r["voided_at"] else None, "voided_by": r["voided_by"]} for r in exceptions],
        "by_method": [{"method": r["method"], "count": r["cnt"], "total": float(r["total"])} for r in by_method],
    }


@router.get("/reports/export")
async def export_report(
    venue_id: str,
    period: str = "today",
    user: dict = Depends(require_auth),
):
    """Export sales data as CSV string."""
    from fastapi.responses import StreamingResponse
    report = await get_sales_report(venue_id, period, user)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Item", "Category", "Qty Sold", "Revenue"])
    for item in report["by_item"]:
        writer.writerow([item["name"], item["category"], item["qty"], f"${item['revenue']:.2f}"])
    writer.writerow([])
    writer.writerow(["Hour", "Revenue"])
    for h in report["by_hour"]:
        writer.writerow([f"{int(h['hour']):02d}:00", f"${h['revenue']:.2f}"])
    writer.writerow([])
    writer.writerow(["Payment Method", "Count", "Total"])
    for m in report["by_method"]:
        writer.writerow([m["method"], m["count"], f"${m['total']:.2f}"])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sales_{period}_{date.today().isoformat()}.csv"},
    )


# ─── LOYALTY & REWARDS CONFIG ─────────────────────────────────────
@router.get("/loyalty")
async def get_loyalty_config(venue_id: str, user: dict = Depends(require_auth)):
    """Get loyalty/rewards configuration."""
    db = get_mongo_db()
    config = await db.venue_loyalty.find_one({"venue_id": venue_id}, {"_id": 0})
    if not config:
        config = {
            "venue_id": venue_id,
            "enabled": False,
            "points_per_dollar": 1,
            "daily_limit": 500,
            "anti_fraud_max_per_visit": 200,
            "tiers": [
                {"name": "Bronze", "min_points": 0, "discount_pct": 0},
                {"name": "Silver", "min_points": 500, "discount_pct": 5},
                {"name": "Gold", "min_points": 2000, "discount_pct": 10},
            ],
        }
    return config


@router.post("/loyalty")
async def save_loyalty_config(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    enabled: bool = Form(False),
    points_per_dollar: int = Form(1),
    daily_limit: int = Form(500),
    anti_fraud_max: int = Form(200),
):
    """Save loyalty/rewards configuration. Preserves existing tiers."""
    db = get_mongo_db()
    existing = await db.venue_loyalty.find_one({"venue_id": venue_id}, {"_id": 0})
    default_tiers = [
        {"name": "Bronze", "min_points": 0, "discount_pct": 0},
        {"name": "Silver", "min_points": 500, "discount_pct": 5},
        {"name": "Gold", "min_points": 2000, "discount_pct": 10},
    ]
    config = {
        "venue_id": venue_id,
        "enabled": enabled,
        "points_per_dollar": points_per_dollar,
        "daily_limit": daily_limit,
        "anti_fraud_max_per_visit": anti_fraud_max,
        "tiers": existing.get("tiers", default_tiers) if existing else default_tiers,
        "updated_at": datetime.now(timezone.utc),
    }
    await db.venue_loyalty.update_one({"venue_id": venue_id}, {"$set": config}, upsert=True)
    return {"saved": True}


# ─── SETTINGS ──────────────────────────────────────────────────────
@router.get("/settings")
async def get_settings(venue_id: str, user: dict = Depends(require_auth)):
    """Get venue settings."""
    db = get_mongo_db()
    config = await db.venue_configs.find_one({"venue_id": venue_id}, {"_id": 0})
    return config or {"venue_id": venue_id}


@router.put("/settings")
async def update_settings(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    venue_name: str = Form(None),
    bar_mode: str = Form(None),
    kds_enabled: bool = Form(None),
    currency: str = Form(None),
):
    """Update venue settings."""
    db = get_mongo_db()
    update = {}
    if venue_name is not None:
        update["venue_name"] = venue_name
    if bar_mode is not None:
        update["bar_mode"] = bar_mode
    if kds_enabled is not None:
        update["kds_enabled"] = kds_enabled
    if currency is not None:
        update["currency"] = currency
    if not update:
        raise HTTPException(400, "Nothing to update")
    update["updated_at"] = datetime.now(timezone.utc)
    await db.venue_configs.update_one({"venue_id": venue_id}, {"$set": update}, upsert=True)
    return {"updated": True}


# ─── AUDIT TRAIL ───────────────────────────────────────────────────
@router.get("/audit")
async def get_audit_trail(venue_id: str, user: dict = Depends(require_auth)):
    """Get recent audit events for this venue."""
    pool = get_postgres_pool()
    vid = _vid(venue_id)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT ae.event_type, ae.entity_type, ae.metadata, ae.timestamp, u.email
               FROM audit_events ae LEFT JOIN users u ON ae.user_id=u.id
               WHERE ae.venue_id=$1 ORDER BY ae.timestamp DESC LIMIT 50""", vid)
    return {"events": [{
        "event_type": r["event_type"],
        "entity_type": r["entity_type"],
        "metadata": r["metadata"] if isinstance(r["metadata"], dict) else json_mod.loads(r["metadata"]) if r["metadata"] else {},
        "timestamp": r["timestamp"].isoformat() if r["timestamp"] else None,
        "user": r["email"],
    } for r in rows]}


# ─── GUEST FUNNEL DRILL-DOWN ──────────────────────────────────────
@router.get("/funnel-detail")
async def get_funnel_detail(venue_id: str, stage: str, user: dict = Depends(require_auth)):
    """Drill-down for guest funnel: entries, allowed, tabs_open, tabs_closed."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _vid(venue_id)
    today = _today_start()

    results = []

    async with pool.acquire() as conn:
        if stage == "entries":
            rows = await conn.fetch(
                """SELECT guest_id, decision, entry_type, created_at
                   FROM entry_events WHERE venue_id=$1 AND created_at>=$2
                   ORDER BY created_at DESC""", vid, today)
            for r in rows:
                guest = await db.venue_guests.find_one({"id": str(r["guest_id"])}, {"_id": 0, "name": 1})
                results.append({
                    "guest_id": str(r["guest_id"]),
                    "name": guest["name"] if guest else "Unknown",
                    "decision": r["decision"],
                    "entry_type": r["entry_type"],
                    "time": r["created_at"].isoformat(),
                })

        elif stage == "allowed":
            rows = await conn.fetch(
                """SELECT guest_id, entry_type, created_at
                   FROM entry_events WHERE venue_id=$1 AND created_at>=$2 AND decision='allowed'
                   ORDER BY created_at DESC""", vid, today)
            for r in rows:
                guest = await db.venue_guests.find_one({"id": str(r["guest_id"])}, {"_id": 0, "name": 1})
                results.append({
                    "guest_id": str(r["guest_id"]),
                    "name": guest["name"] if guest else "Unknown",
                    "entry_type": r["entry_type"],
                    "time": r["created_at"].isoformat(),
                })

        elif stage == "tabs_open":
            rows = await conn.fetch(
                """SELECT ts.id, ts.guest_id, ts.total, ts.meta, ts.opened_at
                   FROM tap_sessions ts WHERE ts.venue_id=$1 AND ts.status='open'
                   ORDER BY ts.opened_at DESC""", vid)
            for r in rows:
                meta = r["meta"] if isinstance(r["meta"], dict) else json_mod.loads(r["meta"]) if r["meta"] else {}
                guest_name = meta.get("guest_name", "Guest")
                if r["guest_id"]:
                    guest = await db.venue_guests.find_one({"id": str(r["guest_id"])}, {"_id": 0, "name": 1})
                    if guest:
                        guest_name = guest["name"]
                results.append({
                    "guest_id": str(r["guest_id"]) if r["guest_id"] else None,
                    "name": guest_name,
                    "tab_number": meta.get("tab_number"),
                    "server_name": meta.get("server_name"),
                    "total": float(r["total"]),
                    "opened_at": r["opened_at"].isoformat() if r["opened_at"] else None,
                })

        elif stage == "tabs_closed":
            rows = await conn.fetch(
                """SELECT ts.id, ts.guest_id, ts.total, ts.meta, ts.closed_at
                   FROM tap_sessions ts WHERE ts.venue_id=$1 AND ts.status='closed' AND ts.closed_at>=$2
                   ORDER BY ts.closed_at DESC""", vid, today)
            for r in rows:
                meta = r["meta"] if isinstance(r["meta"], dict) else json_mod.loads(r["meta"]) if r["meta"] else {}
                guest_name = meta.get("guest_name", "Guest")
                results.append({
                    "guest_id": str(r["guest_id"]) if r["guest_id"] else None,
                    "name": guest_name,
                    "tab_number": meta.get("tab_number"),
                    "total": float(r["total"]),
                    "closed_at": r["closed_at"].isoformat() if r["closed_at"] else None,
                })

    return {"stage": stage, "results": results, "count": len(results)}


# ─── TABLES BY SERVER ─────────────────────────────────────────────
@router.get("/tables-by-server")
async def get_tables_by_server(venue_id: str, user: dict = Depends(require_auth)):
    """Get occupied tables grouped by server."""
    pool = get_postgres_pool()
    vid = _vid(venue_id)

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT t.id as table_id, t.table_number, t.zone, t.status,
                      s.id as session_id, s.total, s.meta, s.opened_at
               FROM venue_tables t
               LEFT JOIN tap_sessions s ON s.id = t.current_session_id AND s.status = 'open'
               WHERE t.venue_id = $1 AND t.status = 'occupied'
               ORDER BY t.table_number::int""", vid)

    by_server = {}
    unassigned = []
    for r in rows:
        meta = r["meta"] if isinstance(r["meta"], dict) else json_mod.loads(r["meta"]) if r["meta"] else {}
        table_info = {
            "table_id": str(r["table_id"]),
            "table_number": r["table_number"],
            "zone": r["zone"],
            "guest_name": meta.get("guest_name", "Guest"),
            "tab_number": meta.get("tab_number"),
            "total": float(r["total"]) if r["total"] else 0,
            "opened_at": r["opened_at"].isoformat() if r["opened_at"] else None,
        }
        server = meta.get("server_name")
        if server:
            by_server.setdefault(server, []).append(table_info)
        else:
            unassigned.append(table_info)

    servers = [{"server_name": name, "tables": tables, "table_count": len(tables),
                "total_revenue": sum(t["total"] for t in tables)}
               for name, tables in by_server.items()]

    return {
        "servers": servers,
        "unassigned": unassigned,
        "total_tables": len(rows),
    }



# ─── Table Detail Drill-down (Manager) ────────────────────────────
@router.get("/table-detail/{table_id}")
async def get_table_detail_for_manager(table_id: str, user: dict = Depends(require_auth)):
    """Get current order items for a table — used in Tables by Server drill-down."""
    pool = get_postgres_pool()
    tid = uuid.UUID(table_id)

    async with pool.acquire() as conn:
        table = await conn.fetchrow(
            "SELECT id, table_number, zone, capacity, status, current_session_id FROM venue_tables WHERE id = $1", tid)
        if not table:
            raise HTTPException(404, "Table not found")

        session = None
        items = []
        if table["current_session_id"]:
            sess = await conn.fetchrow(
                "SELECT id, total, meta, opened_at, status FROM tap_sessions WHERE id = $1",
                table["current_session_id"])
            if sess:
                meta = sess["meta"] if isinstance(sess["meta"], dict) else json_mod.loads(sess["meta"]) if sess["meta"] else {}
                session = {
                    "id": str(sess["id"]),
                    "total": float(sess["total"]) if sess["total"] else 0,
                    "guest_name": meta.get("guest_name", "Guest"),
                    "tab_number": meta.get("tab_number"),
                    "server_name": meta.get("server_name"),
                    "opened_at": sess["opened_at"].isoformat() if sess["opened_at"] else None,
                    "status": sess["status"],
                }
                item_rows = await conn.fetch(
                    """SELECT id, item_name, category, qty, line_total, unit_price, voided_at
                       FROM tap_items WHERE tap_session_id = $1 AND voided_at IS NULL
                       ORDER BY created_at""",
                    sess["id"])
                items = [{
                    "id": str(r["id"]),
                    "name": r["item_name"],
                    "category": r["category"],
                    "qty": r["qty"],
                    "line_total": float(r["line_total"]),
                    "unit_price": float(r["unit_price"]),
                } for r in item_rows]

    return {
        "table_id": str(table["id"]),
        "table_number": table["table_number"],
        "zone": table["zone"],
        "capacity": table["capacity"],
        "status": table["status"],
        "session": session,
        "items": items,
    }


@router.post("/table-void-item")
async def manager_void_item(
    user: dict = Depends(require_auth),
    session_id: str = Form(...),
    item_id: str = Form(...),
):
    """Manager voids an item from a table order."""
    pool = get_postgres_pool()
    sid = uuid.UUID(session_id)
    iid = uuid.UUID(item_id)
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        item = await conn.fetchrow(
            "SELECT id, line_total FROM tap_items WHERE id = $1 AND tap_session_id = $2 AND voided_at IS NULL",
            iid, sid)
        if not item:
            raise HTTPException(404, "Item not found or already voided")
        await conn.execute(
            "UPDATE tap_items SET voided_at = $1, voided_by_user_id = $2 WHERE id = $3",
            now, uuid.UUID(user["sub"]), iid)
        await conn.execute(
            "UPDATE tap_sessions SET total = GREATEST(0, total - $1), subtotal = GREATEST(0, subtotal - $1) WHERE id = $2",
            item["line_total"], sid)

    return {"status": "voided", "item_id": str(iid)}


# ═══════════════════════════════════════════════════════════════════
# SHIFT VS OPERATIONS
# ═══════════════════════════════════════════════════════════════════

def _parse_date_range(date_from: str = None, date_to: str = None):
    """Parse date range filters. Returns (start_dt, end_dt) in UTC."""
    if date_from:
        start = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
    else:
        start = _today_start()
    if date_to:
        end = datetime.fromisoformat(date_to).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    else:
        end = datetime.now(timezone.utc)
    return start, end


async def _calc_staff_cost(db, venue_id: str, start: datetime, end: datetime):
    """Calculate total staff cost for a period based on active staff and their hourly rates.
    Also queries actual tips from tap_sessions.meta for the period."""
    pool = get_postgres_pool()
    cursor = db.venue_barmen.find({"venue_id": venue_id, "active": True}, {"_id": 0})
    staff = await cursor.to_list(100)
    hours_in_period = max((end - start).total_seconds() / 3600, 1)
    shift_hours = min(hours_in_period, 12)

    # Query actual tip data from closed sessions in this period
    vid = uuid.UUID(venue_id)
    total_tips_period = 0
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT meta FROM tap_sessions
               WHERE venue_id=$1 AND status='closed'
               AND closed_at>=$2 AND closed_at<=$3""",
            vid, start, end)
    for r in rows:
        meta = _parse_meta(r["meta"])
        if meta.get("tip_recorded") and meta.get("tip_amount", 0) > 0:
            total_tips_period += meta.get("tip_amount", 0)

    # Distribute tips proportionally among active staff
    staff_count = len(staff) if staff else 1
    tip_per_staff = round(total_tips_period / staff_count, 2) if staff_count > 0 else 0

    total_cost = 0
    staff_breakdown = []
    for s in staff:
        rate = s.get("hourly_rate", 0)
        wages = round(rate * shift_hours, 2)
        tips = tip_per_staff
        total = round(wages + tips, 2)
        total_cost += wages  # Cost = wages only; tips are earnings
        staff_breakdown.append({
            "id": s["id"],
            "name": s["name"],
            "role": s.get("role", "server"),
            "hourly_rate": rate,
            "hours_worked": round(shift_hours, 1),
            "wages": wages,
            "tips": tips,
            "total": total,
            "earned": total,
        })
    return total_cost, staff_breakdown, round(total_tips_period, 2)


# ─── STAFF ROLES (Customizable) ───────────────────────────────────
@router.get("/staff-roles")
async def get_staff_roles(venue_id: str, user: dict = Depends(require_auth)):
    """Get custom staff roles for this venue."""
    db = get_mongo_db()
    cursor = db.staff_roles.find({"venue_id": venue_id}, {"_id": 0})
    roles = await cursor.to_list(100)
    return {"roles": roles}


@router.post("/staff-roles")
async def create_or_update_role(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    role_id: str = Form(None),
    name: str = Form(...),
    hourly_rate: float = Form(...),
):
    """Create or update a custom staff role. Versioned for audit."""
    db = get_mongo_db()
    now = datetime.now(timezone.utc)
    if role_id:
        # Update existing role — snapshot old version
        old = await db.staff_roles.find_one({"id": role_id, "venue_id": venue_id}, {"_id": 0})
        if old:
            await db.staff_roles_history.insert_one({
                **old,
                "superseded_at": now,
            })
        await db.staff_roles.update_one(
            {"id": role_id, "venue_id": venue_id},
            {"$set": {"name": name, "hourly_rate": hourly_rate, "updated_at": now}},
        )
        return {"id": role_id, "name": name, "hourly_rate": hourly_rate, "updated": True}
    else:
        role = {
            "id": str(uuid.uuid4()),
            "venue_id": venue_id,
            "name": name,
            "hourly_rate": hourly_rate,
            "created_at": now,
            "updated_at": now,
        }
        await db.staff_roles.insert_one(role)
        role.pop("_id", None)
        return role


@router.delete("/staff-roles/{role_id}")
async def delete_role(role_id: str, venue_id: str, user: dict = Depends(require_auth)):
    """Soft-delete a role (archive to history, remove from active)."""
    db = get_mongo_db()
    old = await db.staff_roles.find_one({"id": role_id, "venue_id": venue_id}, {"_id": 0})
    if not old:
        raise HTTPException(404, "Role not found")
    await db.staff_roles_history.insert_one({**old, "deleted_at": datetime.now(timezone.utc)})
    await db.staff_roles.delete_one({"id": role_id, "venue_id": venue_id})
    return {"id": role_id, "deleted": True}


# ─── CUSTOMIZE STAFF (assign role + hourly rate) ──────────────────
@router.put("/staff-customize/{staff_id}")
async def customize_staff(
    staff_id: str,
    user: dict = Depends(require_auth),
    role: str = Form(None),
    hourly_rate: float = Form(None),
):
    """Assign a custom role and/or hourly rate to a staff member."""
    db = get_mongo_db()
    update = {}
    if role is not None:
        update["role"] = role
    if hourly_rate is not None:
        update["hourly_rate"] = hourly_rate
    if not update:
        raise HTTPException(400, "Nothing to update")
    update["updated_at"] = datetime.now(timezone.utc)
    result = await db.venue_barmen.update_one({"id": staff_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Staff not found")
    return {"id": staff_id, "updated": True}


# ─── SHIFT OVERVIEW ───────────────────────────────────────────────
@router.get("/shift-overview")
async def get_shift_overview(
    venue_id: str,
    date_from: str = None,
    date_to: str = None,
    user: dict = Depends(require_auth),
):
    """Shift Overview — Revenue, Tables Closed, Active Staff Cost."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _vid(venue_id)
    start, end = _parse_date_range(date_from, date_to)

    async with pool.acquire() as conn:
        revenue = float(await conn.fetchval(
            "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2 AND closed_at<=$3",
            vid, start, end) or 0)
        tables_closed = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2 AND closed_at<=$3",
            vid, start, end) or 0
        avg_ticket = float(await conn.fetchval(
            "SELECT COALESCE(AVG(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2 AND closed_at<=$3",
            vid, start, end) or 0)

    staff_cost, staff_breakdown = await _calc_staff_cost(db, venue_id, start, end)
    total_tips = sum(s["tips"] for s in staff_breakdown)
    result = revenue - staff_cost
    status = "positive" if result > 0 else ("tight" if result > -50 else "negative")

    return {
        "revenue": revenue,
        "tables_closed": tables_closed,
        "avg_ticket": round(avg_ticket, 2),
        "staff_cost": round(staff_cost, 2),
        "tips": round(total_tips, 2),
        "result": round(result, 2),
        "status": status,
        "period": {"from": start.isoformat(), "to": end.isoformat()},
    }


# ─── SHIFT KPI DRILL-DOWN ─────────────────────────────────────────
@router.get("/shift-drilldown")
async def get_shift_drilldown(
    venue_id: str,
    kpi: str,
    date_from: str = None,
    date_to: str = None,
    user: dict = Depends(require_auth),
):
    """Drill-down for a specific KPI: revenue, tables, staff_cost, tips."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _vid(venue_id)
    start, end = _parse_date_range(date_from, date_to)

    if kpi == "revenue":
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT id, total, meta, closed_at
                   FROM tap_sessions WHERE venue_id=$1 AND status='closed'
                   AND closed_at>=$2 AND closed_at<=$3 ORDER BY closed_at DESC""",
                vid, start, end)
        items = []
        for r in rows:
            meta = _parse_meta(r["meta"])
            items.append({
                "session_id": str(r["id"]),
                "guest_name": meta.get("guest_name", "Guest"),
                "tab_number": meta.get("tab_number"),
                "total": float(r["total"]),
                "closed_at": r["closed_at"].isoformat() if r["closed_at"] else None,
            })
        return {"kpi": "revenue", "items": items, "count": len(items)}

    elif kpi == "tables":
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT s.id, s.total, s.meta, s.closed_at, vt.table_number
                   FROM tap_sessions s
                   LEFT JOIN venue_tables vt ON vt.current_session_id = s.id OR vt.id = s.table_id
                   WHERE s.venue_id=$1 AND s.status='closed' AND s.session_type='table'
                   AND s.closed_at>=$2 AND s.closed_at<=$3 ORDER BY s.closed_at DESC""",
                vid, start, end)
        items = []
        for r in rows:
            meta = _parse_meta(r["meta"])
            items.append({
                "session_id": str(r["id"]),
                "table_number": r["table_number"] or "—",
                "guest_name": meta.get("guest_name", "Guest"),
                "server_name": meta.get("server_name", "—"),
                "total": float(r["total"]),
                "closed_at": r["closed_at"].isoformat() if r["closed_at"] else None,
            })
        return {"kpi": "tables", "items": items, "count": len(items)}

    elif kpi == "staff_cost":
        _, breakdown = await _calc_staff_cost(db, venue_id, start, end)
        return {"kpi": "staff_cost", "items": breakdown, "count": len(breakdown)}

    elif kpi == "tips":
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT id, total, meta, closed_at
                   FROM tap_sessions WHERE venue_id=$1 AND status='closed'
                   AND closed_at>=$2 AND closed_at<=$3""",
                vid, start, end)
        tip_items = []
        for r in rows:
            meta = _parse_meta(r["meta"])
            if meta.get("tip_recorded") and meta.get("tip_amount", 0) > 0:
                tip_items.append({
                    "session_id": str(r["id"]),
                    "guest_name": meta.get("guest_name", "Guest"),
                    "tab_number": meta.get("tab_number"),
                    "total": float(r["total"]),
                    "tip_amount": meta.get("tip_amount", 0),
                    "tip_percent": meta.get("tip_percent", 0),
                    "closed_at": r["closed_at"].isoformat() if r["closed_at"] else None,
                })
        return {"kpi": "tips", "items": tip_items, "count": len(tip_items)}

    raise HTTPException(400, "kpi must be: revenue, tables, staff_cost, or tips")



# ─── STAFF COSTS BREAKDOWN ────────────────────────────────────────
@router.get("/staff-costs")
async def get_staff_costs(
    venue_id: str,
    date_from: str = None,
    date_to: str = None,
    user: dict = Depends(require_auth),
):
    """Staff Earnings / Cost Breakdown for the period."""
    db = get_mongo_db()
    start, end = _parse_date_range(date_from, date_to)
    total_cost, breakdown = await _calc_staff_cost(db, venue_id, start, end)
    return {
        "total_cost": round(total_cost, 2),
        "staff": breakdown,
        "period": {"from": start.isoformat(), "to": end.isoformat()},
    }


# ─── SHIFT HISTORY / DAY PERFORMANCE ──────────────────────────────
@router.get("/shift-history")
async def get_shift_history(
    venue_id: str,
    days: int = 30,
    user: dict = Depends(require_auth),
):
    """Shift History — per-day performance with revenue, cost, result, status."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _vid(venue_id)
    today = date.today()

    history = []
    for i in range(days):
        d = today - timedelta(days=i)
        day_start = datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc)
        day_end = datetime.combine(d, datetime.max.time()).replace(tzinfo=timezone.utc)

        async with pool.acquire() as conn:
            rev = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2 AND closed_at<=$3",
                vid, day_start, day_end) or 0)
            tabs = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2 AND closed_at<=$3",
                vid, day_start, day_end) or 0

        # Get shift snapshot cost if exists, otherwise calc from current rates
        shift_snap = await db.shift_snapshots.find_one({"venue_id": venue_id, "date": d.isoformat()}, {"_id": 0})
        if shift_snap:
            cost = shift_snap.get("staff_cost", 0)
        else:
            cost, _ = await _calc_staff_cost(db, venue_id, day_start, day_end)

        result = rev - cost
        status = "positive" if result > 50 else ("tight" if result > -50 else "negative")

        if rev > 0 or cost > 0 or tabs > 0:
            history.append({
                "date": d.isoformat(),
                "day_name": d.strftime("%A"),
                "revenue": round(rev, 2),
                "tabs_closed": tabs,
                "staff_cost": round(cost, 2),
                "result": round(result, 2),
                "status": status,
            })

    return {"history": history, "days": days}


# ─── SHIFT CHART DATA ─────────────────────────────────────────────
@router.get("/shift-chart")
async def get_shift_chart(
    venue_id: str,
    period: str = "30d",
    date_from: str = None,
    date_to: str = None,
    user: dict = Depends(require_auth),
):
    """Chart data: Revenue × Staff Cost per day, filtered by period."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _vid(venue_id)
    today = date.today()

    if period == "today":
        days_back = 1
    elif period == "7d":
        days_back = 7
    elif period == "30d":
        days_back = 30
    elif period == "year":
        days_back = 365
    elif period == "custom" and date_from and date_to:
        d1 = date.fromisoformat(date_from)
        d2 = date.fromisoformat(date_to)
        days_back = (d2 - d1).days + 1
        today = d2
    else:
        days_back = 30

    chart_data = []
    for i in range(days_back):
        d = today - timedelta(days=i)
        day_start = datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc)
        day_end = datetime.combine(d, datetime.max.time()).replace(tzinfo=timezone.utc)

        async with pool.acquire() as conn:
            rev = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2 AND closed_at<=$3",
                vid, day_start, day_end) or 0)

        shift_snap = await db.shift_snapshots.find_one({"venue_id": venue_id, "date": d.isoformat()}, {"_id": 0})
        cost = shift_snap.get("staff_cost", 0) if shift_snap else 0
        if not shift_snap:
            cost_calc, _ = await _calc_staff_cost(db, venue_id, day_start, day_end)
            cost = cost_calc

        if rev > 0 or cost > 0:
            chart_data.append({
                "date": d.isoformat(),
                "label": d.strftime("%b %d"),
                "revenue": round(rev, 2),
                "cost": round(cost, 2),
                "result": round(rev - cost, 2),
            })

    chart_data.reverse()
    return {"data": chart_data, "period": period}


# ─── SHIFT CLOSE WITH SNAPSHOT ─────────────────────────────────────
@router.post("/shift-snapshot")
async def save_shift_snapshot(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    target_date: str = Form(None),
):
    """Snapshot staff costs for a specific date (preserves historical rates)."""
    db = get_mongo_db()
    d = target_date or date.today().isoformat()
    day_start = datetime.fromisoformat(d).replace(tzinfo=timezone.utc)
    day_end = day_start + timedelta(hours=24)
    total_cost, breakdown = await _calc_staff_cost(db, venue_id, day_start, day_end)

    snapshot = {
        "venue_id": venue_id,
        "date": d,
        "staff_cost": round(total_cost, 2),
        "staff_breakdown": breakdown,
        "created_by": user.get("email", user["sub"]),
        "created_at": datetime.now(timezone.utc),
    }
    await db.shift_snapshots.update_one(
        {"venue_id": venue_id, "date": d}, {"$set": snapshot}, upsert=True)
    return {"saved": True, "date": d, "staff_cost": round(total_cost, 2)}


# ─── SHIFT AI (GPT-5.2) — Conversational & Participatory ──────────
SHIFT_AI_SYSTEM = """You are an AI operational partner for a hospitality venue manager.
You analyze shift and operations data, and you guide the manager through analysis with follow-up suggestions.

Tone: Operational, direct, practical. You speak like a senior operations consultant who knows the floor.

Core Rules:
1. Always use the REAL data provided — never invent numbers.
2. Classify the operation as: healthy, tight, or underperforming.
3. Detect inefficiencies: overstaffing, high cost per table, low return per shift.
4. Be direct, operational, and actionable.
5. NEVER perform write operations or change any data.
6. External references may support recommendations but never replace internal data.

Response Structure (MANDATORY — return as JSON):
{
  "summary": "Brief classification headline of the shift/period",
  "what_we_see": "Detailed analysis based on the data — be specific with numbers",
  "recommended_actions": ["action 1", "action 2", "action 3"],
  "next_steps": ["Follow-up question 1?", "Follow-up question 2?", "Follow-up question 3?"],
  "reference": "external reference if used, otherwise null",
  "classification": "healthy" | "tight" | "underperforming"
}

The "next_steps" field is MANDATORY. It must contain 3-5 specific follow-up questions the manager might want to ask next. These should be:
- Related to the current data and analysis
- Actionable and operational (e.g., "Which staff member has the highest cost per table served?", "Should I reduce the team by 1 person on slow days?", "What would happen to margins if I increased the average ticket by $5?")
- Written as complete questions in the manager's operational context

Return ONLY valid JSON. No markdown, no explanation outside the JSON."""


@router.post("/shift-ai")
async def shift_ai_analysis(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    date_from: str = Form(...),
    date_to: str = Form(...),
    question: str = Form(None),
):
    """AI analysis of shift performance. Read-only, context-aware."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _vid(venue_id)
    start, end = _parse_date_range(date_from, date_to)

    # Gather shift data
    async with pool.acquire() as conn:
        revenue = float(await conn.fetchval(
            "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2 AND closed_at<=$3",
            vid, start, end) or 0)
        tables_closed = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2 AND closed_at<=$3",
            vid, start, end) or 0
        avg_ticket = float(await conn.fetchval(
            "SELECT COALESCE(AVG(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2 AND closed_at<=$3",
            vid, start, end) or 0)
        voids = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND voided_at>=$2 AND voided_at<=$3",
            vid, start, end) or 0

    total_cost, staff_breakdown = await _calc_staff_cost(db, venue_id, start, end)
    result = revenue - total_cost
    cost_per_table = round(total_cost / tables_closed, 2) if tables_closed > 0 else 0
    rev_per_staff = round(revenue / len(staff_breakdown), 2) if staff_breakdown else 0

    cfg = await db.venue_configs.find_one({"venue_id": venue_id}, {"_id": 0})
    venue_name = cfg.get("venue_name", "Venue") if cfg else "Venue"
    bar_mode = cfg.get("bar_mode", "disco") if cfg else "disco"

    staff_lines = "\n".join([f"  - {s['name']} ({s['role']}): ${s['hourly_rate']}/hr × {s['hours_worked']}h = Wages ${s['wages']} + Tips ${s['tips']} = Total ${s['total']}" for s in staff_breakdown])

    context = f"""
VENUE: {venue_name} (Type: {bar_mode})
PERIOD: {start.strftime('%Y-%m-%d %H:%M')} to {end.strftime('%Y-%m-%d %H:%M')}

REVENUE: ${revenue:.2f}
TABLES CLOSED: {tables_closed}
AVG TICKET: ${avg_ticket:.2f}
VOIDS: {voids}

STAFF COST (TOTAL): ${total_cost:.2f}
COST PER TABLE: ${cost_per_table}
REVENUE PER STAFF MEMBER: ${rev_per_staff}

STAFF BREAKDOWN:
{staff_lines}

NET RESULT: ${result:.2f} ({'POSITIVE' if result > 0 else 'NEGATIVE'})
"""

    user_msg = f"Analyze this shift data:\n{context}"
    if question:
        user_msg += f"\n\nManager's question: {question}"
    else:
        user_msg += "\n\nProvide a complete shift analysis."

    try:
        llm_key = os.environ.get("EMERGENT_LLM_KEY")
        if not llm_key:
            return {"insight": {"summary": "LLM not configured"}, "disclaimer": ""}

        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm = LlmChat(
            api_key=llm_key,
            session_id=f"shift-ai-{venue_id}-{date_from}",
            system_message=SHIFT_AI_SYSTEM,
        ).with_model("openai", "gpt-5.2")

        raw = await llm.send_message(UserMessage(text=user_msg))
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        insight = json_mod.loads(text)
    except Exception as e:
        logger.error(f"Shift AI error: {e}")
        insight = {
            "summary": "Unable to generate analysis",
            "what_we_see": str(e),
            "recommended_actions": ["Try again later"],
            "reference": None,
            "classification": "unknown",
        }

    return {
        "insight": insight,
        "data": {
            "revenue": revenue,
            "tables_closed": tables_closed,
            "staff_cost": round(total_cost, 2),
            "result": round(result, 2),
        },
        "disclaimer": "AI insights are based on your business data and external references when applicable. They may contain inaccuracies. Always validate decisions with your team.",
    }

