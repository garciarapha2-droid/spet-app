"""CEO Analytics API — Security, Reports, Revenue Targets.
All data comes from PostgreSQL tables: deals, customers, deal_activities."""
from fastapi import APIRouter, Depends
from middleware.auth_middleware import require_auth
from database import get_postgres_pool
from datetime import datetime, timezone, timedelta
import uuid
import logging
import math

logger = logging.getLogger(__name__)
router = APIRouter()

PLAN_MODULES = {
    "core": ["pulse"],
    "flow": ["pulse", "tap", "table"],
    "sync": ["pulse", "tap", "table", "kds", "bar", "finance"],
    "os": ["pulse", "tap", "table", "kds", "bar", "finance", "analytics", "ai"],
}

PLAN_PRICES = {"core": 149, "flow": 299, "sync": 499, "os": 724}

ALL_MODULE_KEYS = ["pulse", "tap", "table", "kds", "bar", "finance", "analytics", "ai"]

STAGE_ORDER = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]
STAGE_META = {
    "lead": {"label": "Lead", "color": "#3B82F6"},
    "qualified": {"label": "Qualified", "color": "#F59F00"},
    "proposal": {"label": "Proposal", "color": "#EC4899"},
    "negotiation": {"label": "Negotiation", "color": "#E03131"},
    "closed_won": {"label": "Closed Won", "color": "#1FAA6B"},
    "closed_lost": {"label": "Closed Lost", "color": "#6B7280"},
}

# Loss reason keyword mapping
LOSS_KEYWORDS = {
    "Price too high": ["preco", "preço", "caro", "price", "expensive", "alto"],
    "Chose competitor": ["concorrente", "competitor", "perdido para"],
    "No budget": ["orcamento", "orçamento", "budget", "sem orcamento"],
    "Bad timing": ["timing", "volta", "depois", "later"],
    "Other": [],
}


def _classify_loss_reason(notes: str) -> str:
    if not notes:
        return "Other"
    lower = notes.lower()
    for reason, keywords in LOSS_KEYWORDS.items():
        if reason == "Other":
            continue
        for kw in keywords:
            if kw in lower:
                return reason
    return "Other"


def _row_dict(row):
    d = dict(row)
    for k, v in d.items():
        if isinstance(v, uuid.UUID):
            d[k] = str(v)
        elif isinstance(v, datetime):
            d[k] = v.isoformat()
        elif hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
    return d


# ─── SECURITY ANALYTICS ────────────────────────────────────

