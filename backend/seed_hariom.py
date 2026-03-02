import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import TeamMember

def seed_hariom():
    print("Adding Dr. Hariom Yadav to TeamMember...")
    
    # summarized bio for the main card (punchy 100-150 words)
    short_bio = (
        "Dr. Hariom Yadav, Co-Founder of MusB Research, is a globally recognized translational scientist with over 25 years "
        "of transformative experience in microbiome and biotics research. His work centers on translating cutting-edge "
        "discoveries into clinically validated solutions for metabolic health, longevity, and the gut–brain axis."
    )
    
    # full bio for the expanded view
    full_bio = (
        "Dr. Hariom Yadav is Co-Founder of MusB Research and a globally recognized translational scientist with more than 25 years "
        "of transformative experience in microbiome and biotics research. He has been trained and conducted research at world-renowned "
        "institutions including the US National Institutes of Health (NIH), Wake Forest School of Medicine, and USF Morsani College of Medicine. "
        "His work centers on translating cutting-edge discoveries into clinically validated solutions for metabolic health, longevity, and the gut–brain axis.\n\n"
        "Dr. Yadav has led pioneering programs investigating probiotics and postbiotics in aging biology, metabolic disorders, cognitive decline, "
        "leaky gut, and systemic inflammation (inflammaging). His expertise supports a rigorous, evidence-based scientific platform for the validation "
        "of natural products, positioning MusB Research as an extended R&D arm for industry partners, ensuring scientific excellence, "
        "regulatory readiness, and strong consumer confidence."
    )
    
    TeamMember.objects.update_or_create(
        name="Dr. Hariom Yadav",
        defaults={
            "role": "Co-Founder",
            "bio": short_bio,
            "expanded_bio": full_bio,
            "linkedin_url": "https://www.linkedin.com/in/yadavhariom/",
            "expertise_tags": ["Microbiome", "Metabolic Health", "Longevity", "Gut-Brain Axis"],
            "areas_of_expertise": [
                "Microbiome Research", "Probiotics & Postbiotics", "Aging Biology", 
                "Metabolic Disorders", "Cognitive Decline", "Leaky Gut", "Systemic Inflammation"
            ],
            "affiliations": [
                "National Institutes of Health (NIH)", 
                "Wake Forest School of Medicine", 
                "USF Morsani College of Medicine"
            ],
            "display_order": 2,
            "is_active": True
        }
    )
    print("Successfully added Dr. Hariom Yadav.")

if __name__ == "__main__":
    seed_hariom()
