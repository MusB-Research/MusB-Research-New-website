import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings as django_settings
from pymongo import MongoClient

print("Updating FacilitiesPageSettings...")
from api.models import FacilitiesPageSettings
settings, created = FacilitiesPageSettings.objects.get_or_create(pk='000000000000000000000001')
settings.research_pillar_title = "Research & Innovation"
settings.research_pillar_desc = "Preclinical and clinical infrastructure to validate mechanisms, efficacy, and safety with speed and rigor."
settings.save()
print("Settings updated.")

print("Connecting to MongoDB to insert directly...")
try:
    if 'CLIENT' in django_settings.DATABASES['default']:
        host = django_settings.DATABASES['default']['CLIENT']['host']
    else:
        host = django_settings.DATABASES['default'].get('HOST', 'mongodb://localhost:27017/')
    
    dbname = django_settings.DATABASES['default']['NAME']
    client = MongoClient(host)
    db = client[dbname]
    
    print("Deleting old Research modules...")
    db.api_facilitymodule.delete_many({"pillar": "Research"})
    
    modules_data = [
        {
            "pillar": "Research",
            "title": "Cell Culture Facility 🧫",
            "one_line_summary": "Advanced in vitro platforms for mechanistic and safety screening.",
            "description": "Our Cell Culture Facility provides high-throughput in vitro testing environments for primary cells and established cell lines. Optimized for drug discovery and safety assessments, our SOP-driven workflows ensure high reproducibility and translational value for sponsors.",
            "micro_bullets": [
                "Mammalian & microbial cell lines",
                "Dose-response & safety screening",
                "Mechanistic pathways",
                "Translational decision support"
            ],
            "badge_label": "Preclinical Platform",
            "layout": "TextLeft",
            "display_order": 1,
            "is_active": True,
            "slug": "cell-culture",
            "image": ""
        },
        {
            "pillar": "Research",
            "title": "Microbiology Culture Facility 🦠",
            "one_line_summary": "Controlled aerobic and anaerobic microbial research capabilities.",
            "description": "Our Microbiology Culture Facility offers comprehensive aerobic and anaerobic testing environments. We support functional screening, antimicrobial testing, and strain optimization to advance microbiome R&D, ensuring reliable data generation for complex microbial research.",
            "micro_bullets": [
                "Aerobic/anaerobic culture",
                "Functional screening",
                "Antimicrobial testing",
                "Strain optimization"
            ],
            "badge_label": "Microbiome R&D",
            "layout": "ImageLeft",
            "display_order": 2,
            "is_active": True,
            "slug": "microbiology",
            "image": ""
        },
        {
            "pillar": "Research",
            "title": "C. elegans Research Platform 🪱",
            "one_line_summary": "Rapid in vivo screening for aging, metabolism, and neurobiology.",
            "description": "Our C. elegans Research Platform provides a robust in vivo model for rapid biological screening. Specializing in lifespan, healthspan, and stress resistance assays, we deliver early proof-of-concept data for aging, metabolism, and neurobiology studies with exceptional efficiency.",
            "micro_bullets": [
                "Lifespan & healthspan screening",
                "Stress resistance",
                "Metabolic endpoints",
                "Early proof-of-concept"
            ],
            "badge_label": "Rapid Screening",
            "layout": "TextLeft",
            "display_order": 3,
            "is_active": True,
            "slug": "celegans",
            "image": ""
        },
        {
            "pillar": "Research",
            "title": "Animal Studies Facility 🐁",
            "one_line_summary": "Ethically approved preclinical efficacy and safety studies.",
            "description": "Our ethical Animal Studies Facility supports rigorous preclinical efficacy and safety testing. We offer established models for metabolic disorders, aging, inflammation, and gut-brain axis research, all conducted under strict SOPs to ensure reproducibility and compliance.",
            "micro_bullets": [
                "Efficacy, safety, PD endpoints",
                "Metabolic, aging, inflammation models",
                "Gut–brain axis models",
                "SOP-driven reproducibility"
            ],
            "badge_label": "IACUC-aligned / Ethical Research",
            "layout": "ImageLeft",
            "display_order": 4,
            "is_active": True,
            "slug": "animal-studies",
            "image": ""
        },
        {
            "pillar": "Research",
            "title": "Clinical Trials Facility 🏥",
            "one_line_summary": "Participant-friendly, GCP-compliant clinical research site.",
            "description": "Our GCP-compliant Clinical Trials Facility is designed for optimal participant experience and rigorous data collection. From seamless recruitment and sample collection to comprehensive monitoring, we ensure high-quality clinical evidence generation for your therapeutic programs.",
            "micro_bullets": [
                "Recruitment & visits",
                "Sample collection",
                "Monitoring & data integrity",
                "Participant-first experience"
            ],
            "badge_label": "GCP-aligned / IRB-ready",
            "layout": "TextLeft",
            "display_order": 5,
            "is_active": True,
            "slug": "clinical-trials",
            "image": ""
        }
    ]
    
    db.api_facilitymodule.insert_many(modules_data)
    print("Successfully inserted raw MongoDB docs with unique slugs!")
except Exception as e:
    print("MongoDB direct insert failed:", e)
    traceback.print_exc()

print("Done.")
