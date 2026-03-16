
import os
import django
import sys

# Add the project directory to sys.path
sys.path.append(r'd:\MusB Research Website-1\backend')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')

# Initialize Django
django.setup()

from authentication.models import User

users = User.objects.all()
with open('users_list.txt', 'w') as f:
    for u in users:
        f.write(f"Email: {u.email}, Role: {u.role}, Active: {u.is_active}\n")
