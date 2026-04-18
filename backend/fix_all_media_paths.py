import os
import django
from django.apps import apps
from django.db import models

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

def find_double_media():
    found_any = False
    for model in apps.get_models():
        try:
            file_fields = [f.name for f in model._meta.fields if isinstance(f, (models.FileField, models.ImageField))]
            if not file_fields:
                continue
            
            for obj in model.objects.all():
                for field_name in file_fields:
                    field = getattr(obj, field_name)
                    if field and field.name and field.name.startswith('media/'):
                        print(f"FOUND: Model={model.__name__}, ID={obj.pk}, Field={field_name}, Value={field.name}")
                        # Automatically fix it
                        field.name = field.name[6:]
                        obj.save()
                        print(f"  -> FIXED to: {field.name}")
                        found_any = True
        except Exception as e:
            # Skip models that might not have a table (abstract etc)
            pass
    
    if not found_any:
        print("No double media prefixes found.")

if __name__ == "__main__":
    find_double_media()
