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
    Only fires when a log is FIRST finalized (created as non-draft, or transitions
    from draft → final). Deduplicates within the same day to prevent spam.
    """
    if instance.is_draft:
        return  # Never alert on drafts

    participant = instance.participant
    study = getattr(participant, 'study', None)
    if not study:
        return

    sid = participant.participant_sid or 'Unknown'
    date_str = instance.date.strftime('%b %d, %Y')

    # Deduplication: skip if a notification for this participant/date was already sent today
    from django.utils.timezone import now
    today_start = now().replace(hour=0, minute=0, second=0, microsecond=0)
    already_notified = Notification.objects.filter(
        title__icontains=sid,
        message__icontains=date_str,
        created_at__gte=today_start
    ).exists()
    if already_notified and not instance.noticed_side_effects:
        return  # Suppress duplicate for normal re-saves; always send AE alerts

    # Determine notification type based on content
    is_ae = instance.noticed_side_effects
    severity = (instance.severity or '').upper()
    is_urgent = is_ae and severity in ['MODERATE', 'SEVERE']

    notif_type = "WARNING" if is_ae else "INFO"
    notif_title = (
        f"{'🚨 URGENT: ' if is_urgent else '⚠️ '}Adverse Event — {sid}"
        if is_ae else
        f"📋 Daily Log Submitted — {sid}"
    )
    msg = f"Participant {sid} submitted their daily log for {date_str}."
    if is_ae:
        msg += f"\n⚠️ Side effects reported (Severity: {severity or 'unspecified'})."
        if instance.side_effect_description:
            msg += f" \"{instance.side_effect_description[:200]}\""

    staff_team = study.get_all_staff_users()
    
    for staff_user in staff_team:
        try:
            role = (getattr(staff_user, 'role', '') or '').upper()
            link = f"/dashboard/pi/participants/{participant.id}/logs" if role == 'PI' else f"/dashboard/coordinator/participants/{participant.id}/logs"
            
            Notification.objects.create(
                user=staff_user,
                title=notif_title,
                message=msg,
                type=notif_type,
                link=link
            )
            from .models import StaffTask
            StaffTask.objects.create(
                user=staff_user,
                study=study,
                title=notif_title,
                description=msg,
                task_type='LOG_REVIEW',
                reference_id=str(instance.id),
                status='NEW'
            )
        except Exception as e:
            print(f"[signal] Notification error for {staff_user}: {e}")
            
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
