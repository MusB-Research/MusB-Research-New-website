import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from pymongo import MongoClient

print("Connecting to MongoDB to insert modules properly with numeric IDs...")

try:
    host = settings.DATABASES['default'].get('HOST', 'mongodb://localhost:27017')
    client = MongoClient(host)
    db = client[settings.DATABASES['default']['NAME']]
    
    print("Deleting ALL existing facility modules...")
    db.api_facilitymodule.delete_many({})
    
    research_modules = [
        {
            "id": 1,
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
            "image": ""
        },
        {
            "id": 2,
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
            "image": ""
        },
        {
            "id": 3,
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
            "image": ""
        },
        {
            "id": 4,
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
            "image": ""
        },
        {
            "id": 5,
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
            "image": ""
        }
    ]
    
    lab_modules = [
        {
            "id": 6,
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
            "image": ""
        },
        {
            "id": 7,
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
            "image": ""
        },
        {
            "id": 8,
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
            "image": ""
        },
        {
            "id": 9,
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
            "image": ""
        },
        {
            "id": 10,
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
            "image": ""
        }
    ]
    
    db.api_facilitymodule.insert_many(research_modules + lab_modules)
    print("Successfully inserted 10 MongoDB docs with auto-increment IDs!")
except Exception as e:
    print("MongoDB direct insert failed:", e)
    traceback.print_exc()

print("Done.")
