import os
import django
import sys

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from authentication.security import decrypt_data

def decrypt_all_names():
    print("Starting name decryption script...")
    users = User.objects.all()
    count = 0
    for user in users:
        updated = False
        
        # Original fields
        first = str(user.first_name)
        last = str(user.last_name)
        full = str(user.full_name)
        middle = str(user.middle_name) if user.middle_name else ""

        if first.startswith('gAAAA'):
            user.first_name = decrypt_data(first)
            updated = True
        
        if last.startswith('gAAAA'):
            user.last_name = decrypt_data(last)
            updated = True
        
        if full.startswith('gAAAA'):
            user.full_name = decrypt_data(full)
            updated = True
            
        if middle.startswith('gAAAA'):
            user.middle_name = decrypt_data(middle)
            updated = True

        if updated:
            # We use save() which now NO LONGER encrypts these fields
            user.save()
            print(f"Decrypted name for: {user.email} -> {user.full_name}")
            count += 1
    
    print(f"Finished. Decrypted {count} users.")

if __name__ == "__main__":
    decrypt_all_names()
