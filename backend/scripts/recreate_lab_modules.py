import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings as django_settings
from pymongo import MongoClient

print("Updating FacilitiesPageSettings for Lab Pillar...")
from api.models import FacilitiesPageSettings
settings, created = FacilitiesPageSettings.objects.get_or_create(pk='000000000000000000000001')
settings.lab_pillar_title = "Central Laboratory Services"
settings.lab_pillar_desc = "Reliable, scalable biomarker and molecular testing with sponsor-ready workflows and documentation."
settings.save()
print("Settings updated.")

print("Connecting to MongoDB to insert Lab modules directly...")
try:
    if 'CLIENT' in django_settings.DATABASES['default']:
        host = django_settings.DATABASES['default']['CLIENT']['host']
    else:
        host = django_settings.DATABASES['default'].get('HOST', 'mongodb://localhost:27017/')
    
    dbname = django_settings.DATABASES['default']['NAME']
    client = MongoClient(host)
    db = client[dbname]
    
    print("Deleting old Lab modules...")
    db.api_facilitymodule.delete_many({"pillar": "Lab"})
    
    modules_data = [
        {
            "pillar": "Lab",
            "title": "Clinical Testing 🧪",
            "one_line_summary": "Research-grade and diagnostic testing through accredited labs.",
            "description": "Our Clinical Testing services provide essential, research-grade, and diagnostic insights. We seamlessly integrate metabolic, inflammatory, and hormonal panels into your trials, backed by sponsor-grade documentation from our fully accredited laboratory partners.",
            "micro_bullets": [
                "Metabolic, inflammatory, hormonal panels",
                "Disease-relevant biomarkers",
                "Integrated into trials",
                "Sponsor-grade documentation"
            ],
            "badge_label": "CLIA/COLA Partner",
            "layout": "TextLeft",
            "display_order": 1,
            "is_active": True,
            "slug": "clinical-testing",
            "image": ""
        },
        {
            "pillar": "Lab",
            "title": "ELISA & Proteomics 📊",
            "one_line_summary": "High-sensitivity protein and biomarker quantification.",
            "description": "Leverage our ELISA & Proteomics core for high-sensitivity quantification of cytokines, hormones, and growth factors. We deliver critical outcome assessments and mechanistic validation to support commercialization-ready evidence packages.",
            "micro_bullets": [
                "Cytokines, hormones, growth factors",
                "Outcome assessments",
                "Mechanistic validation",
                "Commercialization-ready evidence"
            ],
            "badge_label": "Biomarker Core",
            "layout": "ImageLeft",
            "display_order": 2,
            "is_active": True,
            "slug": "elisa-proteomics",
            "image": ""
        },
        {
            "pillar": "Lab",
            "title": "Real-Time PCR 🧬",
            "one_line_summary": "High-precision gene and microbial quantification.",
            "description": "Our Molecular Core utilizes state-of-the-art Real-Time PCR (qPCR) for the high-precision quantification of gene expression and microbial targets. We ensure high sensitivity and reproducibility for all your translational endpoints with regulatory-ready reporting.",
            "micro_bullets": [
                "Gene expression and microbial targets",
                "High sensitivity & reproducibility",
                "Translational endpoints",
                "Regulatory-ready reporting"
            ],
            "badge_label": "Molecular Core",
            "layout": "TextLeft",
            "display_order": 3,
            "is_active": True,
            "slug": "real-time-pcr",
            "image": ""
        },
        {
            "pillar": "Lab",
            "title": "Microbiome Analysis 🌐",
            "one_line_summary": "End-to-end microbiome sequencing and interpretation.",
            "description": "Access end-to-end microbiome solutions through our Omics & Bioinformatics core. From diversity and taxonomy profiling to complex functional pathway tracking, we provide the host-microbe interaction insights necessary for both preclinical and clinical integration.",
            "micro_bullets": [
                "Diversity & taxonomy",
                "Functional pathways",
                "Host–microbe interaction insights",
                "Preclinical + clinical integration"
            ],
            "badge_label": "Omics & Bioinformatics",
            "layout": "ImageLeft",
            "display_order": 4,
            "is_active": True,
            "slug": "microbiome-analysis",
            "image": ""
        },
        {
            "pillar": "Lab",
            "title": "Microscopy 🔬",
            "one_line_summary": "Cellular and microbial visualization for validation studies.",
            "description": "Our Imaging Core offers advanced microscopy for morphological assessment and experimental validation. We provide the crucial imaging-based evidence needed to support your mechanistic hypotheses and cellular visualization requirements.",
            "micro_bullets": [
                "Morphology assessment",
                "Experimental validation",
                "Mechanistic support",
                "Imaging-based evidence"
            ],
            "badge_label": "Imaging Core",
            "layout": "TextLeft",
            "display_order": 5,
            "is_active": True,
            "slug": "microscopy",
            "image": ""
        }
    ]
    
    db.api_facilitymodule.insert_many(modules_data)
    print("Successfully inserted raw MongoDB docs for Lab Pillar!")
except Exception as e:
    print("MongoDB direct insert failed:", e)
    traceback.print_exc()

print("Done.")
