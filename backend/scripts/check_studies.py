import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study

studies = Study.objects.all()
data = []
for s in studies:
    data.append({
        'id': str(s.id),
        'title': s.title,
        'protocol_id': s.protocol_id,
        'overview': s.overview,
        'benefit': s.benefit,
        'description': s.description,
        'participation_message': s.participation_message
    })

print(json.dumps(data, indent=2))
