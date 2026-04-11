import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User

def normalize_roles():
    users = User.objects.all()
    count = 0
    for user in users:
        old_role = user.role
        if old_role and old_role != old_role.upper():
            user.role = old_role.upper()
            user.save()
            print(f"Updated user {user.email}: {old_role} -> {user.role}")
            count += 1
    print(f"Finished. Normalized {count} users.")

if __name__ == "__main__":
    normalize_roles()
