
import os
import django

# Setup Django environment FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import APIRequestFactory, force_authenticate
from api.views import StudyViewSet
from authentication.models import User

user = User.objects.get(email='admin@musb.com')
factory = APIRequestFactory()
request = factory.get('/api/studies/')
force_authenticate(request, user=user)

view = StudyViewSet.as_view({'get': 'list'})
response = view(request)

print(f"Status: {response.status_code}")
print(f"Data: {response.data}")
