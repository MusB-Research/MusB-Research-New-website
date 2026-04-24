import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
try:
    django.setup()
    print("Django setup successful")
except Exception as e:
    print(f"Django setup failed: {e}")
    import traceback
    traceback.print_exc()
