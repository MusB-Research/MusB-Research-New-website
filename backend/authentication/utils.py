import requests
from django.conf import settings
from django.utils import timezone
import logging
import os
import secrets
import resend

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.getenv('RESEND_API_KEY')

def verify_recaptcha(token):
    if not token:
        return False
    
    try:
        response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data={
                'secret': os.getenv('RECAPTCHA_SECRET_KEY'),
                'response': token
            }
        )
        result = response.json()
        return result.get('success', False)
    except Exception as e:
        logger.error(f"reCAPTCHA verification error: {e}")
        return False

from django.core.mail import send_mail
from django.utils.html import strip_tags

def send_mail_premium(to_email, subject, title, body, button_text=None, button_url=None, qr_url=None, role=None):
    """
    High-fidelity HTML email delivery utility with support for:
    - Adaptive content based on user role
    - Direct Magic Link buttons
    - Dynamic QR Code generation for mobile scanning
    """
    # Generate QR Code image URL via secure API if qr_url is provided
    qr_img_html = ""
    if qr_url:
        import urllib.parse
        encoded_url = urllib.parse.quote(qr_url)
        qr_api = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded_url}"
        qr_img_html = f"""
        <div style="margin-top: 30px; text-align: center; background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0;">
            <p style="margin-bottom: 15px; font-size: 14px; font-weight: 700; color: #1e293b;">Scan to Enroll Instantly</p>
            <img src="{qr_api}" width="160" height="160" style="display: block; margin: 0 auto; border-radius: 8px;">
            <p style="margin-top: 15px; font-size: 12px; color: #64748b;">Scan this code with your phone camera</p>
        </div>
        """

    button_html = ""
    if button_text and button_url:
        button_html = f"""
        <div style="margin: 30px 0; text-align: center;">
            <a href="{button_url}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">
                {button_text}
            </a>
        </div>
        """

    role_badge = ""
    if role:
        role_badge = f"""
        <div style="display: inline-block; padding: 4px 10px; background: #d1fae5; color: #065f46; font-size: 12px; font-weight: 700; border-radius: 6px; margin-bottom: 15px;">
            {role}
        </div>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            body {{ font-family: 'Inter', system-ui, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }}
        </style>
    </head>
    <body>
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="padding: 40px 40px 10px 40px; text-align: center;">
                <div style="font-size: 28px; font-weight: 800; color: #10b981; letter-spacing: -0.01em;">MusB Research</div>
                <div style="font-size: 14px; color: #64748b; margin-top: 4px;">Clinical Operations Program</div>
            </div>
            
            <div style="padding: 20px 50px 40px 50px;">
                <div style="margin-bottom: 24px;">
                    {role_badge}
                    <h1 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 15px 0;">{title}</h1>
                </div>
                
                <div style="font-size: 15px; color: #475569; line-height: 1.8;">
                    {body}
                </div>
                
                {button_html}
                {qr_img_html}
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                
                {f'<div style="text-align: left;"><p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">If the button above does not work, copy and paste this link:</p><a href="{button_url}" style="color: #10b981; font-size: 12px; word-break: break-all;">{button_url}</a></div>' if button_url else ''}

                <div style="margin-top: 40px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 MusB Research. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        from django.core.mail import EmailMultiAlternatives
        from django.conf import settings
        from django.utils.html import strip_tags
        msg = EmailMultiAlternatives(subject, strip_tags(html_content), settings.DEFAULT_FROM_EMAIL, [to_email])
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        logger.error(f"Failed to deliver premium email to {to_email}: {e}")
        return False


import hashlib

def hash_otp(otp_code):
    """Securely hash OTP code for database storage."""
    return hashlib.sha256(otp_code.encode()).hexdigest()

def send_resend_email(to_email, subject, html_content):
    """
    Sends an email using the Resend API directly.
    Fallbacks to onboarding@resend.dev or a local log file if unverified.
    """
    try:
        if not resend.api_key:
            logger.error("RESEND_API_KEY not configured.")
            _log_email_locally(to_email, subject, html_content)
            return False

        params = {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        try:
            resend.Emails.send(params)
            return True
        except Exception as api_err:
            err_msg = str(api_err).lower()
            if "domain is not verified" in err_msg:
                logger.warning(f"Domain not verified, attempting testing domain for {to_email}")
                params["from"] = "onboarding@resend.dev"
                try:
                    resend.Emails.send(params)
                    return True
                except Exception as test_err:
                    if "only send testing emails to your own email address" in str(test_err).lower() or "restriction" in str(test_err).lower():
                        logger.error(f"Resend TESTING RESTRICTION: Cannot send to {to_email} via testing domain. Link logged to sent_emails.log")
                        _log_email_locally(to_email, f"[DEVELOPMENT RESET] {subject}", html_content)
                        return True # Return true so UI doesn't crash, dev can check logs
                    
                    _log_email_locally(to_email, f"[FAILED SEND] {subject}", html_content)
                    return False
            
            logger.error(f"Resend API error: {err_msg}")
            _log_email_locally(to_email, f"[API ERROR] {subject}", html_content)
            return True # Fallback to log for dev
            
    except Exception as e:
        logger.error(f"Critical error in send_resend_email: {str(e)}")
        _log_email_locally(to_email, f"[CRITICAL ERROR] {subject}", html_content)
        return True # Fail gracefully in dev


def _log_email_locally(to_email, subject, content):
    """Saves email to a local log file for development debugging when API fails."""
    try:
        log_file = os.path.join(settings.BASE_DIR, "sent_emails.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"DATE: {timezone.now()}\n")
            f.write(f"TO: {to_email}\n")
            f.write(f"SUBJECT: {subject}\n")
            f.write(f"CONTENT:\n{content}\n")
            f.write(f"{'='*80}\n")
        logger.info(f"Email content saved to local log: {log_file}")
    except Exception as e:
        logger.error(f"Failed to log email locally: {e}")

import pyotp
import qrcode
import io
import base64

def generate_totp_secret():
    """Generates a secure random base32 secret for TOTP."""
    return pyotp.random_base32()

def get_totp_uri(user_email, secret, issuer_name="MusB Research"):
    """Generates a TOTP provisioning URI for authenticator apps."""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_email, 
        issuer_name=issuer_name
    )

def verify_totp(secret, token):
    """Verifies a 6-digit TOTP token against the secret."""
    totp = pyotp.totp.TOTP(secret)
    return totp.verify(token)

def generate_qr_code_base64(uri):
    """Generates a base64 encoded QR code PNG from a URI."""
    img = qrcode.make(uri)
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

def generate_token():
    """Generates a secure random hex token for magic links."""
    return secrets.token_hex(32)


def handle_credential_upload(user, file_obj, doc_type):
    """
    Saves professional credential files (PDF, JPEG, PNG) to the media directory.
    Returns the relative path for database storage.
    """
    if not file_obj:
        return None
        
    # Security: Ensure upload directory exists
    from django.core.files.storage import default_storage
    from django.core.files.base import ContentFile
    
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ['.pdf', '.jpg', '.jpeg', '.png']:
        return None
        
    # Format: credentials/user_id/licence_timestamp.ext
    filename = f"credentials/{user.id}/{doc_type}{ext}"
    
    # Check if already exists, then delete or overwrite
    if default_storage.exists(filename):
        default_storage.delete(filename)
        
    path = default_storage.save(filename, ContentFile(file_obj.read()))
    return path
