import requests
from django.conf import settings
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

def send_resend_email(to_email, subject, html_content):
    """Sends an email using the Resend API."""
    try:
        params = {
            "from": settings.DEFAULT_FROM_EMAIL or "MusB Research <noreply@musbhealth.com>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.error(f"Error sending email via Resend: {e}")
        return False

def generate_token():
    """Generates a secure random hex token for magic links."""
    return secrets.token_hex(32)
