import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import FacilityModule

modules = [{'title': m.title, 'desc': m.description} for m in FacilityModule.objects.filter(pillar='Research')]
with open('research_modules_dump.json', 'w') as f:
    json.dump(modules, f, indent=4)
