import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from django.contrib.contenttypes.models import ContentType
from django.apps import apps

print("Checking ContentTypes...")
for app_config in apps.get_app_configs():
    for model in app_config.get_models():
        try:
            ct = ContentType.objects.get_for_model(model)
            if not ct.pk:
                print(f"!!! Error: ContentType for {model.__name__} has NO PK!")
            else:
                print(f"OK: {model.__name__} -> {ct.pk}")
        except Exception as e:
            print(f"!!! Exception for {model.__name__}: {e}")
