import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from authentication.security import decrypt_data, encrypt_data

users = User.objects.all()
fixed_count = 0

for user in users:
    name = user.full_name
    if name and ' ' in name and name.count('gAAAA') > 1:
        print(f"Fixing corrupted name for {user.email}")
        # Re-derive from decrypted first/last if possible
        d_first = user.decrypted_first_name if hasattr(user, 'decrypted_first_name') else decrypt_data(user.first_name)
        d_last = user.decrypted_last_name if hasattr(user, 'decrypted_last_name') else decrypt_data(user.last_name)
        
        if d_first and d_last:
            new_full = f"{d_first} {d_last}"
            user.full_name = encrypt_data(new_full)
            user.save(update_fields=['full_name'])
            fixed_count += 1
            print(f"  -> Fixed: {new_full}")

print(f"Total users checked: {len(users)}")
print(f"Total users fixed: {fixed_count}")
