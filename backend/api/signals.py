from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Visit, DailyMedicationLog, Notification, Participant, Study, QuestionnaireScheduleInstance, News, Event
from django.utils.timezone import now
from .tasks import refresh_study_stats_cache, refresh_participants_list_cache

@receiver(post_save, sender=Visit)
def notify_participant_on_visit_completion(sender, instance, created, **kwargs):
    """
    Automated notification for participants upon visit completion.
    """
    if not created and instance.status == 'COMPLETED':
        # Check if we already sent a completion notification for this specific visit update
        # (This avoids duplicate spam if the visit is saved multiple times while completed)
        # For simplicity in this implementation, we just send it.
        
        participant_user = instance.participant.user
        if participant_user:
            staff_name = "Clinical Staff"
            if instance.updated_by:
                staff_name = getattr(instance.updated_by, 'decrypted_name', instance.updated_by.full_name) or "Staff"
            elif instance.scheduled_by:
                staff_name = getattr(instance.scheduled_by, 'decrypted_name', instance.scheduled_by.full_name) or "Staff"
                
            Notification.objects.create(
                user=participant_user,
                title="Visit Details Released",
                message=(
                    f"Your {instance.visit_type} visit has been marked as completed by {staff_name}. "
                    f"You can now view your clinical notes and assessments in the portal."
                ),
                type="SUCCESS",
                link="/dashboard/participant/visits"
            )

@receiver(post_save, sender=DailyMedicationLog)
def alert_staff_on_log_submission(sender, instance, created, **kwargs):
    """
    Real-time alert for coordinators and PIs when participants submit daily logs.
    """
    # Only alert when the log is NOT a draft and is newly submitted (or transitioned from draft)
    # We'll use created OR a check on draft status changing
    if not instance.is_draft:
        participant = instance.participant
        study = participant.study
        
        # Determine notification type based on content
        notif_type = "INFO"
        notif_title = "New Daily Log Entry"
        if instance.noticed_side_effects:
            notif_type = "WARNING"
            notif_title = "⚠️ Adverse Event Reported"
        
        msg = f"Subject {participant.participant_sid} submitted a daily log for {instance.date.strftime('%b %d')}."
        if instance.noticed_side_effects:
            msg += f" WARNING: Side effects reported ({instance.severity})."

        # Notify Study Coordinator
        if study.coordinator:
            Notification.objects.create(
                user=study.coordinator,
                title=notif_title,
                message=msg,
                type=notif_type,
                link=f"/dashboard/coordinator/participants/{participant.participant_sid}/logs"
            )
            
        # Notify Study PI
        if study.pi:
            Notification.objects.create(
                user=study.pi,
                title=notif_title,
                message=msg,
                type=notif_type,
            )
            
@receiver(post_save, sender=Participant)
def trigger_cache_refresh_on_participant_change(sender, instance, **kwargs):
    """
    Refresh participants and study stats caches when a participant record is updated.
    """
    refresh_participants_list_cache.delay()
    if instance.study:
        refresh_study_stats_cache.delay(str(instance.study.id))

@receiver(post_save, sender=QuestionnaireScheduleInstance)
def trigger_stats_refresh_on_task_update(sender, instance, **kwargs):
    """
    Refresh study stats when tasks (questionnaires) are updated.
    """
    if instance.participant and instance.participant.study:
        refresh_study_stats_cache.delay(str(instance.participant.study.id))

@receiver(post_save, sender=Study)
def trigger_cache_refresh_on_study_change(sender, instance, **kwargs):
    """
    Invalidate global study cache.
    """
    from .utils.cache_utils import invalidate_cache
    invalidate_cache("studies_list")

@receiver(post_save, sender=Visit)
def invalidate_visit_cache(sender, instance, **kwargs):
    """
    Invalidate visits list cache when a visit is updated.
    """
    from .utils.cache_utils import invalidate_cache
    invalidate_cache("visits_list")

@receiver(post_save, sender=News)
def invalidate_news_cache(sender, instance, **kwargs):
    """
    Invalidate public news cache.
    """
    from .utils.cache_utils import invalidate_cache
    invalidate_cache("news_list")

@receiver(post_save, sender=Event)
def invalidate_event_cache(sender, instance, **kwargs):
    """
    Invalidate public events cache.
    """
    from .utils.cache_utils import invalidate_cache
    invalidate_cache("events_list")

# ─────────────────────────────────────────────────────────
#  Careers & Contact App Signals (Main Website Support)
# ─────────────────────────────────────────────────────────

from careers.models import JobPosting
from contact.models import ContactPageSettings, ContactFormConfiguration, InquiryType

@receiver(post_save, sender=JobPosting)
def invalidate_careers_cache(sender, instance, **kwargs):
    from .utils.cache_utils import invalidate_cache
    invalidate_cache("active_jobs")
    invalidate_cache("job_detail")

@receiver(post_save, sender=ContactPageSettings)
@receiver(post_save, sender=ContactFormConfiguration)
@receiver(post_save, sender=InquiryType)
def invalidate_contact_cache(sender, instance, **kwargs):
    from .utils.cache_utils import invalidate_cache
    invalidate_cache("contact_settings")
    invalidate_cache("contact_form_config")
    invalidate_cache("inquiry_types")
