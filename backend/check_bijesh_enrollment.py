import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Participant
from authentication.models import User

def check_bijesh():
    user = User.objects.filter(full_name__icontains='Bijesh').first()
    if not user:
        print("User not found.")
        return
        
    print(f"User: {user.email} (ID: {user.id})")
    parts = Participant.objects.filter(user=user)
    print(f"Total participant records: {parts.count()}")
    for p in parts:
        print(f" - {p.study.protocol_id} ({p.study.title}): Status={p.status}, Created={p.created_at}")

if __name__ == "__main__":
    check_bijesh()
