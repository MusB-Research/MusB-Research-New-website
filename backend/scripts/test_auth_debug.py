import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
import django
django.setup()

from authentication.models import User
import requests

email="admin@musb.com"
password="Password123!"

res = requests.post("http://localhost:8000/api/auth/login/", json={"email": email, "password": password})
print("Login Status:", res.status_code)
token = res.json().get('access')

res = requests.post("http://localhost:8000/api/auth/complete-profile/", json={"first_name": "Test"}, headers={"Authorization": f"Bearer {token}"})
print("Complete Profile Status:", res.status_code)
print(res.text)
