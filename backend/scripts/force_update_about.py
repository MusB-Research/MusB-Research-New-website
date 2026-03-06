import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import AboutPageSettings, SupportPageSettings

def force_update():
    # Update AboutPageSettings
    settings_list = AboutPageSettings.objects.all()
    if not settings_list.exists():
        AboutPageSettings.load()
        settings_list = AboutPageSettings.objects.all()
    
    new_content = (
        "MusB Research functions as an extension of your internal R&D—providing facilities, expertise, and resources that scale with your needs.\n\n"
        "Whether you are an early-stage innovator or an established global brand, we integrate seamlessly with your team to deliver credible, actionable science."
    )
    
    for s in settings_list:
        s.partner_title = "An Extension of Your R&D Team"
        s.partner_content = new_content
        s.mission_title = "Our Mission"
        s.mission_content = "MusB Research is committed to being your growth partner by providing robust, reliable scientific evidence for your products. We are passionate about supporting your success through meticulous research, innovative approaches, and uncompromising scientific integrity."
        s.vision_title = "Our Vision"
        s.vision_content = "We envision becoming a global leader in healthcare research—driving groundbreaking innovations that enhance public health and well-being for all."
        s.core_values = [
            {"icon": "star", "name": "Excellence", "description": "We pursue the highest standards to ensure exceptional quality and reliability."},
            {"icon": "shield-check", "name": "Integrity", "description": "We uphold ethical research practices built on transparency and trust."},
            {"icon": "zap", "name": "Innovation", "description": "We embrace cutting-edge technologies and forward-thinking approaches."},
            {"icon": "users", "name": "Collaboration", "description": "We work closely with our partners to drive shared success."},
            {"icon": "heart", "name": "Commitment", "description": "We are dedicated to advancing public health through rigorous science."},
            {"icon": "target", "name": "Client Focus", "description": "We deliver personalized, tailored solutions aligned with your goals."},
            {"icon": "refresh-cw", "name": "Continuous Improvement", "description": "We constantly refine our methods through learning and evaluation."},
            {"icon": "globe", "name": "Responsibility", "description": "We ensure our research contributes positively to society and global health."},
            {"icon": "flame", "name": "Passion", "description": "We are driven by a deep passion for science and innovation."},
            {"icon": "check-circle", "name": "Quality", "description": "We ensure excellence through meticulous attention to detail and quality control."}
        ]
        s.save()
        print(f"Updated About record PK: {s.pk}")

    # Update SupportPageSettings (just in case)
    support_list = SupportPageSettings.objects.all()
    if not support_list.exists():
        SupportPageSettings.load()
        support_list = SupportPageSettings.objects.all()
        
    for spr in support_list:
        spr.partner_title = "An Extension of Your R&D Team"
        spr.partner_content = new_content
        spr.save()
        print(f"Updated Support record PK: {spr.pk}")

if __name__ == "__main__":
    force_update()
