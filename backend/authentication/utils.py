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

from django.core.mail import send_mail
from django.utils.html import strip_tags

def send_resend_email(to_email, subject, html_content):
    """
    Sends an email using the Resend API directly.
    In DEBUG mode, it still prints to the console if no API KEY is found,
    but primarily uses the resend library for production/staging.
    """
    try:
        if not resend.api_key:
            logger.warning("RESEND_API_KEY not configured. Falling back to Django mail console/SMTP.")
            from_email = settings.DEFAULT_FROM_EMAIL
            plain_message = strip_tags(html_content)
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=from_email,
                recipient_list=[to_email],
                html_message=html_content,
                fail_silently=False,
            )
            return True

        params = {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.error(f"Resend API error sending email to {to_email}: {str(e)}")
        return False

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
