import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study

def list_studies():
    studies = Study.objects.all()
    print(f"Total studies: {studies.count()}")
    for s in studies:
        print(f" - {s.protocol_id}: {s.title}")

if __name__ == "__main__":
    list_studies()
