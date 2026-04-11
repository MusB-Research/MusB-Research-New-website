import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study

def check_public():
    VISIBLE_STATUSES = ['RECRUITING', 'ACTIVE', 'UPCOMING']
    qs = Study.objects.filter(
        status__in=VISIBLE_STATUSES,
        is_archived=False
    ).order_by('created_at')
    
    print(f"Public studies count: {qs.count()}")
    for s in qs:
        print(f" - {s.protocol_id} (Status: {s.status}, Archived: {s.is_archived})")

if __name__ == "__main__":
    check_public()