@router.get("/analytics/security")
async def security_analytics(user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        customers = [_row_dict(r) for r in await conn.fetch(
            "SELECT * FROM customers ORDER BY created_at DESC"
        )]
        # Get last activity date per customer's deal
        activity_map = {}
        if customers:
            deal_ids = [c["deal_id"] for c in customers if c.get("deal_id")]
            if deal_ids:
                rows = await conn.fetch(
                    """SELECT deal_id, MAX(created_at) as last_activity
                       FROM deal_activities
                       WHERE deal_id = ANY($1::uuid[])
                       GROUP BY deal_id""",
                    deal_ids
                )
                for r in rows:
                    activity_map[str(r["deal_id"])] = r["last_activity"]

    alerts = []
    now = datetime.now(timezone.utc)

    for c in customers:
        cid = c["id"]
        modules = c.get("modules_enabled") or []
        plan_id = c.get("plan_id", "core")
        plan_max = len(PLAN_MODULES.get(plan_id, ["pulse"]))
        status = c.get("status", "active")

        # 1. Non-active status → critical
        if status in ("churned", "paused"):
            severity = "critical" if status == "churned" else "warning"
            alerts.append({
                "id": f"{cid}-status",
                "type": "status_risk",
                "severity": severity,
                "title": "Churned Account" if status == "churned" else "Paused Account",
                "description": f'"{c["company_name"]}" — status: {status}',
                "context": f'MRR at risk: ${c.get("mrr", 0)}',
                "customer": {
                    "id": cid,
                    "company_name": c["company_name"],
                    "contact_name": c.get("contact_name", ""),
                    "status": status,
                },
            })

        # 2. Low module usage (< 50% of max)
        if len(modules) < max(plan_max / 2, 2):
            alerts.append({
                "id": f"{cid}-low-usage",
                "type": "low_usage",
                "severity": "warning",
                "title": "Low Module Usage",
                "description": f'"{c["company_name"]}" — only {len(modules)}/{plan_max} modules active',
                "context": f'Plan: {plan_id.upper()} • MRR: ${c.get("mrr", 0)}',
                "customer": {
                    "id": cid,
                    "company_name": c["company_name"],
                    "contact_name": c.get("contact_name", ""),
                    "status": status,
                },
            })

        # 3. Underutilized plan (paying for more modules than using)
        if len(modules) < plan_max and len(modules) >= max(plan_max / 2, 2):
            unused = [m for m in PLAN_MODULES.get(plan_id, []) if m not in modules]
            if unused:
                alerts.append({
                    "id": f"{cid}-underutil",
                    "type": "underutilized",
                    "severity": "info",
                    "title": "Underutilized Plan",
                    "description": f'"{c["company_name"]}" — using {len(modules)}/{plan_max} modules',
                    "context": f'Unused: {", ".join(unused)}',
                    "customer": {
                        "id": cid,
                        "company_name": c["company_name"],
                        "contact_name": c.get("contact_name", ""),
                        "status": status,
                    },
                })

        # 4. No recent activity (if has deal, check deal_activities)
        deal_id = c.get("deal_id")
        if deal_id:
            last_act = activity_map.get(str(deal_id))
            if last_act and (now - last_act).days > 30:
                alerts.append({
                    "id": f"{cid}-inactive",
                    "type": "low_engagement",
                    "severity": "info",
                    "title": "Low Engagement",
                    "description": f'"{c["company_name"]}" — no activity in {(now - last_act).days} days',
                    "context": f'Last activity: {last_act.strftime("%Y-%m-%d")}',
                    "customer": {
                        "id": cid,
                        "company_name": c["company_name"],
                        "contact_name": c.get("contact_name", ""),
                        "status": status,
                    },
                })

    # Compute risk score
    weights = {"critical": 10, "warning": 3, "info": 1}
    raw_score = sum(weights.get(a["severity"], 0) for a in alerts)
    max_possible = len(alerts) * 10 if alerts else 1
    risk_score = min(round((raw_score / max_possible) * 100), 100)

    # Compute module usage
    total_customers = len(customers) or 1
    module_usage = []
    for mk in ALL_MODULE_KEYS:
        count = sum(1 for c in customers if mk in (c.get("modules_enabled") or []))
        module_usage.append({
            "module": mk.capitalize() if mk not in ("kds", "ai") else mk.upper(),
            "percentage": round((count / total_customers) * 100),
        })

    # Summary
    critical = sum(1 for a in alerts if a["severity"] == "critical")
    warning = sum(1 for a in alerts if a["severity"] == "warning")
    info = sum(1 for a in alerts if a["severity"] == "info")
    venues_at_risk = len(set(a["customer"]["id"] for a in alerts))

    return {
        "alerts": alerts,
        "risk_score": risk_score,
        "module_usage": module_usage,
        "summary": {
            "total_alerts": len(alerts),
            "critical": critical,
            "warning": warning,
            "info": info,
            "venues_at_risk": venues_at_risk,
        },
    }


# ─── REPORTS ANALYTICS ─────────────────────────────────────

@router.get("/analytics/reports")
async def reports_analytics(user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        deals = [_row_dict(r) for r in await conn.fetch(
            "SELECT * FROM deals ORDER BY created_at DESC"
        )]
        customers = [_row_dict(r) for r in await conn.fetch(
            "SELECT mrr, status, plan_id, signup_date FROM customers WHERE status='active'"
        )]

    # Funnel: deals by stage
    funnel = []
    for stage_key in STAGE_ORDER:
        meta = STAGE_META.get(stage_key, {})
        stage_deals = [d for d in deals if d["stage"] == stage_key]
        funnel.append({
            "key": stage_key,
            "stage": meta.get("label", stage_key),
            "color": meta.get("color", "#6B7280"),
            "count": len(stage_deals),
            "value": sum(float(d.get("deal_value", 0)) for d in stage_deals),
        })

    # Loss reasons
    lost_deals = [d for d in deals if d["stage"] == "closed_lost"]
    reason_counts = {}
    for d in lost_deals:
        reason = _classify_loss_reason(d.get("notes", ""))
        reason_counts[reason] = reason_counts.get(reason, 0) + 1

    total_lost = len(lost_deals) or 1
    loss_reasons = sorted(
        [{"reason": r, "count": c, "percentage": round((c / total_lost) * 100)}
         for r, c in reason_counts.items()],
        key=lambda x: x["percentage"],
        reverse=True,
    )

    # Pipeline history (monthly value from deals by created_at month)
    monthly_values = {}
    for d in deals:
        created = d.get("created_at", "")
        if not created:
            continue
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00")) if isinstance(created, str) else created
            key = dt.strftime("%b")
            monthly_values[key] = monthly_values.get(key, 0) + float(d.get("deal_value", 0))
        except Exception:
            pass

    # Build last 6 months
    now = datetime.now(timezone.utc)
    pipeline_history = []
    for i in range(5, -1, -1):
        dt = now - timedelta(days=i * 30)
        month_key = dt.strftime("%b")
        pipeline_history.append({
            "month": month_key,
            "value": monthly_values.get(month_key, 0),
        })
    # Deduplicate (keep last occurrence of each month)
    seen = {}
    for item in pipeline_history:
        seen[item["month"]] = item
    pipeline_history = list(seen.values())

    # Metrics
    active_deals = [d for d in deals if d["stage"] not in ("closed_won", "closed_lost")]
    won_deals = [d for d in deals if d["stage"] == "closed_won"]
    total_for_conv = len([d for d in deals if d["stage"] != "closed_lost"])
    conv_rate = round((len(won_deals) / total_for_conv * 100), 1) if total_for_conv > 0 else 0
    total_pipeline = sum(float(d.get("deal_value", 0)) for d in active_deals)

    # Revenue from active customers
    total_mrr = sum(float(c.get("mrr", 0)) for c in customers)

    return {
        "funnel": funnel,
        "loss_reasons": loss_reasons,
        "pipeline_history": pipeline_history,
        "metrics": {
            "active_deals": len(active_deals),
            "won_deals": len(won_deals),
            "lost_deals": len(lost_deals),
            "conversion_rate": conv_rate,
            "total_pipeline_value": total_pipeline,
            "total_mrr": total_mrr,
        },
    }


# ─── REVENUE TARGETS ───────────────────────────────────────

@router.get("/analytics/revenue-targets")
async def revenue_targets(user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT COALESCE(SUM(mrr), 0) as total_mrr FROM customers WHERE status='active'"
        )
        total_mrr = float(row["total_mrr"])

        won_row = await conn.fetchrow(
            "SELECT COALESCE(SUM(deal_value), 0) as won_value FROM deals WHERE stage='closed_won'"
        )
        won_value = float(won_row["won_value"])

    # Compute targets based on real data
    monthly_target = max(math.ceil(total_mrr * 1.2 / 100) * 100, 5000)
    weekly_target = round(monthly_target / 4)
    annual_target = monthly_target * 12

    return {
        "weekly": {"current": round(total_mrr / 4, 2), "target": weekly_target},
        "monthly": {"current": round(total_mrr, 2), "target": monthly_target},
        "annual": {"current": round(total_mrr * 12 + won_value, 2), "target": annual_target},
    }
