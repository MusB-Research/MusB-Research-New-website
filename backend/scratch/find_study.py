
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Study

studies = Study.objects.filter(protocol_id='MUSB-2026-228')
for s in studies:
    print(f"ID: {s.id}, Title: {s.title}, Protocol: {s.protocol_id}")
