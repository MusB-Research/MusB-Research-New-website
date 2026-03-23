import os, sys, django
sys.path.append('d:\\MusB Research Website-1\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from django.contrib.auth import authenticate

username = 'brijesh.kumar.7771'
# password? I don't know it. But I can't test without it.
# I'll try to find a user with a known password.
# Or I'll set a known password for this user.

u = User.objects.filter(username=username).first()
if u:
    u.set_password('TestPassword123!')
    u.save()
    print(f"Password set for {username}")
    
    # Test our login_view logic
    login_id = username.strip().lower()
    db_user = User.objects.filter(username__iexact=login_id).first()
    if db_user and db_user.check_password('TestPassword123!'):
        print("Login logic PASSED locally!")
    else:
        print("Login logic FAILED locally!")
else:
    print(f"User {username} not found")
