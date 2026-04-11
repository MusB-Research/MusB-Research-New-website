import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study

def check_study():
    s = Study.objects.filter(protocol_id='MUSB-BTB-100').first()
    if s:
        print(f"Study found: {s.title}, ID: {s.id}")
    else:
        print("Study MUSB-BTB-100 not found")

if __name__ == "__main__":
    check_study()
