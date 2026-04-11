import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study

def check_btb():
    s = Study.objects.filter(protocol_id='MUSB-BTB-1001').first()
    if s:
        print(f"ID: {s.id}")
        print(f"Protocol ID: {s.protocol_id}")
        print(f"Title: {s.title}")
        print(f"Status: {s.status}")
        print(f"Is Archived: {s.is_archived}")
        print(f"Created At: {s.created_at}")
    else:
        print("Study not found.")

if __name__ == "__main__":
    check_btb()
