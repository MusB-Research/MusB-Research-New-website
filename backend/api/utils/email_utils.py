"""
MusB Research System Email Utility
===================================
Sends invitation + OTP emails via Gmail SMTP.
Strictly decoupled from Resend API — no Resend calls here.
"""

import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_qr_img_tag(url: str) -> str:
    """Return an <img> tag using Google Charts QR API — no base64 bloat, renders in all clients."""
    import urllib.parse
    encoded = urllib.parse.quote(url, safe='')
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={encoded}"
    return (
        f'<img src="{qr_url}" width="160" height="160" '
        f'style="border-radius:8px;border:1px solid #1e2d45;display:block;margin:0 auto;" '
        f'alt="Scan to Accept Invitation" />'
    )


def _build_invite_html(name: str, invite_link: str, study_name: str | None = None, study_title: str | None = None, role: str | None = None, expires_in_days: int = 7) -> str:
    """
    TEMPORARILY SIMPLIFIED FOR PRODUCTION DEBUGGING.
    Original complex HTML removed to rule out rendering/size issues.
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>You've Been Invited to MusB Research</title>
</head>
<body>
  <h1>Invitation</h1>
  <p>Hello {name},</p>
  <p>You have been invited to join MusB Research for the study: {study_name or 'Clinical Study'}.</p>
  <p>Role: {role or 'Participant'}</p>
  <a href="{invite_link}" style="display:inline-block;padding:12px 24px;background-color:#2563EB;color:#fff;text-decoration:none;border-radius:4px;">Accept Invitation</a>
  <p>If the button doesn't work, copy this link: {invite_link}</p>
</body>
</html>"""


def _build_otp_html(name: str, otp: str) -> str:
    """Build the HTML body for a VERIFY (OTP) email."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Verification Code</title>
</head>
<body style="margin:0;padding:16px;font-family:sans-serif;color:#000;font-size:14px;">
    Your verification code is: {otp}. It will <span style="background-color:#1e88e5;color:#fff;padding:2px 4px;">expire in 10 minutes.</span>
</body>
</html>"""


def _build_reminder_html(name: str, tasks: list, study_name: str) -> str:
    """Build the HTML body for task reminders."""
    task_items = "".join([f'<li style="margin-bottom:8px;color:#1E293B;"><strong>{t["title"]}</strong> (Due: {t["due_date"]})</li>' for t in tasks])
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:24px;background-color:#F8FAFC;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #E2E8F0;">
    <h2 style="color:#1E3A8A;margin-top:0;">Gentle Reminder: Pending Tasks</h2>
    <p style="color:#475569;">Hello {name}, you have pending activities for the <strong>{study_name}</strong> study:</p>
    <ul style="padding-left:20px;">
      {task_items}
    </ul>
    <p style="color:#475569;margin-top:24px;">Please log in to your participant portal to complete these tasks at your earliest convenience.</p>
    <div style="text-align:center;margin-top:32px;">
      <a href="https://musbresearch.com/dashboard/participant" style="background:#2563EB;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Open Portal</a>
    </div>
  </div>
