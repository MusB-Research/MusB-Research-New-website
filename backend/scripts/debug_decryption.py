import os
import django
from cryptography.fernet import Fernet
import base64

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from authentication.security import get_cipher

user = User.objects.filter(email='khelegafrefire12@gmail.com').first()
if user:
    token = user.full_name
    print(f"Token: {token}")
    cipher = get_cipher()
    try:
        dec = cipher.decrypt(token.encode()).decode()
        print(f"Success! Decrypted: {dec}")
    except Exception as e:
        print(f"Failed! Error: {type(e).__name__}: {str(e)}")
else:
    print("User not found")
