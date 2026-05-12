from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_smtp_email_task(self, to_email, subject, html_content, plain_content=None, from_email=None):
    """
    Asynchronous task to deliver emails via SMTP with retry logic.
    """
    if not from_email:
        from_email = settings.DEFAULT_FROM_EMAIL

    if not plain_content:
        plain_content = strip_tags(html_content)

    try:
        # Check if we are on production and SMTP is configured
        if not settings.DEBUG and settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
            logger.error(f"[CELERY-SMTP] FAILED: Console backend detected in production! Cannot send to {to_email}")
            return False

        logger.info(f"[CELERY-SMTP] Attempting delivery to {to_email} (Subject: {subject})")
        
        msg = EmailMultiAlternatives(subject, plain_content, from_email, [to_email])
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        
        logger.info(f"[CELERY-SMTP] SUCCESS: Delivered to {to_email}")
        return True

    except Exception as exc:
        logger.error(f"[CELERY-SMTP] ERROR: Failed delivery to {to_email}: {str(exc)}")
        # Exponential backoff retry
        try:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        except Exception:
            logger.error(f"[CELERY-SMTP] FATAL: All retries exhausted for {to_email}")
            return False

@shared_task(bind=True, max_retries=3)
def send_email_task(self, user_email, user_name, mode, secret_data,
                    study_name=None, study_title=None, role=None, expires_in_days=7):
    try:
        from api.utils.email_utils import send_musb_system_email
        return send_musb_system_email(
            user_email, user_name, mode, secret_data,
            study_name, study_title, role, expires_in_days
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))