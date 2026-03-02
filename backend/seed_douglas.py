import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Advisor

def seed_douglas():
    print("Replacing Advisor (display_order=1) with Douglas Lynch...")
    
    full_bio = (
        "DOUGLAS LYNCH is an award-winning, global sales/marketing executive with over three decades of experience commercializing "
        "supplements, functional foods, medical foods, cosmeceuticals, animal health, and proprietary bioactive ingredients. He combines "
        "C-suite, omni-channel sales and marketing leadership, with IP-portfolio management expertise. Douglas has developed hundreds of "
        "consumer products for global markets. An entrepreneur, Douglas partners with universities, public and private entities to develop "
        "non-pharmaceutical solutions for age-related conditions. Douglas advises multinationals and start-ups on sales and marketing "
        "tactics. He’s a frequent, global speaker on consumer trends, and serves on the board of the Organic and Natural Health "
        "Association in Washington, D.C."
    )
    
    # Try to find the advisor first to avoid filter().update() potential issues if record missing or weird
    advisor = Advisor.objects.filter(display_order=1).first()
    if advisor:
        advisor.name = "Douglas Lynch"
        advisor.advisory_role = "Business Development Advisory Board Member"
        advisor.expertise_area = "Sales & Marketing"
        advisor.organization = "Organic and Natural Health Association"
        advisor.bio = full_bio
        advisor.image = "advisors/dougla_lynch.jpg"
        advisor.linkedin_url = "https://www.linkedin.com/in/marketwellnutritionceo/"
        advisor.is_active = True
        advisor.save()
        print(f"Successfully updated advisor: {advisor.name}")
    else:
        # Fallback create if display_order 1 not found for some reason
        Advisor.objects.create(
            display_order=1,
            name="Douglas Lynch",
            advisory_role="Business Development Advisory Board Member",
            expertise_area="Sales & Marketing",
            organization="Organic and Natural Health Association",
            bio=full_bio,
            image="advisors/dougla_lynch.jpg",
            linkedin_url="https://www.linkedin.com/in/marketwellnutritionceo/",
            is_active=True
        )
        print("Created new advisor for Douglas Lynch at display_order 1.")

if __name__ == "__main__":
    seed_douglas()
