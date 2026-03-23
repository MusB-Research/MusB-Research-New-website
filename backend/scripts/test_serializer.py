import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User

# CASE INSENSITIVE find
user = User.objects.filter(full_name__icontains='GAAAAABPU4').first()
if user:
    print(f"User: {user.email}")
    print(f"Name: {user.full_name}")
    print(f"Decrypted: {user.decrypted_name}")
else:
    print("Not found")
