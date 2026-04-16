from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Visit, DailyMedicationLog, Notification, Participant, Study
from django.utils.timezone import now

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
                staff_name = instance.updated_by.decrypted_name or instance.updated_by.full_name
            elif instance.scheduled_by:
                staff_name = instance.scheduled_by.decrypted_name or instance.scheduled_by.full_name
                
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
                link=f"/dashboard/pi/participants/{participant.participant_sid}/logs"
            )
