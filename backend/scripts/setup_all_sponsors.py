import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from api.models import Study, StudyAssignment

def setup_user(email):
    user, created = User.objects.get_or_create(
        email=email,
        defaults={'full_name': 'Sponsor Admin', 'role': 'SPONSOR', 'is_active': True}
    )
    if not created:
        user.role = 'SPONSOR'
        user.is_active = True
        user.save()
    
    # Set a simple password for testing if not set
    if created or not user.has_usable_password():
        user.set_password('Sponsor123!')
        user.save()
    
    # Assign to study
    study = Study.objects.filter(protocol_id='TRIAL-882X').first()
    if study:
        StudyAssignment.objects.get_or_create(
            study=study,
            user=user,
            defaults={'role': 'SPONSOR_ADMIN'}
        )
    print(f"User {email} is ready.")

setup_user('sponsor@musb.com')
setup_user('sponsor@musbresearch.com')
