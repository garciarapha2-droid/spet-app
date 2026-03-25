"""Unified transactional email service for SPET platform.

All emails use consistent SPET branding with icon + wordmark.
Templates: welcome, payment_confirmed, access_granted, payment_failed,
           team_invite, password_reset_user, password_reset_manager.
"""
import asyncio
import logging
import os
import resend

logger = logging.getLogger("email_service")

resend.api_key = os.environ.get("RESEND_API_KEY", "")

# Sender addresses
FROM_ACCESS = os.environ.get("RESEND_FROM_ACCESS", "access@spetapp.com")
FROM_SUPPORT = os.environ.get("RESEND_FROM_SUPPORT", "support@spetapp.com")

# Brand assets
ICON_URL = "https://customer-assets.emergentagent.com/job_9c50b924-f38e-44d3-b527-320707be445b/artifacts/s1lnay5m_spet-icon.png"
WORDMARK_URL = "https://customer-assets.emergentagent.com/job_9c50b924-f38e-44d3-b527-320707be445b/artifacts/i4wthejm_spet-wordmark-hd.png"
DASHBOARD_URL = "https://app.spetapp.com"


def _header(subtitle: str = "") -> str:
    sub_html = f'<p style="margin:8px 0 0;color:#9ca3af;font-size:13px">{subtitle}</p>' if subtitle else ""
    return f"""<div style="background:#111827;padding:28px 24px 20px;text-align:center;border-radius:12px 12px 0 0">
  <img src="{ICON_URL}" alt="SPET" style="width:52px;height:52px;border-radius:12px;display:inline-block" />
  <div style="margin-top:10px">
    <img src="{WORDMARK_URL}" alt="spet." style="height:22px;width:auto;filter:brightness(0) invert(1)" />
  </div>
  {sub_html}
</div>"""


def _footer() -> str:
    return """<div style="padding:20px 24px;background:#f9fafb;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb">
  <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.5">
    SPET &mdash; Operations Platform for Hospitality<br/>
    <a href="https://spetapp.com" style="color:#6b7280;text-decoration:none">spetapp.com</a>
  </p>
</div>"""


def _button(text: str, url: str) -> str:
    return f"""<div style="text-align:center;margin:28px 0 8px">
  <a href="{url}" style="display:inline-block;background:#111827;color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:-0.2px">{text}</a>
</div>"""


def _info_row(label: str, value: str, last: bool = False) -> str:
    border = "" if last else "border-bottom:1px solid #e5e7eb;"
    return f'<tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;{border}">{label}</td><td style="padding:12px 16px;color:#111827;font-size:13px;font-weight:600;{border}">{value}</td></tr>'


def _wrap(header_subtitle: str, body: str) -> str:
    return f"""<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;padding:0;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
  {_header(header_subtitle)}
  <div style="padding:32px 28px">{body}</div>
  {_footer()}
</div>"""


# ─── TEMPLATE BUILDERS ──────────────────────────────────────────────


def build_welcome_email(user_name: str, email: str, plan: str) -> str:
    body = f"""<h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700">Welcome, {user_name}!</h2>
<p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7">
  Your SPET account has been created. Complete your payment to unlock all features of your <strong>{plan}</strong> plan.
</p>
<table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
  {_info_row("Email", email)}
  {_info_row("Plan", plan, last=True)}
</table>
<p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.6">
  Once your payment is confirmed, you'll receive an access email with your dashboard link.
</p>"""
    return _wrap("Welcome to SPET", body)


def build_payment_confirmed_email(user_name: str, email: str, plan: str, amount: str, currency: str) -> str:
    body = f"""<h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700">Payment Confirmed</h2>
<p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7">
  Hi {user_name}, your payment has been successfully processed.
</p>
<table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
  {_info_row("Email", email)}
  {_info_row("Plan", plan)}
  {_info_row("Amount", f"{amount} {currency.upper()}")}
  {_info_row("Status", '<span style="color:#059669;font-weight:700">Paid</span>', last=True)}
</table>
<p style="margin:20px 0 0;color:#6b7280;font-size:13px">
  A receipt has been sent separately by Stripe.
</p>"""
    return _wrap("Payment Received", body)


def build_access_granted_email(user_name: str, email: str, company_name: str, plan: str, dashboard_url: str = None) -> str:
    url = dashboard_url or DASHBOARD_URL
    body = f"""<h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700">Your account is ready</h2>
<p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7">
  Hi {user_name}, your <strong>{plan}</strong> plan is now active. You have full access to your dashboard and all included modules.
</p>
<table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
  {_info_row("Email", email)}
  {_info_row("Company", company_name)}
  {_info_row("Plan", plan)}
  {_info_row("Status", '<span style="color:#059669;font-weight:700">Active</span>', last=True)}
</table>
<p style="margin:20px 0 8px;color:#4b5563;font-size:13px">
  Use the email and password you created during signup to log in.
</p>
{_button("Access Dashboard", url)}"""
    return _wrap("Access Granted", body)


