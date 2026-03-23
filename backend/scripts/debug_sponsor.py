import os
import django
import sys

# Setup Django environment
sys.path.append('d:\\MusB Research Website-1\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.models import User
from api.models import Study, StudyAssignment

user = User.objects.filter(email='sponsor@musb.com').first()
if user:
    print(f"User: {user.email}, Role: {user.role}, Is Authenticated: {user.is_authenticated}")
    assignments = StudyAssignment.objects.filter(user=user)
    print(f"Assignments count: {assignments.count()}")
    for a in assignments:
        print(f" - Study: {a.study.title}, Role: {a.role}")
    
    # Check what StudyViewSet.get_queryset would return
    from api.views import StudyViewSet
    from rest_framework.test import APIRequestFactory
    
    factory = APIRequestFactory()
    request = factory.get('/api/studies/')
    request.user = user
    
    view = StudyViewSet()
    view.request = request
    qs = view.get_queryset()
    print(f"ViewSet returns {qs.count()} studies:")
    for s in qs:
        print(f" - {s.title}")
else:
    print("User sponsor@musb.com not found")
