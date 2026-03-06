import os
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import AboutPageSettings

def dump_settings():
    try:
        settings = AboutPageSettings.objects.first()
        if not settings:
            print("No settings found in DB.")
            return
            
        data = {
            "pk": str(settings.pk),
            "partner_title": settings.partner_title,
            "partner_content": settings.partner_content,
            "story_content": settings.story_content,
            "three_ways_title": settings.three_ways_title
        }
        print(json.dumps(data, indent=4))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_settings()