def build_payment_failed_email(user_name: str, email: str, plan: str, retry_url: str = None) -> str:
    url = retry_url or f"{DASHBOARD_URL}/payment/pending"
    body = f"""<h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700">Payment Failed</h2>
<p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7">
  Hi {user_name}, we were unable to process your payment for the <strong>{plan}</strong> plan. This can happen for several reasons including insufficient funds or an expired card.
</p>
<table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
  {_info_row("Email", email)}
  {_info_row("Plan", plan)}
  {_info_row("Status", '<span style="color:#dc2626;font-weight:700">Failed</span>', last=True)}
</table>
<p style="margin:20px 0 8px;color:#4b5563;font-size:13px">
  Please try again with a different payment method.
</p>
{_button("Retry Payment", url)}"""
    return _wrap("Payment Issue", body)


def build_team_invite_email(
    inviter_name: str, company_name: str, role: str, email: str, invite_url: str
) -> str:
    body = f"""<h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700">You're invited!</h2>
<p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7">
  <strong>{inviter_name}</strong> has invited you to join <strong>{company_name}</strong> on SPET as <strong>{role}</strong>.
</p>
<table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
  {_info_row("Invited by", inviter_name)}
  {_info_row("Company", company_name)}
  {_info_row("Your Role", role)}
  {_info_row("Email", email, last=True)}
</table>
<p style="margin:20px 0 8px;color:#4b5563;font-size:13px">
  Click below to accept and set up your account. This invite expires in 7 days.
</p>
{_button("Accept Invite", invite_url)}"""
    return _wrap("Team Invite", body)


def build_password_reset_email(user_name: str, reset_url: str) -> str:
    body = f"""<h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700">Reset your password</h2>
<p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7">
  Hi {user_name}, we received a request to reset your password. Click below to choose a new one.
</p>
{_button("Reset Password", reset_url)}
<p style="margin:20px 0 0;color:#9ca3af;font-size:12px;line-height:1.6">
  This link expires in 30 minutes. If you didn't request this, you can safely ignore this email &mdash; your password will remain unchanged.
</p>"""
    return _wrap("Password Reset", body)


def build_manager_reset_email(user_name: str, manager_name: str, reset_url: str) -> str:
    body = f"""<h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700">Password reset required</h2>
<p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7">
  Hi {user_name}, your manager <strong>{manager_name}</strong> has initiated a password reset for your account. Your previous password has been invalidated.
</p>
<p style="margin:0 0 8px;color:#4b5563;font-size:14px;line-height:1.7">
  Click below to set a new password and regain access.
</p>
{_button("Set New Password", reset_url)}
<p style="margin:20px 0 0;color:#9ca3af;font-size:12px;line-height:1.6">
  This link expires in 30 minutes. If you believe this was done in error, contact your manager or support.
</p>"""
    return _wrap("Manager Password Reset", body)


# ─── SEND FUNCTIONS ─────────────────────────────────────────────────


async def _send(to: str, subject: str, html: str, from_addr: str = None) -> str | None:
    if not resend.api_key:
        logger.warning("[EMAIL] RESEND_API_KEY not set — skipping email")
        return None
    sender = from_addr or FROM_ACCESS
    params = {
        "from": f"SPET <{sender}>",
        "to": [to],
        "subject": subject,
        "html": html,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        email_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        logger.info(f"[EMAIL] Sent '{subject}' to {to}: {email_id}")
        return email_id
    except Exception as e:
        logger.error(f"[EMAIL] Failed '{subject}' to {to}: {e}")
        return None


async def send_welcome(user_name: str, email: str, plan: str) -> str | None:
    html = build_welcome_email(user_name, email, plan)
    return await _send(email, f"Welcome to SPET, {user_name}!", html)


async def send_payment_confirmed(user_name: str, email: str, plan: str, amount: str, currency: str) -> str | None:
    html = build_payment_confirmed_email(user_name, email, plan, amount, currency)
    return await _send(email, "Payment Confirmed — SPET", html)


async def send_access_granted(user_name: str, email: str, company_name: str, plan: str, dashboard_url: str = None) -> str | None:
    html = build_access_granted_email(user_name, email, company_name, plan, dashboard_url)
    return await _send(email, f"Your SPET account is ready — {company_name}", html)


async def send_payment_failed(user_name: str, email: str, plan: str, retry_url: str = None) -> str | None:
    html = build_payment_failed_email(user_name, email, plan, retry_url)
    return await _send(email, "Payment Issue — SPET", html)


async def send_team_invite(inviter_name: str, company_name: str, role: str, email: str, invite_url: str) -> str | None:
    html = build_team_invite_email(inviter_name, company_name, role, email, invite_url)
    return await _send(email, f"You're invited to join {company_name} on SPET", html)


async def send_password_reset(user_name: str, email: str, reset_url: str) -> str | None:
    html = build_password_reset_email(user_name, reset_url)
    return await _send(email, "Reset your SPET password", html)


async def send_manager_reset(user_name: str, email: str, manager_name: str, reset_url: str) -> str | None:
    html = build_manager_reset_email(user_name, manager_name, reset_url)
    return await _send(email, "Password reset required — SPET", html)
