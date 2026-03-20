import os
import django
import bson

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from authentication.security import decrypt_data

for user in User.objects.all():
    print(f"User: {user.email}")
    print(f"  Role: {user.role}")
    print(f"  Full Name (raw): {repr(user.full_name)}")
    print(f"  Decrypted Name:  {repr(user.decrypted_name)}")
    print(f"  First Name (raw): {repr(user.first_name)}")
    print(f"  Last Name (raw):  {repr(user.last_name)}")
    print("-" * 30)
