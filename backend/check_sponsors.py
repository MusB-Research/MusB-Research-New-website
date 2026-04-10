from django.core.management import execute_from_command_line
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "musb_backend.settings")
    import django
    django.setup()
    from authentication.models import User
    from api.models import SponsorOrganization
    
    print("--- SPONSOR USERS ---")
    for u in User.objects.all():
        if 'sponsor' in str(u.role).lower():
            print(f"Username: {u.username}, Role: {u.role}, Name: {getattr(u, 'full_name', 'N/A')}")
            
    print("\n--- SPONSOR ORGANIZATIONS ---")
    for org in SponsorOrganization.objects.all():
        print(f"ID: {org.id}, Name: {org.name}")
