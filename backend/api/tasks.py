from celery import shared_task
from django.core.cache import cache
from .models import Participant, Study, QuestionnaireScheduleInstance
from .serializers import ParticipantBriefSerializer, StudySerializer
import logging
import json

logger = logging.getLogger(__name__)

@shared_task
def refresh_study_stats_cache(study_id):
    """
    Background task to recalculate study stats and update cache.
    """
    try:
        study = Study.objects.get(pk=study_id)
        # Mocking the PI/Coordinator context for stats calculation
        participants = Participant.objects.filter(study=study)
        total_enrolled = participants.count()
        
        instances = QuestionnaireScheduleInstance.objects.filter(participant__study=study)
        total_tasks = instances.count()
        completed = instances.filter(status='COMPLETED').count()
        late = instances.filter(status='LATE').count()
        missed = instances.filter(status='MISSED').count()
        
        compliance = (completed / total_tasks * 100) if total_tasks > 0 else 0
        
        stats_data = {
            'enrolled': total_enrolled,
            'completion': {
                'total': total_tasks,
                'completed': completed,
                'late': late,
                'missed': missed,
                'compliance_rate': round(compliance, 1)
            }
        }
        
        # We'd need to know which users to update for. 
        # For now, we'll just invalidate the general pattern.
        if hasattr(cache, 'delete_pattern'):
            cache.delete_pattern(f"study_stats:{study_id}:*")
            logger.info(f"Invalidated stats cache for study {study_id}")
            
    except Study.DoesNotExist:
        pass

@shared_task
def refresh_participants_list_cache():
    """
    Invalidates all participant list caches when any participant data changes.
    """
    if hasattr(cache, 'delete_pattern'):
        cache.delete_pattern("participant_records_list:*")
        logger.info("Invalidated all participant_records_list caches")
        
@shared_task
def check_missed_visits():
    """
    Background worker: Periodically marks SCHEDULED visits in the past as MISSED.
    Triggers automated deviations and notifications.
    """
    from django.utils.timezone import now
    from .models import Visit, Notification, StaffTask
    
    # 1. Identify all past scheduled visits
    past_visits = Visit.objects.filter(status='SCHEDULED', scheduled_date__lt=now()).select_related(
        'participant', 'participant__user', 'participant__study'
    )
    
    missed_count = past_visits.count()
    if missed_count == 0:
        return 0
        
    # 2. Bulk update status
    past_visits.update(status='MISSED')
    
    # 3. Handle notifications in batches
    p_notifs = []
    s_tasks = []
    
    for v in past_visits:
        if v.participant.user:
            p_notifs.append(Notification(
                user=v.participant.user,
                title="Missed Visit Alert",
                message=f"Protocol Deviation: You missed your {v.visit_type} on {v.scheduled_date.strftime('%Y-%m-%d')}.",
                type="DANGER"
            ))
            
        # Notify Coordinator/PI via StaffTask
        coord = v.participant.study.coordinator or v.participant.study.pi
        if coord:
            s_tasks.append(StaffTask(
                user=coord,
                study=v.participant.study,
                title=f"DEVIATION: {v.participant.participant_sid} missed visit",
                description=f"Automated Alert: Subject missed {v.visit_type} scheduled for {v.scheduled_date}.",
                task_type='VISIT_DEVIATION',
                reference_id=str(v.id)
            ))
            
    if p_notifs:
        Notification.objects.bulk_create(p_notifs)
    if s_tasks:
        StaffTask.objects.bulk_create(s_tasks)
        
    logger.info(f"Background check complete: Marked {missed_count} visits as MISSED.")
    return missed_count

@shared_task
def check_staff_sla():
    """
    Background worker: Periodically checks for StaffTasks that have passed their due_date
    without being completed or addressed.
    """
    from django.utils.timezone import now
    from .models import StaffTask, Notification
    
    overdue_tasks = StaffTask.objects.filter(
        status__in=['NEW', 'IN_PROGRESS'],
        due_date__lt=now(),
        is_completed=False
    ).select_related('user', 'study', 'study__pi')
    
    count = overdue_tasks.count()
    if count == 0:
        return 0
        
    for task in overdue_tasks:
        task.status = 'OVERDUE'
        task.save()
        
        # Notify Coordinator (the owner)
        Notification.objects.create(
            user=task.user,
            title="SLA Escalation: Overdue Task",
            message=f"Task '{task.title}' for {task.study.protocol_id if task.study else 'N/A'} is now OVERDUE.",
            type="ERROR",
            link="/dashboard/coordinator/alerts"
        )
        
        # Notify PI and Super Admin
        recipients = []
        if task.study and task.study.pi:
            recipients.append(task.study.pi)
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        super_admins = User.objects.filter(role='SUPER_ADMIN')
        for admin in super_admins:
            if admin not in recipients:
                recipients.append(admin)
                
        for recipient in recipients:
            Notification.objects.create(
                user=recipient,
                title="Overdue Clinical Task",
                message=f"Coordinator task '{task.title}' has exceeded the 48h SLA window.",
                type="WARNING",
                link="/dashboard/admin/alerts" if recipient.role == 'SUPER_ADMIN' else "/dashboard/pi/alerts"
            )
            
    logger.info(f"SLA Escalation complete: Marked {count} staff tasks as OVERDUE.")
    return count


@shared_task(bind=True, max_retries=3)
def send_email_task(self, user_email, user_name, mode, secret_data, 
                    study_name=None, study_title=None, role=None, expires_in_days=7):
    """
    Async email sending — never blocks API responses
    """
    try:
        from .utils.email_utils import send_musb_system_email
        result = send_musb_system_email(
            user_email=user_email,
            user_name=user_name,
            mode=mode,
            secret_data=secret_data,
            study_name=study_name,
            study_title=study_title,
            role=role,
            expires_in_days=expires_in_days,
        )
        return result
    except Exception as exc:
        # Retry up to 3 times with 60 second delay
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=2)
def generate_consent_pdf_task(self, consent_id):
    """
    Async PDF generation — never blocks API responses
    """
    try:
        from .models import Consent
        from .utils.pdf_utils import generate_signed_consent_pdf
        consent = Consent.objects.get(pk=consent_id)
        generate_signed_consent_pdf(consent)
        logger.info(f"PDF generated for consent {consent_id}")
    except Consent.DoesNotExist:
        logger.error(f"Consent {consent_id} not found for PDF generation")
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)