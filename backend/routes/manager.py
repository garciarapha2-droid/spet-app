from fastapi import APIRouter, HTTPException, Depends, Form, Query
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
from datetime import datetime, timezone, date, timedelta
import uuid
import json as json_mod
import logging
import csv
import io

logger = logging.getLogger(__name__)
router = APIRouter()

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
    """List guests for this venue."""
    db = get_mongo_db()
    query = {"venue_id": venue_id}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    cursor = db.venue_guests.find(query, {"_id": 0}).sort("last_visit", -1).limit(100)
    guests = await cursor.to_list(100)
    total = await db.venue_guests.count_documents({"venue_id": venue_id})
    return {"guests": guests, "total": total}


@router.get("/guests/{guest_id}")
async def get_guest_detail(guest_id: str, venue_id: str, user: dict = Depends(require_auth)):
    """Get guest profile with visit history."""
    db = get_mongo_db()
    pool = get_postgres_pool()
    vid = _vid(venue_id)

    guest = await db.venue_guests.find_one({"id": guest_id, "venue_id": venue_id}, {"_id": 0})
    if not guest:
        raise HTTPException(404, "Guest not found")

    # Visit history from PG
    async with pool.acquire() as conn:
        entries = await conn.fetch(
            """SELECT entry_type, cover_amount, cover_paid, decision, created_at
               FROM entry_events WHERE venue_id=$1 AND guest_id=$2::uuid
               ORDER BY created_at DESC LIMIT 20""", vid, uuid.UUID(guest_id))
        sessions = await conn.fetch(
            """SELECT id, status, total, opened_at, closed_at, meta
               FROM tap_sessions WHERE venue_id=$1 AND guest_id=$2::uuid
               ORDER BY opened_at DESC LIMIT 20""", vid, uuid.UUID(guest_id))

    return {
        "guest": guest,
        "entries": [{"entry_type": e["entry_type"], "cover_amount": float(e["cover_amount"]) if e["cover_amount"] else 0,
                     "decision": e["decision"], "date": e["created_at"].isoformat()} for e in entries],
        "sessions": [{"id": str(s["id"]), "status": s["status"], "total": float(s["total"]),
                      "opened_at": s["opened_at"].isoformat() if s["opened_at"] else None,
                      "closed_at": s["closed_at"].isoformat() if s["closed_at"] else None} for s in sessions],
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
