import os
from cryptography.fernet import Fernet
from django.conf import settings
import base64

def get_cipher():
    key = os.getenv('DATA_ENCRYPTION_KEY')
    if not key:
        # Fallback to secret key if not set, though unique key is recommended
        # We slice it to 32 bytes and base64 it for Fernet compatibility
        key = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].encode().ljust(32, b'0'))
    return Fernet(key)

def encrypt_data(data):
    if not data:
        return data
    f = get_cipher()
    return f.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data):
    if not encrypted_data:
        return encrypted_data
    try:
        f = get_cipher()
        return f.decrypt(encrypted_data.encode()).decode()
    except Exception:
        # If decryption fails, it might be plain text (for existing data migration)
        return encrypted_data

def get_private_key():
    with open(os.path.join(settings.BASE_DIR, 'private_key.pem'), 'rb') as f:
        return f.read()

def get_public_key():
    with open(os.path.join(settings.BASE_DIR, 'public_key.pem'), 'rb') as f:
        return f.read()

