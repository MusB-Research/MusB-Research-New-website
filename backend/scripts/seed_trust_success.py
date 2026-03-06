import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from pymongo import MongoClient

print("Connecting to MongoDB to update Trust Badges and Success Signals...")

try:
    host = settings.DATABASES['default'].get('HOST', 'mongodb://localhost:27017')
    client = MongoClient(host)
    db = client[settings.DATABASES['default']['NAME']]
    
    print("Deleting old Trust Badges and Success Signals...")
    db.api_trustbadge.delete_many({})
    db.api_successsignal.delete_many({})
    
    trust_badges = [
        { "id": 1, "label": "IRB-ready research workflows", "icon": "ClipboardCheck", "display_order": 1, "is_active": True },
        { "id": 2, "label": "GCP-trained staff", "icon": "Users", "display_order": 2, "is_active": True },
        { "id": 3, "label": "HIPAA-aligned data handling", "icon": "Lock", "display_order": 3, "is_active": True },
        { "id": 4, "label": "SOP-driven operations", "icon": "FileText", "display_order": 4, "is_active": True },
        { "id": 5, "label": "CLIA/COLA partner lab support", "icon": "Microscope", "display_order": 5, "is_active": True },
    ]
    
    success_signals = [
        {
            "id": 1,
            "title": "Speed + Scientific Rigor",
            "description": "We balance rapid execution with uncompromised scientific integrity, ensuring your timelines are met without sacrificing data quality.",
            "icon": "Zap",
            "display_order": 1,
            "is_active": True
        },
        {
            "id": 2,
            "title": "Integrated Bench-to-Bedside Execution",
            "description": "Seamlessly transition from preclinical discovery to human clinical trials with our end-to-end infrastructure and expert guidance.",
            "icon": "Layers",
            "display_order": 2,
            "is_active": True
        },
        {
            "id": 3,
            "title": "Transparent Partnership",
            "description": "Whether you are a big pharma or a small biotech innovator, we provide dedicated support, clear communication, and adaptable solutions.",
            "icon": "Handshake",
            "display_order": 3,
            "is_active": True
        }
    ]
    
    db.api_trustbadge.insert_many(trust_badges)
    db.api_successsignal.insert_many(success_signals)
    print("Successfully inserted new badges and signals!")

except Exception as e:
    print("MongoDB direct insert failed:", e)
    traceback.print_exc()

print("Done.")
