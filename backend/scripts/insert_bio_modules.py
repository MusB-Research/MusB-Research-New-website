import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from pymongo import MongoClient

print("Connecting to MongoDB to insert Biorepository modules...")

try:
    host = settings.DATABASES['default'].get('HOST', 'mongodb://localhost:27017')
    client = MongoClient(host)
    db = client[settings.DATABASES['default']['NAME']]
    
    # Update Page Settings
    from api.models import FacilitiesPageSettings
    page_settings, _ = FacilitiesPageSettings.objects.get_or_create(pk='000000000000000000000001')
    page_settings.bio_pillar_title = "Biorepository"
    page_settings.bio_pillar_desc = "Secure biospecimen processing, tracking, and storage to protect your samples and your future discoveries."
    page_settings.save()
    
    print("Deleting old Biorepository modules...")
    db.api_facilitymodule.delete_many({"pillar": "Biorepository"})
    
    bio_modules = [
        {
            "id": 11,
            "pillar": "Biorepository",
            "title": "Biorepository 🧊",
            "one_line_summary": "Secure, compliant biospecimen storage and tracking.",
            "description": "Our Biorepository provides secure, compliant storage and tracking for all your critical biospecimens. From blood and tissue derivatives to complex microbial samples, we manage the entire lifecycle with strict chain-of-custody protocols.",
            "micro_bullets": [
                "Blood, stool, urine, saliva, derivatives",
                "Processing, labeling, tracking",
                "Controlled storage conditions",
                "Retrieval + chain-of-custody support"
            ],
            "badge_label": "Chain-of-Custody Ready",
            "layout": "TextLeft",
            "display_order": 1,
            "is_active": True,
            "image": ""
        }
    ]
    
    db.api_facilitymodule.insert_many(bio_modules)
    print("Successfully inserted Biorepository docs!")
except Exception as e:
    print("MongoDB direct insert failed:", e)
    traceback.print_exc()

print("Done.")
