import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Advisor

def seed_peter():
    print("Replacing Advisor (display_order=3) with Peter As Alphonse...")
    
    full_bio = (
        "Peter Alphonse, PhD, CFS\n"
        "Scientific and Regulatory Affairs Consultant, Stelioz Solutions Inc.\n\n"
        "Dr. Peter Alphonse is the Scientific and Regulatory Affairs Consultant at Stelioz Solutions Inc., a "
        "specialized consultancy serving the natural health product, nutraceutical, dietary supplement, "
        "functional food, and veterinary health product sectors. He provides comprehensive regulatory "
        "and scientific leadership, supporting companies from early-stage concept development through "
        "successful market commercialization in Canada and the United States.\n\n"
        "At Stelioz Solutions Inc., (www.steliozsolutions.com) Dr. Alphonse leads Health Canada "
        "NPN and site license applications, FDA food and dietary supplement compliance, GMP and "
        "quality systems implementation, labeling and packaging review, and SFCR licensing. The firm "
        "also offers clinical research strategy, scientific and technical writing, health claim substantiation, "
        "formulation development, analytical testing guidance, and regulatory pathway planning.\n\n"
        "With a PhD in Human Nutritional Sciences and extensive experience in regulatory affairs, "
        "research, and product innovation, Dr. Alphonse is committed to advancing science-based "
        "wellness solutions that meet the highest standards of quality, safety, and compliance."
    )
    
    # Replace the advisor with display_order 3 (Lisa Anderson)
    advisor = Advisor.objects.filter(display_order=3).first()
    if advisor:
        advisor.name = "Peter As Alphonse"
        advisor.advisory_role = "Business Development Advisory Board Member"
        advisor.expertise_area = "Scientific & Regulatory Affairs"
        advisor.organization = "Stelioz Solutions Inc."
        advisor.bio = full_bio
        advisor.image = "advisors/peter_alphonse.jpg" 
        advisor.linkedin_url = "" # User said "pending to be add later"
        advisor.is_active = True
        advisor.save()
        print(f"Successfully updated advisor: {advisor.name}")
    else:
        # Fallback create
        Advisor.objects.create(
            display_order=3,
            name="Peter As Alphonse",
            advisory_role="Business Development Advisory Board Member",
            expertise_area="Scientific & Regulatory Affairs",
            organization="Stelioz Solutions Inc.",
            bio=full_bio,
            image="",
            linkedin_url="",
            is_active=True
        )
        print("Created new advisor for Peter Alphonse at display_order 3.")

if __name__ == "__main__":
    seed_peter()
