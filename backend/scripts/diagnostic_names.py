import os
import django
import sys
from cryptography.fernet import Fernet

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User

def diagnostic():
    key = os.getenv('DATA_ENCRYPTION_KEY')
    print(f"Key: {key}")
    if not key:
        print("No key found!")
        return
    
    cipher = Fernet(key)
    users = User.objects.all()
    for user in users:
        print(f"User: {user.email}")
        full = str(user.full_name)
        if full.startswith('gAAAA'):
            print(f"  Encrypted full_name: {full[:20]}...")
            try:
                dec = cipher.decrypt(full.encode()).decode()
                print(f"  Decrypted: {dec}")
            except Exception as e:
                print(f"  Decryption FAILED: {e}")
        else:
            print(f"  Plain full_name: {full}")

if __name__ == "__main__":
    diagnostic()
