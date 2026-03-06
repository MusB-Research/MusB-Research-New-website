from django.db import connection
from bson import ObjectId

db = connection.cursor().connection.get_database()
collection = db['api_researchcapability']

capabilities_data = [
    {
        "title": "Clinical Trials",
        "description": "Phase I–IV, natural products, devices",
        "icon": "activity"
    },
    {
        "title": "Preclinical Research",
        "description": "In vitro and animal models",
        "icon": "test-tube"
    },
    {
        "title": "Microbiome, Biotics & Omics",
        "description": "Integrated analysis of microbial systems",
        "icon": "leaf"
    },
    {
        "title": "Nutrition & Natural Products",
        "description": "Evidence-based validation of natural ingredients",
        "icon": "flower"
    },
    {
        "title": "Aging, Metabolic & Brain Health",
        "description": "Specialized therapeutic focus areas",
        "icon": "brain"
    },
    {
        "title": "Leaky Gut, Inflammation, Skin & Women’s Health",
        "description": "Comprehensive wellness research",
        "icon": "heart-pulse"
    },
    {
        "title": "Immunomodulatory Research",
        "description": "Immune system function and response",
        "icon": "shield-check"
    },
    {
        "title": "Muscle, Gut, Skin & Vascular Health",
        "description": "Multi-organ systems biology",
        "icon": "zap"
    },
    {
        "title": "Toxicology & Bioavailability",
        "description": "Safety and pharmacokinetics",
        "icon": "beaker"
    },
    {
        "title": "Biostatistics & Data Science",
        "description": "Rigorous data analysis and interpretation",
        "icon": "bar-chart"
    },
    {
        "title": "Regulatory Compliance Support",
        "description": "Sponsor-ready documentation and strategy",
        "icon": "file-text"
    }
]

# Clear collection
collection.delete_many({})

for idx, data in enumerate(capabilities_data):
    oid = ObjectId()
    collection.insert_one({
        '_id': oid,
        'id': oid, # Map id to _id value to satisfy unique index
        'title': data["title"],
        'description': data["description"],
        'icon': data["icon"],
        'display_order': (idx + 1) * 10,
        'is_active': True
    })

print(f"Successfully seeded {len(capabilities_data)} capabilities via direct MongoDB driver.")
