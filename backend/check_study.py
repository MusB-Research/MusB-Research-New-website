import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study

def check_study():
    s = Study.objects.filter(protocol_id='MUSB-TES-1672').first()
    if s:
        print(f"Study found: {s.title}")
    else:
        print("Study MUSB-TES-1672 not found")

if __name__ == "__main__":
    check_study()
