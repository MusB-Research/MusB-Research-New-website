import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Advisor

def seed_nagendra():
    print("Replacing Advisor (display_order=2) with Dr. Nagendra Rangavajla...")
    
    full_bio = (
        "Nagendra Rangavajla, Ph.D., FACN, is a strategic R&D leader with over 25 years "
        "of experience driving innovation from discovery to commercialization for "
        "global CPG leaders like Abbott, Nestlé, and Mead Johnson, as well as high- "
        "growth startups like Califia Farms and one.bio. He specializes in building "
        "robust science and technology roadmaps that link consumer insights to "
        "differentiated products across functional ingredients, beverages, and "
        "nutritional categories. His expertise spans the entire lifecycle of innovation, "
        "from ingredient scouting and bioconversion to managing complex clinical "
        "efficacy studies and global regulatory strategies.\n\n"
        "As a seasoned advisor, Nagendra has expertise in scaling R&D operations, "
        "having optimized organizational processes to increase speed, productivity and "
        "innovation culture. He is a prolific innovator with over 20 patents and 50 "
        "publications, particularly in the areas of gut health, cognition, metabolic "
        "wellness, etc., and leverages a deep network of academic and external "
        "partners to help emerging companies navigate the transition from discovery to "
        "global distribution."
    )
    
    # Replace the advisor with display_order 2 (David Kumar)
    advisor = Advisor.objects.filter(display_order=2).first()
    if advisor:
        advisor.name = "NAGENDRA RANGAVAJLA, Ph.D., FACN"
        advisor.advisory_role = "Business Development Advisory Board Member"
        advisor.expertise_area = "R&D Strategy & Innovation"
        advisor.organization = "Former Abbott / Nestlé Executive"
        advisor.bio = full_bio
        advisor.image = "advisors/nagendra_rangavajla.JPG"
        advisor.linkedin_url = "https://www.linkedin.com/in/nagendra-rangavajla-053584/"
        advisor.is_active = True
        advisor.save()
        print(f"Successfully updated advisor: {advisor.name}")
    else:
        # Fallback create
        Advisor.objects.create(
            display_order=2,
            name="NAGENDRA RANGAVAJLA, Ph.D., FACN",
            advisory_role="Business Development Advisory Board Member",
            expertise_area="R&D Strategy & Innovation",
            organization="Former Abbott / Nestlé Executive",
            bio=full_bio,
            image="advisors/nagendra_rangavajla.JPG",
            linkedin_url="https://www.linkedin.com/in/nagendra-rangavajla-053584/",
            is_active=True
        )
        print("Created new advisor for Nagendra Rangavajla at display_order 2.")

if __name__ == "__main__":
    seed_nagendra()
