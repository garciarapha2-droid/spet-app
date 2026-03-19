"""Account activation email — sent after successful signup + payment."""
import asyncio
import logging
import os
import resend

logger = logging.getLogger("activation_email")

resend.api_key = os.environ.get("RESEND_API_KEY", "")
FROM_ACCESS = os.environ.get("RESEND_FROM_ACCESS", "access@spetapp.com")


def _build_activation_html(user_name: str, email: str, company_name: str, plan: str, dashboard_url: str) -> str:
    return f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#ffffff">
  <div style="background:#111827;padding:32px 24px;text-align:center;border-radius:8px 8px 0 0">
    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px">SPET</h1>
    <p style="margin:8px 0 0;color:#9ca3af;font-size:14px">Your account is ready</p>
  </div>
  <div style="padding:32px 24px;background:#ffffff">
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Welcome, {user_name}!</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6">
      Your account has been activated successfully. You can now access all features included in your <strong>{plan}</strong> plan.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#f9fafb;border-radius:8px">
      <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb">Email</td><td style="padding:12px 16px;color:#111827;font-size:13px;font-weight:600;border-bottom:1px solid #e5e7eb">{email}</td></tr>
      <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb">Company</td><td style="padding:12px 16px;color:#111827;font-size:13px;font-weight:600;border-bottom:1px solid #e5e7eb">{company_name}</td></tr>
      <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px">Plan</td><td style="padding:12px 16px;color:#111827;font-size:13px;font-weight:600">{plan}</td></tr>
    </table>
    <p style="margin:0 0 8px;color:#4b5563;font-size:13px">
      Use the email and password you created during signup to log in. No need to create a new password.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="{dashboard_url}" style="display:inline-block;background:#111827;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600">Access Dashboard</a>
    </div>
  </div>
  <div style="padding:16px 24px;background:#f9fafb;text-align:center;border-radius:0 0 8px 8px">
    <p style="margin:0;color:#9ca3af;font-size:12px">SPET — Operations Platform for Hospitality</p>
  </div>
</div>"""


async def send_activation_email(
    user_name: str,
    email: str,
    company_name: str,
    plan: str,
    dashboard_url: str = "https://app.spetapp.com/venue/home",
) -> str | None:
    """Send account activation email via Resend. Returns email_id or None."""
    if not resend.api_key:
        logger.warning("[ACTIVATION] RESEND_API_KEY not set — skipping email")
        return None

    params = {
        "from": f"SPET Access <{FROM_ACCESS}>",
        "to": [email],
        "subject": f"Your SPET account is ready — {company_name}",
        "html": _build_activation_html(user_name, email, company_name, plan, dashboard_url),
    }

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        email_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        logger.info(f"[ACTIVATION] Email sent to {email}: {email_id}")
        return email_id
    except Exception as e:
        logger.error(f"[ACTIVATION] Email failed for {email}: {e}")
        return None
