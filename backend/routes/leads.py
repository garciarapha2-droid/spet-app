from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from database import get_postgres_pool
from datetime import datetime, timezone
import asyncio
import logging
import os
import resend

router = APIRouter()
logger = logging.getLogger("leads")

resend.api_key = os.environ.get("RESEND_API_KEY", "")

SOURCE_FROM_MAP = {
    "signup": os.environ.get("RESEND_FROM_LEADS", "leads@spetapp.com"),
    "contact": os.environ.get("RESEND_FROM_CONTACT", "contact@spetapp.com"),
    "support": os.environ.get("RESEND_FROM_SUPPORT", "support@spetapp.com"),
}

NOTIFICATION_TO = os.environ.get("LEAD_NOTIFICATION_TO", "r.collasos@spetapp.com")

RESEND_FALLBACK_FROM = "SPET Leads <onboarding@resend.dev>"

VALID_SOURCES = {"signup", "contact", "support"}


def _get_from_address(source: str) -> str:
    """Get formatted 'from' address for a lead source."""
    addr = SOURCE_FROM_MAP.get(source, SOURCE_FROM_MAP["contact"])
    return f"SPET ({source.capitalize()}) <{addr}>"


class LeadCaptureRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str = ""
    product_interest: str = ""
    source: str


def _build_email_html(lead: dict) -> str:
    return f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px">
  <h2 style="margin:0 0 16px;color:#111827">New Lead — {lead['source'].upper()}</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#6b7280;width:120px">Name</td><td style="padding:8px 0;color:#111827;font-weight:600">{lead['full_name']}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0;color:#111827">{lead['email']}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Phone</td><td style="padding:8px 0;color:#111827">{lead['phone'] or '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Interest</td><td style="padding:8px 0;color:#111827">{lead['product_interest'] or '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Source</td><td style="padding:8px 0;color:#111827">{lead['source']}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Time</td><td style="padding:8px 0;color:#111827">{lead['timestamp']}</td></tr>
  </table>
</div>"""


async def _send_lead_email(lead: dict) -> str | None:
    """Send lead notification email via Resend. Returns email_id or None."""
    if not resend.api_key:
        logger.warning("[LEADS] RESEND_API_KEY not set — skipping email")
        return None

    from_addr = _get_from_address(lead["source"])
    subject = f"[NEW LEAD] - {lead['source']} - {lead['product_interest'] or 'N/A'}"

    params = {
        "from": from_addr,
        "to": [NOTIFICATION_TO],
        "subject": subject,
        "html": _build_email_html(lead),
    }

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        email_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        logger.info(f"[LEADS] Email sent: {email_id} (source={lead['source']}, from={from_addr})")
        return email_id
    except Exception as e:
        # If custom domain fails, retry with Resend's test sender
        if "not verified" in str(e).lower():
            logger.warning(f"[LEADS] Domain not verified, retrying with fallback sender")
            params["from"] = RESEND_FALLBACK_FROM
            try:
                result = await asyncio.to_thread(resend.Emails.send, params)
                email_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
                logger.info(f"[LEADS] Email sent via fallback: {email_id}")
                return email_id
            except Exception as e2:
                logger.error(f"[LEADS] Fallback email also failed: {e2}")
                return None
        logger.error(f"[LEADS] Email failed: {e}")
        return None


async def _store_lead(lead: dict, email_sent: bool, email_id: str | None) -> str:
    """Store lead in PostgreSQL. Returns lead UUID."""
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO leads (full_name, email, phone, product_interest, source, email_sent, email_id, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id""",
            lead["full_name"],
            lead["email"],
            lead["phone"],
            lead["product_interest"],
            lead["source"],
            email_sent,
            email_id,
            datetime.now(timezone.utc),
        )
    return str(row["id"])


async def capture_lead_internal(full_name: str, email: str, phone: str = "",
                                product_interest: str = "", source: str = "signup") -> dict:
    """Reusable function for internal callers (e.g., signup flow)."""
    now = datetime.now(timezone.utc)
    lead = {
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "product_interest": product_interest,
        "source": source,
        "timestamp": now.isoformat(),
    }

    email_id = await _send_lead_email(lead)
    lead_id = await _store_lead(lead, email_sent=email_id is not None, email_id=email_id)

    return {
        "lead_id": lead_id,
        "source": source,
        "email_sent": email_id is not None,
        "timestamp": now.isoformat(),
    }


@router.post("/capture")
async def capture_lead(request: LeadCaptureRequest):
    """Unified lead capture endpoint. Stores lead + sends email notification."""
    if request.source not in VALID_SOURCES:
        raise HTTPException(status_code=400, detail=f"Invalid source. Must be one of: {', '.join(VALID_SOURCES)}")

    result = await capture_lead_internal(
        full_name=request.full_name,
        email=request.email,
        phone=request.phone,
        product_interest=request.product_interest,
        source=request.source,
    )

    return result
