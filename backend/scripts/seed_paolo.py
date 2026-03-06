import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Advisor

def seed_paolo():
    print("Adding Dr. Paulo Binetti to Advisor...")
    
    full_bio = (
        "Paolo Binetti is one of the top contributors of VitaDAO, a web3 organization funding longevity drug discovery. "
        "He is also an advisor for LongGame, a longevity biotech VC, a venture fellow for Healthspan Capital, another "
        "longevity biotech VC, as well as a biotech expert for Capital Cell, a crowd equity platform. Previously he "
        "held positions in strategy, business development, portfolio management, and program management, in industry and government.\n\n"
        "Born and raised in Milano, Italy, Paolo holds a PhD in controls, robotics and bioengineering from the University "
        "of Pisa, a MS in aerospace engineering from Politecnico di Milano, a specialization in bioinformatics from the "
        "University of California San Diego, a certificate in drug discovery and development from Harvard Medical School, "
        "and a certificate in venture finance from the University of Oxford."
    )
    
    Advisor.objects.update_or_create(
        name="Dr. Paulo Binetti",
        defaults={
            "advisory_role": "Business Development Advisory Board Member",
            "expertise_area": "Bioengineering & Venture Finance",
            "organization": "VitaDAO / LongGame",
            "bio": full_bio,
            "image": "advisors/paolo_binetti.jpg",
            "linkedin_url": "https://www.linkedin.com/in/paolo-binetti-1a3a991/",
            "display_order": 5,
            "is_active": True
        }
    )
    print("Successfully added Dr. Paulo Binetti.")

if __name__ == "__main__":
    seed_paolo()
