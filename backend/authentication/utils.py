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
                    if "only send testing emails to your own email address" in str(test_err).lower():
                        logger.error(f"Resend TESTING RESTRICTION: Cannot send to {to_email} via testing domain.")
                    _log_email_locally(to_email, f"[FAILED SEND] {subject}", html_content)
                    return False
            
            _log_email_locally(to_email, f"[API ERROR] {subject}", html_content)
            raise api_err
            
    except Exception as e:
        logger.error(f"Resend API error: {str(e)}")
        return False

def _log_email_locally(to_email, subject, content):
    """Saves email to a local log file for development debugging when API fails."""
    try:
        log_file = os.path.join(settings.BASE_DIR, "sent_emails.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"DATE: {now()}\n")
            f.write(f"TO: {to_email}\n")
            f.write(f"SUBJECT: {subject}\n")
            f.write(f"CONTENT:\n{content}\n")
            f.write(f"{'='*80}\n")
        logger.info(f"Email content saved to local log: {log_file}")
    except Exception as e:
        logger.error(f"Failed to log email locally: {e}")

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
