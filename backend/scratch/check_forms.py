
import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Participant, Form

p = Participant.objects.get(id='69ead38768dc13726d924f2c')
required_forms = Form.objects.filter(study=p.study, is_required_on_enrollment=True)
print(f"Required Forms: {required_forms.count()}")
for f in required_forms:
    print(f" - {f.title}")
