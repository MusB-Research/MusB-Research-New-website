import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User

with open('user_dump_out.txt', 'w') as f:
    for user in User.objects.all():
        f.write(f"Email: {user.email}\n")
        f.write(f"Raw: {user.full_name}\n")
        f.write(f"Dec: {user.decrypted_name}\n")
        f.write("----------------\n")
