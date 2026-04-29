import os
import sys
import django

# Set up Django environment
sys.path.append(r'c:\Users\baren\OneDrive\Desktop\MusB Research Website-1\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from authentication.views.auth import login_view
from api.views import FacilityInquiryView

print("Successfully imported login_view and FacilityInquiryView")

# Check if FacilityInquiryView has get and post methods
view = FacilityInquiryView()
if hasattr(view, 'get') and hasattr(view, 'post'):
    print("FacilityInquiryView has both get and post methods.")
else:
    print("Error: FacilityInquiryView is missing methods.")
    if not hasattr(view, 'get'): print("Missing 'get'")
    if not hasattr(view, 'post'): print("Missing 'post'")

print("Verification complete.")
