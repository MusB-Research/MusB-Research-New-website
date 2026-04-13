from django.utils import timezone
from ..models import QuestionnaireScheduleInstance, Notification
import datetime

def run_reminder_check():
    """
    Core Cron-ready utility to monitor clinical windows and trigger alerts.
    - Transitions PENDING -> MISSED if window closes
    - Triggers 'Closing Soon' reminders
    - Logs audit-friendly interactions
    """
    now = timezone.now()
    
    # 1. TRANSITION: Flag Missed Tasks
    # If the window is closed and status is still PENDING, it's officially MISSED.
    missed_tasks = QuestionnaireScheduleInstance.objects.filter(
        status__in=['PENDING', 'IN_PROGRESS'],
        window_close_at__lt=now
    )
    for inst in missed_tasks:
        inst.status = 'MISSED'
        inst.save()
        
        # Notify Participant (Optional: Only if they have a user account)
        if inst.participant.user:
            Notification.objects.create(
                user=inst.participant.user,
                title="Assessment Expired",
                message=f"The window for your '{inst.study_questionnaire.template.name}' assessment has closed.",
                type="WARNING"
            )
            
        # Notify Coordinator if it's a critical study
        # study = inst.study_questionnaire.study
        # ... logic for critical study alerts

    # 2. PROACTIVE: 'Closing Soon' Reminders
    # Find active windows that close in the next 60 minutes and haven't been reminded yet
    urgent_windows = QuestionnaireScheduleInstance.objects.filter(
        status__in=['PENDING', 'IN_PROGRESS'],
        window_close_at__gt=now,
        window_close_at__lt=now + datetime.timedelta(hours=1),
        reminder_count=0
    )
    for inst in urgent_windows:
        if inst.participant.user:
            Notification.objects.create(
                user=inst.participant.user,
                title="Reminder: Window Closing",
                message=f"You have 1 hour left to complete your '{inst.study_questionnaire.template.name}' assessment.",
                type="INFO"
            )
            inst.reminder_count += 1
            inst.last_reminder_at = now
            inst.save()

    # 3. TRANSITION: Flag Expired (for tasks past a 'late' submission threshold)
    # (Future expansion: handle grace periods)
    
    return {
        'missed_count': missed_tasks.count(),
        'reminders_sent': urgent_windows.count()
    }
