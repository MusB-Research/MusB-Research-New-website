import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Advisor

def seed_sean():
    print("Replacing Advisor (display_order=4) with Sean M. Garvey, Ph.D...")
    
    # Replace the advisor with display_order 4 (Robert Martinez)
    advisor = Advisor.objects.filter(display_order=4).first()
    if advisor:
        advisor.name = "Sean M. Garvey, Ph.D"
        advisor.advisory_role = "Business Development Advisory Board Member"
        advisor.expertise_area = "Nutritional Science & Business Development"
        # Since organization wasn't explicitly provided, I'll use a neutral placeholder or leave as is if appropriate
        advisor.organization = "Strategic Advisor" 
        advisor.bio = "Biography pending."
        advisor.image = "advisors/sean_m_garvey.jpg" 
        advisor.linkedin_url = "https://www.linkedin.com/in/sean-garvey-phd-638a253/"
        advisor.is_active = True
        advisor.save()
        print(f"Successfully updated advisor: {advisor.name}")
    else:
        # Fallback create
        Advisor.objects.create(
            display_order=4,
            name="Sean M. Garvey, Ph.D",
            advisory_role="Business Development Advisory Board Member",
            expertise_area="Nutritional Science & Business Development",
            organization="Strategic Advisor",
            bio="Biography pending.",
            image="advisors/sean_m_garvey.jpg",
            linkedin_url="https://www.linkedin.com/in/sean-garvey-phd-638a253/",
            is_active=True
        )
        print("Created new advisor for Sean M. Garvey at display_order 4.")

if __name__ == "__main__":
    seed_sean()
