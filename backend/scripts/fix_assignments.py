import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from api.models import Study, StudyAssignment

# 1. Get or create the sponsor user
sponsor, created = User.objects.get_or_create(
    email='sponsor@musb.com',
    defaults={'full_name': 'Sponsor Admin', 'role': 'SPONSOR', 'is_active': True}
)
if not created:
    sponsor.role = 'SPONSOR'
    sponsor.is_active = True
    sponsor.save()

# 2. Get the study TRIAL-882X
study = Study.objects.filter(protocol_id='TRIAL-882X').first()
if not study:
    study = Study.objects.create(
        protocol_id='TRIAL-882X',
        title='Global Phase III Vaccine Trial',
        sponsor_name='BioPharma Corp',
        status='RECRUITING'
    )

# 3. Assign the sponsor to the study
assignment, created = StudyAssignment.objects.get_or_create(
    study=study,
    user=sponsor,
    defaults={'role': 'SPONSOR_ADMIN'}
)

print(f"Sponsor {sponsor.email} assigned to {study.protocol_id}")
