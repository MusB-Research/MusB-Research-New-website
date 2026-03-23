import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User, AuditLog
from api.models import Participant, StudyAssignment, Study

print("--- RECENT AUDIT LOGS ---")
logs = AuditLog.objects.all().order_by('-timestamp')[:10]
for log in logs:
    print(f"{log.timestamp} | {log.action} | {log.user_email} | {log.detail}")

print("\n--- USERS ---")
for user in User.objects.all():
    print(f"ID: {user.id} | Email: {user.email} | Role: {user.role} | Active: {user.is_active}")

print("\n--- STUDY ASSIGNMENTS ---")
for sa in StudyAssignment.objects.all():
    print(f"User: {sa.user.email} | Study: {sa.study.protocol_id} | Role: {sa.role}")

print("\n--- PARTICIPANT COUNT ---")
print(f"Total Participants: {Participant.objects.count()}")
