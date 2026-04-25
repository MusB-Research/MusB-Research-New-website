
import os
import sys
import django
import json

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Participant

try:
    p = Participant.objects.get(id='69ead38768dc13726d924f2c')
    print(f"ID: {p.id}")
    print(f"SID: {p.participant_sid}")
    print(f"Status: {p.status}")
    print(f"Study: {p.study.title if p.study else 'None'}")
    print(f"Approval Status: {p.approval_status}")
except Exception as e:
    print(f"Error: {e}")
