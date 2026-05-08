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
    # Optimization: Evaluate the queryset to a list BEFORE update, 
    # otherwise update() makes the queryset empty for the subsequent loop!
    past_visits_qs = Visit.objects.filter(status='SCHEDULED', scheduled_date__lt=now()).select_related(
        'participant', 'participant__user', 'participant__study'
    )
    
    # Materialize to list to avoid queryset re-evaluation issues after bulk update
    past_visits = list(past_visits_qs)
    missed_count = len(past_visits)
    
    if missed_count == 0:
        return 0
        
    # 2. Update status in DB
    # We iterate and save individually to avoid "NotSupportedError" on MongoDB 
    # when attempting bulk updates on querysets with select_related joins.
    for v in past_visits:
        v.status = 'MISSED'
        v.save(update_fields=['status'])
    
    # 3. Handle notifications and staff tasks
    p_notifs = []
    s_tasks = []
    
    for v in past_visits:
        try:
            # Safety check: ensure participant exists (should be guaranteed by DB FK but good for robustness)
            if not hasattr(v, 'participant') or v.participant is None:
                continue

            if v.participant.user:
                p_notifs.append(Notification(
                    user=v.participant.user,
                    title="Missed Visit Alert",
                    message=f"Protocol Deviation: You missed your {v.visit_type} on {v.scheduled_date.strftime('%Y-%m-%d')}.",
                    type="DANGER"
                ))
                
            # Notify Coordinator/PI via StaffTask
            if hasattr(v.participant, 'study') and v.participant.study:
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
        except Exception as e:
            logger.error(f"Error processing missed visit {getattr(v, 'id', 'unknown')}: {e}")
            continue
            
    if p_notifs:
        try:
            Notification.objects.bulk_create(p_notifs)
        except Exception as e:
            logger.error(f"Failed to bulk create notifications: {e}")

    if s_tasks:
        try:
            StaffTask.objects.bulk_create(s_tasks)
        except Exception as e:
            logger.error(f"Failed to bulk create staff tasks: {e}")
        
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

@shared_task
def send_automated_reminders():
    """
    Scans for PENDING tasks due today or yesterday and sends email reminders.
    """
    from django.utils.timezone import now, timedelta
    from .models import QuestionnaireScheduleInstance, Notification
    from .utils.email_utils import send_reminder_email
    
    threshold = now() + timedelta(days=1)
    pending_tasks = QuestionnaireScheduleInstance.objects.filter(
        status='PENDING',
        scheduled_date__lte=threshold
    ).select_related('participant', 'participant__user', 'participant__study', 'template')
    
    # Group by participant to avoid multiple emails
    by_participant = {}
    for task in pending_tasks:
        pid = task.participant.id
        if pid not in by_participant:
            by_participant[pid] = {
                'user': task.participant.user,
                'study': task.participant.study,
                'tasks': []
            }
        by_participant[pid]['tasks'].append({
            'title': task.template.title,
            'due_date': task.scheduled_date.strftime('%Y-%m-%d')
        })
        
    sent_count = 0
    for pid, data in by_participant.items():
        user = data['user']
        if user and user.email:
            success = send_reminder_email(
                user_email=user.email,
                user_name=user.get_full_name() or user.username,
                study_name=data['study'].title,
                tasks=data['tasks']
            )
            if success:
                sent_count += 1
                Notification.objects.create(
                    user=user,
                    title="Task Reminder Sent",
                    message=f"We've sent a reminder to your email for {len(data['tasks'])} pending tasks.",
                    type="INFO"
                )
                
    return sent_count

@shared_task
def generate_bulk_zip_task(study_id, instance_ids, user_id):
    """
    Async task to generate PDFs for a list of instances and bundle them into a ZIP archive.
    Once complete, it saves the ZIP as a Study Document and notifies the requesting user.
    """
    import zipfile
    import io
    import os
    from django.utils.timezone import now
    from django.core.files.base import ContentFile
    from django.contrib.auth import get_user_model
    from .models import QuestionnaireScheduleInstance, Document, Study, Notification
    from .utils.pdf_utils import generate_signed_questionnaire_pdf
    
    User = get_user_model()
    
    try:
        study = Study.objects.get(pk=study_id)
        user = User.objects.get(pk=user_id)
        
        # 1. Fetch relevant instances
        instances = QuestionnaireScheduleInstance.objects.filter(
            id__in=instance_ids, 
            participant__study=study
        ).select_related('participant', 'study_questionnaire', 'study_questionnaire__template')
        
        if not instances.exists():
            return {"error": "No valid questionnaire instances found for export."}

        # 2. Create ZIP in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for instance in instances:
                # Ensure the signed PDF exists; trigger fallback generation if missing
                if not instance.signed_pdf:
                    try:
                        generate_signed_questionnaire_pdf(instance)
                        instance.refresh_from_db()
                    except Exception as pdf_err:
                        logger.error(f"Failed to generate PDF for instance {instance.id}: {pdf_err}")
                        continue
                
                if instance.signed_pdf and instance.signed_pdf.name:
                    try:
                        pdf_path = instance.signed_pdf.path
                        if os.path.exists(pdf_path):
                            # Generate a clean, descriptive filename for the ZIP entry
                            safe_sid = str(instance.participant.participant_sid).replace('/', '_').replace('\\', '_')
                            instrument_name = (instance.study_questionnaire.template.name if instance.study_questionnaire else "Instrument").replace(' ', '_')
                            date_str = instance.completed_at.strftime('%Y-%m-%d') if instance.completed_at else "NoDate"
                            
                            arcname = f"{safe_sid}_{instrument_name}_{date_str}_{str(instance.id)[:8]}.pdf"
                            zip_file.write(pdf_path, arcname)
                    except Exception as zip_err:
                        logger.error(f"Error adding PDF to ZIP for instance {instance.id}: {zip_err}")

        zip_buffer.seek(0)
        
        # 3. Persist the ZIP as a Document for retrieval via the Coordinator Dashboard
        timestamp = now().strftime('%Y%m%d_%H%M%S')
        doc_title = f"Bulk_Export_{study.protocol_id}_{timestamp}.zip"
        
        doc = Document.objects.create(
            study=study,
            title=f"Bulk Export - {timestamp}",
            version="1.0",
            visibility=['PI', 'COORDINATOR'],
            is_archived=False
        )
        doc.file.save(doc_title, ContentFile(zip_buffer.getvalue()))
        
        # 4. Trigger Real-time Notification
        Notification.objects.create(
            user=user,
            title="Bulk PDF Export Complete",
            message=f"Your archive of {instances.count()} assessments for {study.protocol_id} is ready.",
            type="SUCCESS",
            link=doc.file.url
        )
        
        logger.info(f"Successfully generated bulk export for study {study_id}, user {user_id}")
        return {"status": "success", "url": doc.file.url, "document_id": str(doc.id)}
        
    except Exception as e:
        logger.error(f"Bulk export background task failed: {e}")
        # Notify user of failure
        try:
            requesting_user = User.objects.get(pk=user_id)
            Notification.objects.create(
                user=requesting_user,
                title="Bulk Export Failed",
                message="An error occurred while preparing your PDF archive. Please try again or contact support.",
                type="DANGER"
            )
        except: pass
        return {"error": str(e)}