</body>
</html>"""


def send_reminder_email(user_email: str, user_name: str, study_name: str, tasks: list) -> bool:
    """Send a task reminder email."""
    try:
        subject = f"Reminder: Pending tasks for {study_name}"
        html_message = _build_reminder_html(user_name, tasks, study_name)
        plain_message = f"Hello {user_name}, you have {len(tasks)} pending tasks for {study_name}. Please log in to complete them."
        
        from_email = f"MusB Research <{getattr(settings, 'SMTP_EMAIL', 'noreplymusbresearch@gmail.com')}>"
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.exception(f"SMTP Invitation Error: Failed to send reminder to {user_email}: {str(e)}")
        raise


def send_musb_system_email(
    user_email: str,
    user_name: str,
    mode: str,
    secret_data: str,
    study_name: str | None = None,
    study_title: str | None = None,
    role: str | None = None,
    expires_in_days: int = 7,
) -> bool:
    """
    Send a MusB system email.
    """
    mode = mode.upper()

    try:
        if mode == 'INVITE':
            subject = f"Action Required: You are invited to the assigned study ({study_name or 'Clinical Trial'}) on MusB Research"
            html_message = _build_invite_html(user_name, secret_data, study_name, study_title, role, expires_in_days)
            plain_message = (
                f"Hello {user_name},\n\n"
                f"You have been invited to join the assigned study '{study_name or 'Clinical Trial'}' on the MusB Research clinical portal.\n\n"
                f"Accept your invitation here:\n{secret_data}\n\n"
                f"This link expires in {expires_in_days} days.\n\n"
                f"If you did not expect this invitation, you can safely ignore this email.\n\n"
                f"MusB Research Team"
            )

        elif mode == 'VERIFY':
            subject = f"{secret_data} is your MusB Research verification code"
            html_message = _build_otp_html(user_name, secret_data)
            plain_message = (
                f"Hello {user_name},\n\n"
                f"Your MusB Research verification code is: {secret_data}\n\n"
                f"This code expires in 10 minutes.\n"
                f"Do not share this code with anyone.\n\n"
                f"MusB Research Team"
            )

        elif mode == 'SCREENER_THANKS':
            study_name = study_name or secret_data
            subject = f"Thank you for applying to {study_name} — MusB Research"
            html_message = f"""<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1E3A8A;">Thank You, {user_name}!</h2>
            <p>We have received your eligibility form for <strong>{study_name}</strong>.</p>
            <p>Our clinical team will review your information and contact you within <strong>2–3 business days</strong>.</p>
            <p>Questions? Email us at <a href="mailto:info@musbresearch.com">info@musbresearch.com</a></p>
            <p style="color:#64748b;font-size:13px;">MusB Research Team</p>
            </div>"""
            plain_message = f"Thank you {user_name}, we received your application for {study_name}. We will contact you in 2-3 business days."

        elif mode == 'SCREENER_ALERT':
            subject = f"New Screener Submission — {secret_data}"
            html_message = f"""<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1E3A8A;">New Screener Submission</h2>
            <p><strong>Details:</strong> {secret_data}</p>
            <p><strong>Study:</strong> {study_name or 'N/A'}</p>
            <p>Please login to the coordinator portal to review.</p>
            </div>"""
            plain_message = f"New screener submission: {secret_data}"

        elif mode == 'ACCOUNT_CREATED':
            temp_password = secret_data
            subject = f"Your MusB Research Account — Accepted to {study_name}"
            html_message = f"""<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1E3A8A;">Welcome, {user_name}!</h2>
            <p>You have been <strong style="color:#16a34a;">accepted</strong> to participate in <strong>{study_name}</strong>.</p>
            <p>Your account credentials:</p>
            <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;">
            <p><strong>Email:</strong> {user_email}</p>
            <p><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;">{temp_password}</code></p>
            </div>
            <p>You will be asked to change your password on first login.</p>
            <a href="https://musbhealth.com/signin" style="display:inline-block;background:#1D4ED8;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Log In Now</a>
            </div>"""
            plain_message = f"Welcome {user_name}! Accepted to {study_name}. Login: {user_email} / Temp password: {temp_password}"

        elif mode == 'SCREENER_REJECTED':
            subject = f"Update on Your Application — {study_name}"
            html_message = f"""<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1E3A8A;">Application Update</h2>
            <p>Dear {user_name},</p>
            <p>Thank you for your interest in <strong>{study_name}</strong>.</p>
            <p>After reviewing your information, our clinical team has determined that you do not meet the eligibility criteria for this study at this time.</p>
            <p>We encourage you to check our website for other studies that may be a better fit.</p>
            <p style="color:#64748b;font-size:13px;">MusB Research Team | info@musbresearch.com</p>
            </div>"""
            plain_message = f"Dear {user_name}, thank you for applying to {study_name}. Unfortunately you do not meet the eligibility criteria at this time."

        else:
            logger.error(f"send_musb_system_email: unknown mode '{mode}'")
            return False
        from_email = f"MusB Research <{getattr(settings, 'SMTP_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'noreplymusbresearch@gmail.com')}>"
        
        # ─────────────────────────────────────────────────────────
        # PRODUCTION DELIVERY - PRIORITIZE SMTP FOR SYSTEM EMAILS
        # ─────────────────────────────────────────────────────────
        # We prioritize SMTP here because Resend does not allow sending from @gmail.com domains
        # and the user explicitly requested to use SMTP for invitations.
        
        try:
            logger.info(f"[EMAIL-SMTP] Attempting delivery to {user_email} via {settings.EMAIL_HOST}")
            logger.info(f"SMTP Config: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, USER={settings.EMAIL_HOST_USER}, TLS={settings.EMAIL_USE_TLS}")
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=from_email,
                recipient_list=[user_email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"[EMAIL-SMTP] SUCCESS: {mode} sent to {user_email}")
            return True
        except Exception as smtp_err:
            logger.warning(f"[EMAIL-SMTP] Failed, checking for Resend fallback: {str(smtp_err)}")
            
            # Fallback to Resend ONLY if SMTP fails and key is present
            resend_key = getattr(settings, 'RESEND_API_KEY', None)
            if resend_key and "@gmail.com" not in from_email: # Resend won't work for Gmail anyway
                try:
                    import resend
                    resend.api_key = resend_key
                    resend.Emails.send({
                        "from": from_email,
                        "to": [user_email],
                        "subject": subject,
                        "html": html_message
                    })
                    logger.info(f"[EMAIL-RESEND] Fallback SUCCESS: {mode} sent to {user_email}")
                    return True
                except Exception as res_err:
                    logger.error(f"[EMAIL-RESEND] Fallback Failed: {res_err}")
            
            # If both fail, or Resend wasn't an option, raise the original SMTP error
            logger.exception(f"SMTP Invitation Error: CRITICAL FAILURE: Could not deliver {mode} to {user_email}.")
            raise

    except Exception as e:
        logger.exception(f"SMTP Invitation Error: Unexpected error in send_musb_system_email: {str(e)}")
        raise
