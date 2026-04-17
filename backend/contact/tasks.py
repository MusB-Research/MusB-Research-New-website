from celery import shared_task
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_contact_submission(submission_id, form_data=None):
    """
    Background task to handle contact submission emails and CRM integration.
    Offloading this from the request/response cycle ensures the user gets 
    an immediate 'Success' message even if email delivery is slow.
    """
    from .models import Submission
    try:
        submission = Submission.objects.get(id=submission_id)
        # Re-run the generation logic here or call a service method
        # For now, we'll keep the logic in the view for simplicity but trigger it via delay
        pass
    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found in background task.")
