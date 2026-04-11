import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from api.models import StudyAssignment

def check_demo():
    user = User.objects.filter(email='demo.coordinator@musbresearch.com').first()
    if not user:
        print("User demo.coordinator@musbresearch.com not found")
        # try case insensitive
        user = User.objects.filter(email__iexact='demo.coordinator@musbresearch.com').first()
        
    if user:
        print(f"User: {user.email}, ID: {user.id}")
        ass = StudyAssignment.objects.filter(user=user)
        print(f"Assignments: {ass.count()}")
        for a in ass:
            print(f" - {a.study.protocol_id}")
    else:
        print("User not found at all")

if __name__ == "__main__":
    check_demo()
