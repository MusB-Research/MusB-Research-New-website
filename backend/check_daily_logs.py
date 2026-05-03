import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import DailyMedicationLog, Participant

def check_logs():
    logs = DailyMedicationLog.objects.all()
    print(f"Total DailyMedicationLog entries: {logs.count()}")
    for log in logs[:10]:
        print(f"Log ID: {log.id}, Participant: {log.participant.participant_sid}, Date: {log.date}, Draft: {log.is_draft}")

if __name__ == "__main__":
    check_logs()
