import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import ClinicalConversation

def list_convs():
    convs = ClinicalConversation.objects.select_related('study').all()
    print(f"Total conversations: {convs.count()}")
    for c in convs:
        print(f"Conv ID: {c.id}, Study Protocol: {c.study.protocol_id if c.study else 'None'}")

if __name__ == "__main__":
    list_convs()
