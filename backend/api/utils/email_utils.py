"""
MusB Research System Email Utility
===================================
Sends invitation + OTP emails via Gmail SMTP.
Strictly decoupled from Resend API — no Resend calls here.

Usage:
    from api.utils.email_utils import send_musb_system_email

    send_musb_system_email(
        user_email='pi@hospital.com',
        user_name='Dr. Smith',
        mode='INVITE',
        secret_data='https://musbresearch.com/auth/accept?token=abc123'
    )

    send_musb_system_email(
        user_email='pi@hospital.com',
        user_name='Dr. Smith',
        mode='VERIFY',
        secret_data='847291'
    )
"""

import logging
from io import BytesIO

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


def _build_invite_html(name: str, invite_link: str, study_name: str = None, study_title: str = None, role: str = None, expires_in_days: int = 7) -> str:
    """Build the HTML body for an INVITE email.
    Uses custom styles matching the requested design and template exactly.
    Includes role-based, study-specific details, a side-by-side CTA / QR section, 
    fallback link, and expiry alerts.
    """
    import urllib.parse
    encoded = urllib.parse.quote(invite_link, safe='')
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={encoded}"
    
    # Fetch the first active or latest study to use real data instead of hardcoded defaults
    if not study_name or not study_title:
        try:
            from api.models import Study
            first_study = Study.objects.order_by('-created_at').first()
            if first_study:
                if not study_name:
                    study_name = first_study.title
                if not study_title:
                    study_title = first_study.full_title or first_study.description or ""
        except Exception:
            pass

    study_n = study_name or "MusB Research Study Program"
    study_t = study_title or "A Clinical Study to Evaluate the Efficacy and Safety of our Treatment"
    role_n = role or "Principal Investigator (PI)"

    # Make sure we normalize the role to human-readable
    role_mapping = {
        'PI': 'Principal Investigator (PI)',
        'COORDINATOR': 'Study Coordinator',
        'SPONSOR': 'Sponsor User',
        'PARTICIPANT': 'Clinical Trial Participant'
    }
    role_clean = role_mapping.get((role_n or '').upper(), role_n)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>You've Been Invited to MusB Research</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F9FD;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F9FD;padding:24px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" style="max-width:600px;background-color:#ffffff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03);" cellpadding="0" cellspacing="0" border="0">
          
          <!-- Top Hero Branding Header -->
          <tr>
            <td style="padding:28px 32px 18px;background:#ffffff;text-align:center;border-bottom:1px solid #F1F5F9;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <img src="https://musbresearch.com/logo.jpg" alt="MusB Research" style="height:60px;width:auto;margin:0 auto 12px;display:block;border-radius:8px;" />
                    <strong style="display:block;font-size:24px;color:#1E3A8A;letter-spacing:-0.02em;text-transform:uppercase;margin-bottom:8px;">MusB <span style="color:#2563EB;">Research</span></strong>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin:0 0 4px;font-size:28px;font-weight:800;color:#0F172A;letter-spacing:-0.025em;line-height:1.2;">You've Been Invited!</h1>
                    <div style="width:40px;height:4px;background-color:#2563EB;border-radius:2px;margin:8px auto 0;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome & Personalized Greeting -->
          <tr>
            <td style="padding:24px 32px 16px;color:#334155;">
              <p style="margin:0 0 10px;font-size:16px;line-height:1.5;color:#1E293B;">Hello <strong style="color:#2563EB;">{name}</strong>,</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:#475569;">You have been invited to join the <strong style="color:#2563EB;">MUSB Research</strong> clinical portal. Please review the details below and accept your invitation to get started.</p>
            </td>
          </tr>

          <!-- Study Name & Title Details Card (Light Blue) -->
          <tr>
            <td style="padding:0 32px 16px;">
              <table width="100%" style="background-color:#F0F7FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px 24px;" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="width:48px;padding-top:2px;">
                    <span style="font-size:28px;line-height:1;">🔬</span>
                  </td>
                  <td valign="top" style="padding-left:14px;">
                    <span style="display:block;font-size:10px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Study Name</span>
                    <h3 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#1E3A8A;line-height:1.3;">{study_n}</h3>
                    
                    <span style="display:block;font-size:10px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Study Title</span>
                    <p style="margin:0;font-size:13px;font-weight:500;color:#3B82F6;line-height:1.45;">{study_t}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- User Role Card (Light Green) -->
          <tr>
            <td style="padding:0 32px 16px;">
              <table width="100%" style="background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 24px;" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="width:40px;padding-top:2px;">
                    <span style="font-size:24px;line-height:1;">🛡️</span>
                  </td>
                  <td valign="top" style="padding-left:14px;">
                    <p style="margin:0 0 3px;font-size:13px;color:#14532D;line-height:1.4;">
                      <strong style="color:#15803D;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;">Your Role:</strong> 
                      <strong style="color:#0F172A;">{role_clean}</strong>
                    </p>
                    <p style="margin:0;font-size:12px;color:#15803D;line-height:1.4;">
                      You will have access <strong style="color:#166534;">only to this study</strong> within the MUSB Research portal based on your role.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Section & Side-by-Side CTA / QR Code -->
          <tr>
            <td style="padding:0 32px 18px;" align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Left CTA Button Column -->
                    <table width="100%" style="max-width:260px;min-width:240px;background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 14px;height:180px;display:inline-table;vertical-align:top;margin:0 6px 14px 6px;" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" height="32">
                          <span style="display:inline-block;vertical-align:middle;font-size:18px;margin-right:6px;">📧</span>
                          <span style="display:inline-block;vertical-align:middle;font-size:11px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:0.05em;">Accept Your Invitation</span>
                        </td>
                      </tr>
                      <tr>
                        <td valign="middle" align="center" style="padding:10px 0;">
                          <a href="{invite_link}" style="display:inline-block;background-color:#2563EB;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 18px;border-radius:8px;border:none;box-shadow:0 2px 4px rgba(37,99,235,0.2);text-align:center;width:85%;white-space:nowrap;">Accept Invitation &rarr;</a>
                        </td>
                      </tr>
                      <tr>
                        <td valign="bottom" height="36">
                          <p style="margin:0;font-size:11px;color:#64748B;text-align:center;line-height:1.35;">Click the button above to create your account and access the study.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Right QR Code Column -->
                    <table width="100%" style="max-width:260px;min-width:240px;background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 14px;height:180px;display:inline-table;vertical-align:top;margin:0 6px 14px 6px;" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" height="32">
                          <span style="display:inline-block;vertical-align:middle;font-size:18px;margin-right:6px;">🔍</span>
                          <span style="display:inline-block;vertical-align:middle;font-size:11px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:0.05em;">Or Scan to Accept</span>
                        </td>
                      </tr>
                      <tr>
                        <td valign="middle" align="center">
                          <img src="{qr_url}" width="85" height="85" style="display:block;margin:0 auto;border:2px solid #2563EB;border-radius:8px;background:#ffffff;" alt="Scan QR Code to accept invitation" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Backup Link Copy / Expiry Warnings -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table width="100%" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;" cellpadding="0" cellspacing="0" border="0">
                <!-- Backup Link section -->
                <tr>
                  <td valign="top" style="width:24px;padding-top:2px;">
                    <span style="font-size:16px;">🔗</span>
                  </td>
                  <td style="padding-left:10px;padding-bottom:12px;">
                    <strong style="display:block;font-size:12px;color:#1E293B;margin-bottom:2px;">Can't click the button?</strong>
                    <span style="font-size:11px;color:#64748B;">Copy and paste this link into your browser:</span>
                    <a href="{invite_link}" style="display:block;font-size:11px;color:#2563EB;word-break:break-all;margin-top:2px;text-decoration:none;font-family:monospace;">{invite_link}</a>
                  </td>
                </tr>
                <!-- Expiry Warning Alert -->
                <tr>
                  <td colspan="2" style="background-color:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:12px 14px;margin-top:10px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" style="width:20px;padding-top:1px;">
                          <span style="font-size:14px;color:#92400E;">⚠️</span>
                        </td>
                        <td style="padding-left:8px;">
                          <p style="margin:0;font-size:12px;font-weight:700;color:#92400E;line-height:1.4;">
                            This invitation will expire in {expires_in_days} days.
                          </p>
                          <p style="margin:2px 0 0;font-size:11px;color:#78350F;line-height:1.4;">
                            If you did not expect this invitation, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Need Help Support Panel -->
          <tr>
            <td style="padding:16px 32px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="width:32px;">
                    <span style="font-size:22px;line-height:1;">🎧</span>
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <strong style="display:block;font-size:13px;color:#0F172A;margin-bottom:1px;">Need help?</strong>
                    <span style="font-size:12px;color:#64748B;">If you have any questions, please contact the MUSB Research support team.</span>
                  </td>
                  <td valign="middle" align="right" style="white-space:nowrap;padding-left:10px;">
                    <a href="mailto:info@musbresearch.com" style="display:block;color:#2563EB;font-size:13px;font-weight:700;text-decoration:none;margin-bottom:4px;">info@musbresearch.com &rarr;</a>
                    <a href="mailto:norelpymusbresearch@gmail.com" style="display:block;color:#2563EB;font-size:13px;font-weight:700;text-decoration:none;">norelpymusbresearch@gmail.com &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Legal & Privacy Dark Bottom Bar -->
          <tr>
            <td style="background-color:#0F172A;padding:16px 32px;color:#94A3B8;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="width:24px;padding-top:2px;">
                    <span style="font-size:14px;">🔒</span>
                  </td>
                  <td style="padding-left:10px;font-size:11px;line-height:1.45;color:#94A3B8;">
                    This email is intended for the person or entity to which it is addressed and contains confidential information. Please do not share this email.
                  </td>
                  <td valign="middle" align="right" style="padding-left:14px;white-space:nowrap;">
                    <strong style="font-size:12px;color:#ffffff;letter-spacing:0.025em;text-transform:uppercase;">MusB Research</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
        logger.error(f"Failed to send reminder to {user_email}: {e}")
        return False


