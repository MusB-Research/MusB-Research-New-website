import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import TeamMember

def seed_shalini():
    print("Adding Dr. Shalini Jain to TeamMember...")
    
    # summarized bio for the main card (estimated 100-150 wordsish, but keeping it punchy)
    short_bio = (
        "Dr. Shalini Jain, CEO and Co-Founder of MusB Research, is a seasoned translational scientist with over 24 years "
        "of experience in biotics, functional foods, and microbiome research. Her scientific expertise integrates basic science, "
        "mechanistic biology, and clinical translation to transform laboratory discoveries into real-world health solutions."
    )
    
    # full bio for the expanded view
    full_bio = (
        "Dr. Shalini Jain is CEO and Co-Founder of MusB Research and a seasoned translational scientist with more than 24 years "
        "of experience in biotics, functional foods, and microbiome research. She received her training from the National Dairy "
        "Research Institute and conducted advanced research at globally respected institutions including the University of Illinois "
        "Urbana-Champaign, the US National Institutes of Health (NIH), Wake Forest School of Medicine, and USF Morsani College of Medicine.\n\n"
        "Her scientific expertise spans microbiome science, immunology, brain health, women’s health, cancer, metabolic disorders, "
        "diabetes, obesity, nutrition, and environmental toxicants. Dr. Jain has led multidisciplinary research programs integrating "
        "basic science, mechanistic biology, and clinical translation.\n\n"
        "She is deeply committed to transforming laboratory discoveries into real-world health solutions. With a strong vision for "
        "industry collaboration, she has built MusB Research as a high-quality scientific platform that supports rigorous, "
        "evidence-based validation of natural products. Her goal is to position MusB Research as an extended R&D arm for industry "
        "partners, ensuring scientific excellence, regulatory readiness, and strong consumer confidence."
    )
    
    TeamMember.objects.update_or_create(
        name="Dr. Shalini Jain",
        defaults={
            "role": "CEO and Co-Founder",
            "bio": short_bio,
            "expanded_bio": full_bio,
            "image": "team/shalini_jain.JPG",
            "linkedin_url": "https://www.linkedin.com/in/shaliniscientist/",
            "expertise_tags": ["Microbiome Science", "Immunology", "Clinical Translation", "Biotics"],
            "areas_of_expertise": [
                "Microbiome Science", "Immunology", "Brain Health", "Women's Health", 
                "Cancer", "Metabolic Disorders", "Diabetes", "Obesity", "Nutrition", "Environmental Toxicants"
            ],
            "affiliations": [
                "National Dairy Research Institute", 
                "University of Illinois Urbana-Champaign", 
                "National Institutes of Health (NIH)", 
                "Wake Forest School of Medicine", 
                "USF Morsani College of Medicine"
            ],
            "display_order": 1,
            "is_active": True
        }
    )
    print("Successfully added Dr. Shalini Jain.")

if __name__ == "__main__":
    seed_shalini()
