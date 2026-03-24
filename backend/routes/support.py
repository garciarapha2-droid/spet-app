from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
import asyncio
import logging
import os
import resend

router = APIRouter()
logger = logging.getLogger("support")

resend.api_key = os.environ.get("RESEND_API_KEY", "")
SUPPORT_FROM = os.environ.get("RESEND_FROM_SUPPORT", "support@spetapp.com")
SUPPORT_TO = "support@spetapp.com"


class SupportRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str = ""
    message: str


def _build_support_html(data: dict) -> str:
    subject_display = data.get("subject") or "No subject"
    return f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px">
  <h2 style="margin:0 0 16px;color:#111827">New Support Request</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#6b7280;width:120px">Name</td><td style="padding:8px 0;color:#111827;font-weight:600">{data['name']}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0;color:#111827"><a href="mailto:{data['email']}">{data['email']}</a></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Subject</td><td style="padding:8px 0;color:#111827">{subject_display}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Time</td><td style="padding:8px 0;color:#111827">{data['timestamp']}</td></tr>
  </table>
  <div style="margin-top:20px;padding:16px;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px">
    <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600">Message</p>
    <p style="margin:0;color:#111827;white-space:pre-wrap;line-height:1.6">{data['message']}</p>
  </div>
</div>"""


@router.post("")
async def send_support_message(request: SupportRequest):
    if not request.name.strip():
        raise HTTPException(status_code=422, detail="Name is required")
    if not request.message.strip() or len(request.message.strip()) < 10:
        raise HTTPException(status_code=422, detail="Message must be at least 10 characters")

    now = datetime.now(timezone.utc)
    subject_line = f"New Support Request - {request.subject.strip() or 'No subject'}"

    data = {
        "name": request.name.strip(),
        "email": request.email,
        "subject": request.subject.strip(),
        "message": request.message.strip(),
        "timestamp": now.isoformat(),
    }

    if not resend.api_key:
        logger.warning("[SUPPORT] RESEND_API_KEY not set — skipping email")
        raise HTTPException(status_code=503, detail="Email service unavailable")

    params = {
        "from": f"SPET Support <{SUPPORT_FROM}>",
        "to": [SUPPORT_TO],
        "reply_to": request.email,
        "subject": subject_line,
        "html": _build_support_html(data),
    }

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        email_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        logger.info(f"[SUPPORT] Email sent: {email_id}")
        return {"message": "Message sent successfully", "email_id": email_id}
    except Exception as e:
        logger.error(f"[SUPPORT] Email failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again.")
