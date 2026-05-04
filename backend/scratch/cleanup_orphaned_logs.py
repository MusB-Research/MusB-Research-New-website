import os, sys, django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Participant, DailyMedicationLog

valid_p_ids = set(Participant.objects.values_list('id', flat=True))
all_logs = DailyMedicationLog.objects.all()
deleted_count = 0

for log in all_logs:
    if log.participant_id not in valid_p_ids:
        print(f"Deleting orphaned log: {log.id} for participant ID: {log.participant_id}")
        log.delete()
        deleted_count += 1

print(f"Cleanup complete. Deleted {deleted_count} orphaned daily logs.")
