import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import User
from authentication.security import decrypt_data, get_all_ciphers

users = User.objects.all()
for u in users:
    if u.phone_number and str(u.phone_number).startswith('gAAAA'):
        print(f"User: {u.email}")
        print(f"Encrypted phone: {u.phone_number}")
        print(f"Decrypted phone: {decrypt_data(u.phone_number)}")
        print(f"Ciphers count: {len(get_all_ciphers())}")
        break
