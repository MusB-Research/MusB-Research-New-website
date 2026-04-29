import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import TeamMember

shalini = TeamMember.objects.filter(name__icontains='Shalini').first()
if shalini:
    shalini.image = 'team/shalini_jain.jpg'
    shalini.save()
    print("Updated Shalini")

hariom = TeamMember.objects.filter(name__icontains='Hariom').first()
if hariom:
    hariom.image = 'team/hariom_yadav.jpg'
    hariom.save()
    print("Updated Hariom")
