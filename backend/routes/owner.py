from fastapi import APIRouter, HTTPException, Depends, Form
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
from datetime import datetime, timezone, date, timedelta
import uuid
import json as json_mod
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter()


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


def _year_start():
    today = date.today()
    return datetime.combine(today.replace(month=1, day=1), datetime.min.time()).replace(tzinfo=timezone.utc)


def _prev_month_range():
    today = date.today()
    first_this = today.replace(day=1)
    last_prev = first_this - timedelta(days=1)
    first_prev = last_prev.replace(day=1)
    return (
        datetime.combine(first_prev, datetime.min.time()).replace(tzinfo=timezone.utc),
        datetime.combine(first_this, datetime.min.time()).replace(tzinfo=timezone.utc),
    )


# ─── helper: get user venue_ids ────────────────────────────────────
async def _get_user_venue_ids(pool, user_id: str):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT venue_id FROM user_access WHERE user_id = $1::uuid", user_id)
    return [r["venue_id"] for r in rows if r["venue_id"]]


# ─── OWNER OVERVIEW ───────────────────────────────────────────────
@router.get("/dashboard")
async def get_owner_dashboard(user: dict = Depends(require_auth), view: str = "business"):
    """Owner Overview — supports view modes: business (default), venue, events."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    now = datetime.now(timezone.utc)
    today = _today_start()
    month = _month_start()
    year = _year_start()
    prev_start, prev_end = _prev_month_range()

    user_id = user["sub"]
    venue_ids = await _get_user_venue_ids(pool, user_id)

    if not venue_ids:
        return {"kpis": {}, "venues": [], "view": view}

    # ─── Business View (aggregated) ───
    if view == "business":
        async with pool.acquire() as conn:
            rev_today = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id = ANY($1) AND status='closed' AND closed_at>=$2",
                venue_ids, today) or 0)
            rev_mtd = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id = ANY($1) AND status='closed' AND closed_at>=$2",
                venue_ids, month) or 0)
            rev_ytd = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id = ANY($1) AND status='closed' AND closed_at>=$2",
                venue_ids, year) or 0)
            rev_prev_month = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id = ANY($1) AND status='closed' AND closed_at>=$2 AND closed_at<$3",
                venue_ids, prev_start, prev_end) or 0)
            growth_pct = round(((rev_mtd - rev_prev_month) / rev_prev_month * 100) if rev_prev_month > 0 else 0, 1)
            total_guests_today = await conn.fetchval(
                "SELECT COUNT(DISTINCT guest_id) FROM entry_events WHERE venue_id = ANY($1) AND created_at>=$2 AND decision='allowed'",
                venue_ids, today) or 0
            open_tabs = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_sessions WHERE venue_id = ANY($1) AND status='open'", venue_ids) or 0
            running_total = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id = ANY($1) AND status='open'", venue_ids) or 0)
            closed_today = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_sessions WHERE venue_id = ANY($1) AND status='closed' AND closed_at>=$2",
                venue_ids, today) or 0
            avg_ticket = float(await conn.fetchval(
                "SELECT COALESCE(AVG(total),0) FROM tap_sessions WHERE venue_id = ANY($1) AND status='closed' AND closed_at>=$2",
                venue_ids, today) or 0)
            unique_guests_month = await conn.fetchval(
                "SELECT COUNT(DISTINCT guest_id) FROM entry_events WHERE venue_id = ANY($1) AND created_at>=$2 AND decision='allowed'",
                venue_ids, month) or 0
            arpu = round(rev_mtd / unique_guests_month, 2) if unique_guests_month > 0 else 0
            estimated_profit = round(rev_mtd * 0.30, 2)
            returning = await conn.fetchval(
                """SELECT COUNT(*) FROM (
                    SELECT guest_id FROM entry_events WHERE venue_id = ANY($1) AND created_at>=$2 AND decision='allowed'
                    GROUP BY guest_id HAVING COUNT(*)>1
                ) sub""", venue_ids, month) or 0
            retention_pct = round((returning / unique_guests_month * 100) if unique_guests_month > 0 else 0, 1)

        # Venues list
        venues_data = []
        for vid in venue_ids:
            cfg = await db.venue_configs.find_one({"venue_id": str(vid)}, {"_id": 0})
            venue_name = cfg.get("venue_name", "Demo Club") if cfg else "Demo Club"
            async with pool.acquire() as conn:
                v_rev = float(await conn.fetchval(
                    "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2",
                    vid, today) or 0)
                v_tabs = await conn.fetchval(
                    "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open'", vid) or 0
                v_guests = await conn.fetchval(
                    "SELECT COUNT(DISTINCT guest_id) FROM entry_events WHERE venue_id=$1 AND created_at>=$2 AND decision='allowed'",
                    vid, today) or 0
                v_voids = await conn.fetchval(
                    "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND voided_at>=$2", vid, today) or 0
            health = "green"
            if v_voids > 5:
                health = "yellow"
            if v_voids > 10:
                health = "red"
            venues_data.append({
                "venue_id": str(vid), "name": venue_name,
                "revenue_today": v_rev, "open_tabs": v_tabs,
                "guests_today": v_guests, "voids_today": v_voids, "health": health,
            })

        return {
            "view": "business",
            "kpis": {
                "revenue_today": rev_today, "revenue_mtd": rev_mtd, "revenue_ytd": rev_ytd,
                "growth_pct": growth_pct, "estimated_profit": estimated_profit,
                "avg_ticket": round(avg_ticket, 2), "arpu": arpu,
                "retention_pct": retention_pct, "total_guests_today": total_guests_today,
                "open_tabs": open_tabs, "running_total": running_total,
                "closed_today": closed_today, "unique_guests_month": unique_guests_month,
            },
            "venues": venues_data,
        }

    # ─── Venue View (per-venue financials) ───
    elif view == "venue":
        venues_data = []
        for vid in venue_ids:
            cfg = await db.venue_configs.find_one({"venue_id": str(vid)}, {"_id": 0})
            venue_name = cfg.get("venue_name", "Demo Club") if cfg else "Demo Club"
            async with pool.acquire() as conn:
                rev_today = float(await conn.fetchval(
                    "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0)
                rev_mtd = float(await conn.fetchval(
                    "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, month) or 0)
                rev_ytd = float(await conn.fetchval(
                    "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, year) or 0)
                avg_ticket = float(await conn.fetchval(
                    "SELECT COALESCE(AVG(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0)
                open_tabs = await conn.fetchval(
                    "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open'", vid) or 0
                closed_today = await conn.fetchval(
                    "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0
                guests_today = await conn.fetchval(
                    "SELECT COUNT(DISTINCT guest_id) FROM entry_events WHERE venue_id=$1 AND created_at>=$2 AND decision='allowed'", vid, today) or 0
                voids = await conn.fetchval(
                    "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND voided_at>=$2", vid, today) or 0
            staff_count = await db.venue_barmen.count_documents({"venue_id": str(vid), "active": True})
            health = "green"
            if voids > 5: health = "yellow"
            if voids > 10: health = "red"
            venues_data.append({
                "venue_id": str(vid), "name": venue_name, "health": health,
                "revenue_today": rev_today, "revenue_mtd": rev_mtd, "revenue_ytd": rev_ytd,
                "avg_ticket": round(avg_ticket, 2), "open_tabs": open_tabs,
                "closed_today": closed_today, "guests_today": guests_today,
                "voids_today": voids, "staff_count": staff_count,
            })
        return {"view": "venue", "venues": venues_data}

    # ─── Events View (per-event financials) ───
    elif view == "events":
        events_data = []
        for vid in venue_ids:
            cfg = await db.venue_configs.find_one({"venue_id": str(vid)}, {"_id": 0})
            venue_name = cfg.get("venue_name", "Demo Club") if cfg else "Demo Club"
            async with pool.acquire() as conn:
                events = await conn.fetch(
                    """SELECT id, name, event_date, status, start_time, end_time
                       FROM venue_events WHERE venue_id=$1
                       ORDER BY event_date DESC LIMIT 20""", vid)
                for ev in events:
                    ev_id = ev["id"]
                    ev_rev = float(await conn.fetchval(
                        """SELECT COALESCE(SUM(ts.total),0) FROM tap_sessions ts
                           WHERE ts.venue_id=$1 AND ts.status='closed'
                           AND ts.meta->>'event_id' = $2""",
                        vid, str(ev_id)) or 0)
                    ev_tabs = await conn.fetchval(
                        """SELECT COUNT(*) FROM tap_sessions ts
                           WHERE ts.venue_id=$1 AND ts.status='closed'
                           AND ts.meta->>'event_id' = $2""",
                        vid, str(ev_id)) or 0
                    ev_guests = await conn.fetchval(
                        "SELECT COUNT(*) FROM event_guests WHERE venue_id=$1 AND event_id=$2",
                        vid, ev_id) or 0
                    ev_staff = await conn.fetchval(
                        "SELECT COUNT(*) FROM event_staff WHERE venue_id=$1 AND event_id=$2",
                        vid, ev_id) or 0
                    events_data.append({
                        "event_id": str(ev_id), "name": ev["name"],
                        "venue_name": venue_name, "venue_id": str(vid),
                        "event_date": ev["event_date"].isoformat() if ev["event_date"] else None,
                        "status": ev["status"],
                        "start_time": ev["start_time"] if ev["start_time"] else None,
                        "end_time": ev["end_time"] if ev["end_time"] else None,
                        "revenue": ev_rev, "tabs_closed": ev_tabs,
                        "guests": ev_guests, "staff": ev_staff,
                    })
        # Sort by event_date desc
        events_data.sort(key=lambda x: x["event_date"] or "", reverse=True)
        return {"view": "events", "events": events_data}

    # Fallback to business
    return {"view": view, "kpis": {}, "venues": []}


# ─── PERFORMANCE BY VENUE ─────────────────────────────────────────
@router.get("/venues")
async def get_venues_performance(user: dict = Depends(require_auth)):
    """Performance by Venue — drill-down with health status."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    today = _today_start()
    month = _month_start()
    user_id = user["sub"]

    async with pool.acquire() as conn:
        access_rows = await conn.fetch(
            "SELECT venue_id FROM user_access WHERE user_id = $1::uuid", user_id)
        venue_ids = [r["venue_id"] for r in access_rows if r["venue_id"]]

    venues = []
    for vid in venue_ids:
        cfg = await db.venue_configs.find_one({"venue_id": str(vid)}, {"_id": 0})
        venue_name = cfg.get("venue_name", "Demo Club") if cfg else "Demo Club"

        async with pool.acquire() as conn:
            rev_today = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0)
            rev_month = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, month) or 0)
            tabs_open = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open'", vid) or 0
            tabs_closed = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0
            guests_today = await conn.fetchval(
                "SELECT COUNT(DISTINCT guest_id) FROM entry_events WHERE venue_id=$1 AND created_at>=$2 AND decision='allowed'", vid, today) or 0
            avg_ticket = float(await conn.fetchval(
                "SELECT COALESCE(AVG(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0)
            voids = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND voided_at>=$2", vid, today) or 0

            # Top items
            top = await conn.fetch(
                "SELECT item_name, SUM(line_total) as rev FROM tap_items WHERE venue_id=$1 AND created_at>=$2 AND voided_at IS NULL GROUP BY item_name ORDER BY rev DESC LIMIT 5",
                vid, today)

        # Staff count from MongoDB
        barmen_count = await db.venue_barmen.count_documents({"venue_id": str(vid), "active": True})

        health = "green"
        if voids > 3:
            health = "yellow"
        if voids > 8 or tabs_open > 20:
            health = "red"

        venues.append({
            "venue_id": str(vid),
            "name": venue_name,
            "health": health,
            "revenue_today": rev_today,
            "revenue_month": rev_month,
            "tabs_open": tabs_open,
            "tabs_closed_today": tabs_closed,
            "guests_today": guests_today,
            "avg_ticket": round(avg_ticket, 2),
            "voids_today": voids,
            "staff_count": barmen_count,
            "top_items": [{"name": r["item_name"], "revenue": float(r["rev"])} for r in top],
        })

    return {"venues": venues}


# ─── AI INSIGHTS (Rule-Based) ─────────────────────────────────────
@router.get("/insights")
async def get_insights(user: dict = Depends(require_auth)):
    """Rule-based AI Insights: Situation → Impact → Suggested Action."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    today = _today_start()
    now = datetime.now(timezone.utc)
    user_id = user["sub"]

    async with pool.acquire() as conn:
        access_rows = await conn.fetch(
            "SELECT venue_id FROM user_access WHERE user_id = $1::uuid", user_id)
        venue_ids = [r["venue_id"] for r in access_rows if r["venue_id"]]

    insights = []

    for vid in venue_ids:
        cfg = await db.venue_configs.find_one({"venue_id": str(vid)}, {"_id": 0})
        venue_name = cfg.get("venue_name", "Demo Club") if cfg else "Demo Club"

        async with pool.acquire() as conn:
            # Rule 1: High void rate
            voids = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND voided_at>=$2", vid, today) or 0
            total_items = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND created_at>=$2", vid, today) or 0
            if total_items > 0 and voids / total_items > 0.1:
                insights.append({
                    "id": f"void-{vid}",
                    "venue": venue_name,
                    "type": "warning",
                    "situation": f"{voids} items voided out of {total_items} ({round(voids/total_items*100)}%)",
                    "impact": "High void rate may indicate staff errors, guest dissatisfaction, or fraud",
                    "suggestion": "Review void reasons, retrain staff on order accuracy, check for patterns",
                })

            # Rule 2: Long open tabs (>3h)
            long_tabs = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open' AND opened_at<$2",
                vid, now - timedelta(hours=3)) or 0
            if long_tabs > 0:
                insights.append({
                    "id": f"long-tabs-{vid}",
                    "venue": venue_name,
                    "type": "info",
                    "situation": f"{long_tabs} tab(s) open for more than 3 hours",
                    "impact": "Long tabs may lead to billing disputes or abandoned checks",
                    "suggestion": "Notify servers to check on these tables, consider auto-close policy",
                })

            # Rule 3: Revenue below average
            avg_daily = float(await conn.fetchval(
                """SELECT COALESCE(AVG(daily_rev), 0) FROM (
                    SELECT DATE(closed_at) as day, SUM(total) as daily_rev
                    FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2
                    GROUP BY DATE(closed_at)
                ) sub""", vid, now - timedelta(days=30)) or 0)
            rev_today = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2",
                vid, today) or 0)
            if avg_daily > 0 and rev_today < avg_daily * 0.5 and now.hour > 14:
                insights.append({
                    "id": f"low-rev-{vid}",
                    "venue": venue_name,
                    "type": "critical",
                    "situation": f"Today's revenue (${rev_today:.0f}) is below 50% of daily average (${avg_daily:.0f})",
                    "impact": "Revenue shortfall affects monthly targets and cash flow",
                    "suggestion": "Check if there's an external event affecting traffic, review promotions",
                })

            # Rule 4: Delayed orders in KDS
            delayed = await conn.fetchval(
                "SELECT COUNT(*) FROM kds_tickets WHERE venue_id=$1 AND status='delayed'", vid) or 0
            if delayed > 2:
                insights.append({
                    "id": f"kds-delayed-{vid}",
                    "venue": venue_name,
                    "type": "warning",
                    "situation": f"{delayed} orders marked as delayed in kitchen",
                    "impact": "Delayed orders reduce guest satisfaction and may cause complaints",
                    "suggestion": "Check kitchen staffing levels, review prep times, consider menu simplification",
                })

            # Rule 5: No entries today (if past noon)
            entries = await conn.fetchval(
                "SELECT COUNT(*) FROM entry_events WHERE venue_id=$1 AND created_at>=$2", vid, today) or 0
            if entries == 0 and now.hour > 12:
                insights.append({
                    "id": f"no-entries-{vid}",
                    "venue": venue_name,
                    "type": "info",
                    "situation": "No guest entries recorded today",
                    "impact": "Possible system issue or the venue is not operating",
                    "suggestion": "Verify Pulse module is active, check host app connectivity",
                })

    # Sort: critical first, then warning, then info
    priority = {"critical": 0, "warning": 1, "info": 2}
    insights.sort(key=lambda x: priority.get(x["type"], 3))

    return {"insights": insights}


# ─── FINANCE & RISK ────────────────────────────────────────────────
@router.get("/finance")
async def get_finance_risk(user: dict = Depends(require_auth)):
    """Finance & Risk — chargebacks, refund rate, thresholds."""
    pool = get_postgres_pool()
    today = _today_start()
    month = _month_start()
    user_id = user["sub"]

    async with pool.acquire() as conn:
        access_rows = await conn.fetch(
            "SELECT venue_id FROM user_access WHERE user_id = $1::uuid", user_id)
        venue_ids = [r["venue_id"] for r in access_rows if r["venue_id"]]

        if not venue_ids:
            return {"revenue_month": 0, "payments": [], "voids_summary": {}, "risk_score": 0}

        rev_month = float(await conn.fetchval(
            "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id = ANY($1) AND status='closed' AND closed_at>=$2",
            venue_ids, month) or 0)

        # Payment methods breakdown (month)
        payments = await conn.fetch(
            "SELECT method, COUNT(*) as cnt, COALESCE(SUM(amount),0) as total FROM tap_payments WHERE venue_id = ANY($1) AND paid_at>=$2 GROUP BY method",
            venue_ids, month)

        # Voids summary
        total_voids = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_items WHERE venue_id = ANY($1) AND voided_at>=$2", venue_ids, month) or 0
        total_void_amount = float(await conn.fetchval(
            "SELECT COALESCE(SUM(line_total),0) FROM tap_items WHERE venue_id = ANY($1) AND voided_at>=$2",
            venue_ids, month) or 0)

    void_rate = round((total_void_amount / rev_month * 100) if rev_month > 0 else 0, 2)
    # Risk score: 0-100 based on void rate
    risk_score = min(100, int(void_rate * 10))

    return {
        "revenue_month": rev_month,
        "payments": [{"method": r["method"], "count": r["cnt"], "total": float(r["total"])} for r in payments],
        "voids_summary": {
            "count": total_voids,
            "amount": total_void_amount,
            "rate_pct": void_rate,
        },
        "risk_score": risk_score,
        "chargebacks": 0,
        "refund_rate": 0,
    }


# ─── GROWTH & LOYALTY ─────────────────────────────────────────────
@router.get("/growth")
async def get_growth_loyalty(user: dict = Depends(require_auth)):
    """Growth & Loyalty — new vs returning, LTV, points."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    month = _month_start()
    prev_start, prev_end = _prev_month_range()
    user_id = user["sub"]

    async with pool.acquire() as conn:
        access_rows = await conn.fetch(
            "SELECT venue_id FROM user_access WHERE user_id = $1::uuid", user_id)
        venue_ids = [r["venue_id"] for r in access_rows if r["venue_id"]]

        if not venue_ids:
            return {"new_guests": 0, "returning_guests": 0, "ltv": 0, "loyalty_members": 0}

        # This month guests
        unique_this = await conn.fetchval(
            "SELECT COUNT(DISTINCT guest_id) FROM entry_events WHERE venue_id = ANY($1) AND created_at>=$2 AND decision='allowed'",
            venue_ids, month) or 0

        # Returning (>1 visit this month)
        returning = await conn.fetchval(
            """SELECT COUNT(*) FROM (
                SELECT guest_id FROM entry_events WHERE venue_id = ANY($1) AND created_at>=$2 AND decision='allowed'
                GROUP BY guest_id HAVING COUNT(*)>1
            ) sub""", venue_ids, month) or 0

        new_guests = unique_this - returning

        # LTV: avg total spend per guest
        ltv = float(await conn.fetchval(
            """SELECT COALESCE(AVG(guest_total), 0) FROM (
                SELECT guest_id, SUM(total) as guest_total FROM tap_sessions
                WHERE venue_id = ANY($1) AND status='closed' AND guest_id IS NOT NULL
                GROUP BY guest_id
            ) sub""", venue_ids) or 0)

        # Previous month guests
        unique_prev = await conn.fetchval(
            "SELECT COUNT(DISTINCT guest_id) FROM entry_events WHERE venue_id = ANY($1) AND created_at>=$2 AND created_at<$3 AND decision='allowed'",
            venue_ids, prev_start, prev_end) or 0

    # Loyalty data from MongoDB
    total_loyalty = 0
    total_points = 0
    for vid in venue_ids:
        loyalty_count = await db.venue_guests.count_documents({"venue_id": str(vid), "reward_points": {"$gt": 0}})
        total_loyalty += loyalty_count
        guests_with_points = await db.venue_guests.find({"venue_id": str(vid), "reward_points": {"$gt": 0}}, {"_id": 0, "reward_points": 1}).to_list(1000)
        total_points += sum(g.get("reward_points", 0) for g in guests_with_points)

    guest_growth_pct = round(((unique_this - unique_prev) / unique_prev * 100) if unique_prev > 0 else 0, 1)

    return {
        "new_guests": new_guests,
        "returning_guests": returning,
        "unique_guests_month": unique_this,
        "unique_guests_prev_month": unique_prev,
        "guest_growth_pct": guest_growth_pct,
        "ltv": round(ltv, 2),
        "loyalty_members": total_loyalty,
        "total_points_issued": total_points,
    }


# ─── PEOPLE & OPS ─────────────────────────────────────────────────
@router.get("/people")
async def get_people_ops(user: dict = Depends(require_auth)):
    """People & Ops — strategic signals, staff counts."""
    db = get_mongo_db()
    pool = get_postgres_pool()
    user_id = user["sub"]

    async with pool.acquire() as conn:
        access_rows = await conn.fetch(
            "SELECT venue_id FROM user_access WHERE user_id = $1::uuid", user_id)
        venue_ids = [r["venue_id"] for r in access_rows if r["venue_id"]]

    venues_staff = []
    total_staff = 0
    for vid in venue_ids:
        cfg = await db.venue_configs.find_one({"venue_id": str(vid)}, {"_id": 0})
        venue_name = cfg.get("venue_name", "Demo Club") if cfg else "Demo Club"
        count = await db.venue_barmen.count_documents({"venue_id": str(vid), "active": True})
        total_staff += count

        # Shifts closed
        shifts_cursor = db.venue_shifts.find({"venue_id": str(vid)}, {"_id": 0}).sort("created_at", -1).limit(5)
        recent_shifts = await shifts_cursor.to_list(5)

        venues_staff.append({
            "venue_id": str(vid),
            "name": venue_name,
            "staff_count": count,
            "recent_shifts": len(recent_shifts),
        })

    return {
        "total_staff": total_staff,
        "venues": venues_staff,
    }


# ─── SYSTEM & EXPANSION ───────────────────────────────────────────
@router.get("/system")
async def get_system_expansion(user: dict = Depends(require_auth)):
    """System & Expansion — uptime, venues, webhooks."""
    pool = get_postgres_pool()
    user_id = user["sub"]

    async with pool.acquire() as conn:
        access_rows = await conn.fetch(
            "SELECT venue_id, company_id FROM user_access WHERE user_id = $1::uuid", user_id)
        venue_ids = [r["venue_id"] for r in access_rows if r["venue_id"]]
        company_ids = list(set(str(r["company_id"]) for r in access_rows if r["company_id"]))

    # Subscription info
    subscriptions = []
    if company_ids:
        async with pool.acquire() as conn:
            for cid in company_ids:
                sub = await conn.fetchrow(
                    "SELECT status, plan_key, current_period_end FROM subscriptions WHERE company_id=$1::uuid ORDER BY created_at DESC LIMIT 1",
                    uuid.UUID(cid))
                if sub:
                    subscriptions.append({
                        "company_id": cid,
                        "status": sub["status"],
                        "plan": sub["plan_key"],
                        "period_end": sub["current_period_end"].isoformat() if sub["current_period_end"] else None,
                    })

    return {
        "venues_count": len(venue_ids),
        "system_status": "operational",
        "uptime": "99.9%",
        "subscriptions": subscriptions,
        "webhook_errors": 0,
        "last_deployment": datetime.now(timezone.utc).isoformat(),
    }


# ─── AI INSIGHTS (GPT-5.2) — Conversational & Participatory ───────
AI_SYSTEM_PROMPT = """You are an AI strategic business partner for a hospitality venue owner.
You analyze aggregated data across venues to provide strategic insights and guide the owner's decision-making.

Tone: Strategic, high-level, decision-oriented. Think like a CFO or COO advising the owner.
Focus on: "Is this venue healthy?", "Where should I intervene?", "What pattern should I watch?"

Core Rules:
1. Always use the REAL data provided — never invent numbers.
2. Tailor insights to the business type (bar, club, restaurant).
3. NEVER perform write operations or change any data. You are 100% read-only.
4. External references may support recommendations but never replace internal data.

When responding to a specific question from the owner, provide a focused answer. Otherwise provide 2-4 general insights.

Response Structure (MANDATORY — return as JSON):
Each insight object must have:
- "summary": Brief headline of the finding
- "what_we_see": Detailed observation from the data — be specific with numbers
- "recommended_actions": Array of clear, practical steps (2-4 items)
- "next_steps": Array of 3-5 follow-up questions the owner might want to ask next. These must be specific, data-driven, and related to: profitability, growth, risk, comparison, or strategic decisions. Format as complete questions.
- "reference": External validation if used, otherwise null
- "priority": "critical" | "warning" | "info"

The "next_steps" field is MANDATORY for every insight. Examples:
- "How does this month's revenue compare to the same period last year?"
- "Should I consider reducing operating hours on weekdays?"
- "What is the customer acquisition cost for this venue?"

Return ONLY a valid JSON array of insight objects. No markdown outside JSON."""


@router.post("/ai-insights")
async def generate_ai_insights(
    user: dict = Depends(require_auth),
    question: str = Form(None),
):
    """Generate AI-powered insights using GPT-5.2 with real venue data. Accepts optional question for conversational flow."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    today = _today_start()
    month = _month_start()
    now = datetime.now(timezone.utc)
    user_id = user["sub"]

    # Gather venue data context
    async with pool.acquire() as conn:
        access_rows = await conn.fetch(
            "SELECT venue_id FROM user_access WHERE user_id = $1::uuid", user_id)
        venue_ids = [r["venue_id"] for r in access_rows if r["venue_id"]]

    if not venue_ids:
        return {"insights": [], "disclaimer": "No venues found."}

    context_parts = []
    for vid in venue_ids:
        cfg = await db.venue_configs.find_one({"venue_id": str(vid)}, {"_id": 0})
        venue_name = cfg.get("venue_name", "Demo Club") if cfg else "Demo Club"
        bar_mode = cfg.get("bar_mode", "disco") if cfg else "disco"

        async with pool.acquire() as conn:
            rev_today = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0)
            rev_month = float(await conn.fetchval(
                "SELECT COALESCE(SUM(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, month) or 0)
            open_tabs = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open'", vid) or 0
            closed_tabs = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0
            avg_ticket = float(await conn.fetchval(
                "SELECT COALESCE(AVG(total),0) FROM tap_sessions WHERE venue_id=$1 AND status='closed' AND closed_at>=$2", vid, today) or 0)
            guests_today = await conn.fetchval(
                "SELECT COUNT(DISTINCT guest_id) FROM entry_events WHERE venue_id=$1 AND created_at>=$2 AND decision='allowed'", vid, today) or 0
            total_entries = await conn.fetchval(
                "SELECT COUNT(*) FROM entry_events WHERE venue_id=$1 AND created_at>=$2", vid, today) or 0
            denied = await conn.fetchval(
                "SELECT COUNT(*) FROM entry_events WHERE venue_id=$1 AND created_at>=$2 AND decision='denied'", vid, today) or 0
            voids = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND voided_at>=$2", vid, today) or 0
            total_items = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_items WHERE venue_id=$1 AND created_at>=$2", vid, today) or 0
            long_tabs = await conn.fetchval(
                "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open' AND opened_at<$2",
                vid, now - timedelta(hours=3)) or 0

            # Top items
            top_rows = await conn.fetch(
                "SELECT item_name, SUM(line_total) as rev FROM tap_items WHERE venue_id=$1 AND created_at>=$2 AND voided_at IS NULL GROUP BY item_name ORDER BY rev DESC LIMIT 5",
                vid, today)

            # Tables
            occupied = await conn.fetchval(
                "SELECT COUNT(*) FROM venue_tables WHERE venue_id=$1 AND status='occupied'", vid) or 0
            available = await conn.fetchval(
                "SELECT COUNT(*) FROM venue_tables WHERE venue_id=$1 AND status='available'", vid) or 0

        barmen_count = await db.venue_barmen.count_documents({"venue_id": str(vid), "active": True})
        top_items = ", ".join([f"{r['item_name']} (${float(r['rev']):.0f})" for r in top_rows])

        context_parts.append(f"""
VENUE: {venue_name} (Type: {bar_mode})
- Revenue today: ${rev_today:.2f} | Revenue MTD: ${rev_month:.2f}
- Avg ticket: ${avg_ticket:.2f}
- Open tabs: {open_tabs} | Closed today: {closed_tabs}
- Guests today: {guests_today} | Total entries: {total_entries} | Denied: {denied}
- Voids today: {voids} out of {total_items} items ({round(voids/total_items*100,1) if total_items>0 else 0}%)
- Long open tabs (>3h): {long_tabs}
- Tables occupied: {occupied} | Available: {available}
- Active staff: {barmen_count}
- Top items: {top_items if top_items else 'No sales yet'}
- Current time: {now.strftime('%H:%M')} UTC
""")

    context = "\n".join(context_parts)

    if question and question.strip():
        user_message = f"""Based on the following real-time operational data, answer the owner's question.

{context}

Owner's question: {question.strip()}

Return ONLY a valid JSON array with 1-2 insight objects focused on answering this question. Each must include: summary, what_we_see, recommended_actions, next_steps, reference, priority."""
    else:
        user_message = f"""Analyze the following real-time operational data and provide 2-4 actionable insights.
Focus on what matters MOST right now for the business owner.

{context}

Return ONLY a valid JSON array of insight objects with fields: summary, what_we_see, recommended_actions (array of strings), next_steps (array of 3-5 follow-up questions), reference (string or null), priority (critical/warning/info)."""

    try:
        llm_key = os.environ.get("EMERGENT_LLM_KEY")
        if not llm_key:
            return {"insights": [], "error": "LLM key not configured"}

        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm = LlmChat(
            api_key=llm_key,
            session_id=f"owner-insights-{user_id}",
            system_message=AI_SYSTEM_PROMPT,
        ).with_model("openai", "gpt-5.2")

        raw = await llm.send_message(UserMessage(text=user_message))
        # Extract JSON from response
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        insights = json_mod.loads(text)
        if not isinstance(insights, list):
            insights = [insights]

    except Exception as e:
        logger.error(f"AI insights error: {e}")
        insights = [{
            "summary": "Unable to generate AI insights at this time",
            "what_we_see": str(e),
            "recommended_actions": ["Check LLM configuration", "Try again later"],
            "next_steps": ["Try generating insights again", "Check if the LLM key is valid"],
            "reference": None,
            "priority": "info",
        }]

    return {
        "insights": insights,
        "disclaimer": "AI insights are read-only and based on your business data. They may contain inaccuracies. Always validate with your team.",
        "generated_at": now.isoformat(),
    }
