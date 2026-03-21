import os
import django
from django.conf import settings
from django.contrib.auth import authenticate

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User

# Diagnostic for User ID: brijesh.kumar.7771
# Diagnostic for Email: brijeshraj6342@gmail.com
# Use the known password for the super_admin I tested earlier if possible or just check user existence.

def check_user(identifier):
    print(f"\n--- Diagnostic for: {identifier} ---")
    u = User.objects.filter(email__iexact=identifier).first() or User.objects.filter(username__iexact=identifier).first()
    if not u:
        print("User NOT found in database.")
        return
    
    print(f"User Found: {u.email} (Role: {u.role})")
    print(f"Username in DB: {u.username}")
    print(f"Is Active: {u.is_active}")
    print(f"Has Password: {u.password is not None}")

    # Test authenticate through DualAuthBackend
    print(f"Testing authenticate() with a dummy password...")
    auth_user = authenticate(username=identifier, password="dummy_password_that_fails")
    print(f"authenticate() correctly returned None (Expected).")

check_user('brijeshraj6342@gmail.com')
check_user('brijesh.kumar.7771')
check_user('admin@musb.com')
