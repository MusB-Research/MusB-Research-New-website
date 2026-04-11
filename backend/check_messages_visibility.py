import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from api.models import StudyAssignment, ClinicalConversation

def check_user():
    # Assuming there's a user logged in, let's just check the first coordinator
    user = User.objects.filter(role='COORDINATOR').first()
    if not user:
        print("No coordinator found")
        return
    
    print(f"User: {user.email}, Role: {user.role}")
    assignments = StudyAssignment.objects.filter(user=user)
    print(f"Assignments count: {assignments.count()}")
    for a in assignments:
        print(f" - Assigned to Study: {a.study.protocol_id}")
    
    convs = ClinicalConversation.objects.filter(study__assignments__user=user).distinct()
    print(f"Visible conversations: {convs.count()}")

if __name__ == "__main__":
    check_user()
