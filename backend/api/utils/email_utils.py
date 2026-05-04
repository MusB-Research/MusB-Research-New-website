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

        else:
            logger.error(f"send_musb_system_email: unknown mode '{mode}'")
            return False

        import os
        import resend
        resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
        if resend.api_key:
            try:
                from_addr = "MusB Research <onboarding@resend.dev>"
                if hasattr(settings, 'DEFAULT_FROM_EMAIL') and '@resend.dev' not in settings.DEFAULT_FROM_EMAIL:
                    from_addr = settings.DEFAULT_FROM_EMAIL
                
                params = {
                    "from": from_addr,
                    "to": [user_email],
                    "subject": subject,
                    "html": html_message,
                }
                resend.Emails.send(params)
                logger.info(f"[EMAIL] {mode} sent to {user_email} via Resend.")
                return True
            except Exception as resend_err:
                logger.warning(f"[EMAIL] Resend primary delivery failed for {user_email}: {resend_err}. Trying SMTP fallback.")

        from_email = f"MusB Research <{getattr(settings, 'SMTP_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'noreplymusbresearch@gmail.com')}>"
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"[EMAIL] {mode} sent to {user_email} via SMTP fallback")
        return True

    except Exception as e:
        logger.error(f"[EMAIL] Both Resend and SMTP failed for {mode} to {user_email}: {e}")
        return False

