import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User

def check_users():
    users = User.objects.all().order_by('-profile_completed')
    print(f"{'Email':<30} | {'Role':<15} | {'Profile Completed':<15}")
    print("-" * 65)
    for user in users:
        print(f"{user.email:<30} | {user.role:<15} | {user.profile_completed}")

if __name__ == "__main__":
    check_users()
