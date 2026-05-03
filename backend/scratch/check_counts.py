
import os
import django
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study, Participant
from authentication.models import User
print(f"Studies count: {Study.objects.count()}")
print(f"Participants count: {Participant.objects.count()}")
print(f"Users count: {User.objects.count()}")