def send_musb_system_email(
    user_email: str,
    user_name: str,
    mode: str,
    secret_data: str,
    study_name: str = None,
    study_title: str = None,
    role: str = None,
    expires_in_days: int = 7,
) -> bool:
    """
    Send a MusB system email.

    Args:
        user_email:      Recipient's email address.
        user_name:       Recipient's display name.
        mode:            'INVITE' or 'VERIFY'
        secret_data:     For INVITE → the accept URL; for VERIFY → the OTP string.
        study_name:      Optional. The name of the assigned study.
        study_title:     Optional. The title of the assigned study.
        role:            Optional. The role the user is invited with.
        expires_in_days: Optional. Link expiry warning.

    Returns:
        True on success, False on failure (logs the error).
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
        # PRODUCTION DELIVERY OPTIMIZATION
        # ─────────────────────────────────────────────────────────
        resend_key = getattr(settings, 'RESEND_API_KEY', None)
        if resend_key:
            try:
                import resend
                resend.api_key = resend_key
                resend.Emails.send({
                    "from": from_email,
                    "to": [user_email],
                    "subject": subject,
                    "html": html_message
                })
                logger.info(f"[EMAIL-RESEND] {mode} sent to {user_email}")
                return True
            except Exception as res_err:
                logger.error(f"[EMAIL-RESEND] Failed, falling back to SMTP: {res_err}")

        # Fallback to standard SMTP
        try:
            logger.info(f"[EMAIL-SMTP] Attempting delivery to {user_email} via {settings.EMAIL_HOST}")
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
            logger.error(f"[EMAIL-SMTP] CRITICAL FAILURE: Could not deliver {mode} to {user_email}.")
            logger.error(f"SMTP Error Details: {str(smtp_err)}")
            # Log specific hints for Gmail SMTP
            if "AuthenticationFailed" in str(smtp_err) or "535" in str(smtp_err):
                logger.error("HINT: Gmail SMTP Authentication failed. Verify SMTP_EMAIL and SMTP_PASSWORD (App Password required).")
            elif "ConnectionRefused" in str(smtp_err):
                logger.error(f"HINT: Could not connect to SMTP host {settings.EMAIL_HOST}:{settings.EMAIL_PORT}. Check network/firewall.")
            return False

    except Exception as e:
        logger.error(f"send_musb_system_email: Unexpected error: {str(e)}", exc_info=True)
        return False
