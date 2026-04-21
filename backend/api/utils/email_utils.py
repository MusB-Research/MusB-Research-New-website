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
    qr_url = f"https://chart.googleapis.com/chart?cht=qr&chs=160x160&choe=UTF-8&chl={encoded}"
    return (
        f'<img src="{qr_url}" width="160" height="160" '
        f'style="border-radius:8px;border:1px solid #1e2d45;display:block;margin:0 auto;" '
        f'alt="Scan to Accept Invitation" />'
    )


def _build_invite_html(name: str, invite_link: str) -> str:
    """Build the HTML body for an INVITE email.
    Uses a white card on light-grey background — renders correctly in Outlook, Gmail, and Apple Mail.
    Solid button color (no gradient) — gradients are stripped by most email clients.
    QR code via Google Charts API — no base64 bloat.
    """
    import urllib.parse
    encoded = urllib.parse.quote(invite_link, safe='')
    qr_url = f"https://chart.googleapis.com/chart?cht=qr&chs=150x150&choe=UTF-8&chl={encoded}"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>MusB Research Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:540px;" cellpadding="0" cellspacing="0" border="0">

          <!-- Top accent bar -->
          <tr>
            <td style="background-color:#1a56db;height:6px;border-radius:6px 6px 0 0;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- White card -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;border-radius:0 0 8px 8px;border:1px solid #d1d5db;border-top:none;">

              <!-- Logo / Brand -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#1a56db;">MusB Research</p>
                    <h1 style="margin:8px 0 0;font-size:26px;font-weight:800;color:#111827;line-height:1.2;">You've Been Invited</h1>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid #e5e7eb;padding-bottom:24px;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- Body text -->
              <p style="margin:0 0 8px;font-size:16px;color:#111827;">Hello, <strong>{name}</strong></p>
              <p style="margin:0 0 28px;font-size:14px;color:#4b5563;line-height:1.75;">
                You have been granted access to the <strong style="color:#1a56db;">MusB Research</strong> clinical portal.
                Click the button below to create your account and get started.
              </p>

              <!-- CTA Button — solid color, no gradient, works in all clients -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <a href="{invite_link}"
                       style="display:inline-block;padding:14px 36px;background-color:#1a56db;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:0.03em;">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- QR Code -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <p style="margin:0 0 10px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Or scan to accept</p>
                    <img src="{qr_url}" width="150" height="150"
                         style="display:block;margin:0 auto;border:1px solid #e5e7eb;border-radius:6px;background:#fff;"
                         alt="QR Code — scan to accept invitation" />
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:0 0 24px;font-size:12px;color:#9ca3af;text-align:center;">
                Can't click the button? Copy this link into your browser:<br/>
                <a href="{invite_link}" style="color:#1a56db;word-break:break-all;">{invite_link[:80]}{'...' if len(invite_link) > 80 else ''}</a>
              </p>

              <!-- Expiry warning -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">&#x26A0; This link expires in 7 days.</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#78350f;">If you did not expect this invitation, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 0 0;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                MusB Research &bull; Clinical Operations &bull;
                <a href="https://musbresearch.com" style="color:#4b5563;text-decoration:none;">musbresearch.com</a>
              </p>
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
) -> bool:
    """
    Send a MusB system email.

    Args:
        user_email:  Recipient's email address.
        user_name:   Recipient's display name.
        mode:        'INVITE' or 'VERIFY'
        secret_data: For INVITE → the accept URL; for VERIFY → the OTP string.

    Returns:
        True on success, False on failure (logs the error).
    """
    mode = mode.upper()

    try:
        if mode == 'INVITE':
            subject = "Action Required: MusB Research Access Invitation"
            html_message = _build_invite_html(user_name, secret_data)
            plain_message = (
                f"Hello {user_name},\n\n"
                f"You have been invited to the MusB Research clinical portal.\n\n"
                f"Accept your invitation here:\n{secret_data}\n\n"
                f"This link expires in 7 days.\n\n"
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

        from_email = f"MusB Research <{getattr(settings, 'SMTP_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'noreplymusbresearch@gmail.com')}>"
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"[EMAIL] {mode} sent to {user_email}")
        return True

    except Exception as e:
        logger.error(f"[EMAIL] Failed to send {mode} to {user_email}: {e}")
        return False
