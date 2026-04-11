import os
import django
import random
from django.utils import timezone
from datetime import timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Participant, Study, ClinicalConversation, ClinicalMessage
from authentication.models import User

def seed_conversations():
    print("Starting clinical conversations seeding...")
    
    # Target studies that actually have coordinators assigned
    participants = Participant.objects.all()
    if not participants.exists():
        print("No participants found. Please run seed_participants first.")
        return

    tags = ['SAFETY', 'PROTOCOL', 'ELIGIBILITY', 'GENERAL']
    statuses = ['UNREAD', 'ACTION_REQUIRED', 'RESOLVED', 'OPEN']
    
    # Clear existing conversations for a clean start if multiple returned errors occurred
    ClinicalConversation.objects.all().delete()
    print("Cleared existing conversations.")

    for participant in participants:
         # Create a conversation for each participant
        study = participant.study
        if not study: continue
        
        # Get the study PI or a fallback
        pi = study.pi
        if not pi:
            pi = User.objects.filter(role='PI').first() or User.objects.filter(role='SUPER_ADMIN').first()
            
        # Get the study coordinator or a fallback
        coord = study.coordinator
        if not coord:
            coord = User.objects.filter(role='COORDINATOR').first() or User.objects.filter(role='SUPER_ADMIN').first()

        conv = ClinicalConversation.objects.create(
            participant=participant,
            study=study,
            status=random.choice(statuses),
            is_flagged=random.random() > 0.8,
            last_message_preview="Initial clinical thread created."
        )
        
        # Add a few messages
        for i in range(random.randint(2, 5)):
            is_from_pi = random.random() > 0.5
            sender = pi if is_from_pi else coord
            
            msg = ClinicalMessage.objects.create(
                conversation=conv,
                sender=sender,
                text=f"This is clinical message {i+1} for participant {participant.participant_sid} regarding their progress in {study.protocol_id}.",
                tag=random.choice(tags),
                is_from_pi=is_from_pi,
                created_at=timezone.now() - timedelta(hours=random.randint(1, 48))
            )
            conv.last_message_preview = msg.text
            conv.save()
            
    print(f"Seeding complete. Created {ClinicalConversation.objects.count()} conversations.")

if __name__ == "__main__":
    seed_conversations()
