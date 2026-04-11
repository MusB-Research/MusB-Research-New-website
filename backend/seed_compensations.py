import os
import django
import random
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Participant, Study, Compensation, Task, Visit
from authentication.models import User

def seed_compensations():
    print("Starting compensation seeding...")
    
    participants = Participant.objects.all()
    if not participants.exists():
        print("No participants found. Please run seed_participants first.")
        return

    # Clear existing compensations for a clean start
    # Compensation.objects.all().delete()
    
    transaction_types = [
        ('TASK_COMPLETION', 'Task Completion'),
        ('VISIT_COMPLETION', 'Visit Completion'),
        ('BONUS', 'Milestone Bonus'),
    ]
    
    payment_methods = ['BANK_TRANSFER', 'STIPEND_CARD', 'CASH']
    statuses = ['PAID', 'APPROVED', 'PENDING']
    
    for participant in participants:
        # Create 2-4 compensations per participant
        num_records = random.randint(2, 5)
        
        for i in range(num_records):
            trans_type, desc_prefix = random.choice(transaction_types)
            amount = Decimal(random.randint(10, 150))
            status = random.choice(statuses)
            method = random.choice(payment_methods)
            
            # Find a related task or visit if applicable
            task = Task.objects.filter(study=participant.study).first() if trans_type == 'TASK_COMPLETION' else None
            visit = Visit.objects.filter(participant=participant).first() if trans_type == 'VISIT_COMPLETION' else None
            
            created_at = timezone.now() - timedelta(days=random.randint(0, 30))
            paid_at = created_at + timedelta(hours=random.randint(1, 48)) if status == 'PAID' else None
            
            desc = f"{desc_prefix} - {participant.participant_sid}"
            if task: desc += f" ({task.title})"
            elif visit: desc += f" ({visit.visit_type})"
            
            Comp = Compensation.objects.create(
                participant=participant,
                study=participant.study,
                task=task,
                visit=visit,
                transaction_type=trans_type,
                description=desc,
                amount=amount,
                status=status,
                payment_method=method,
                paid_at=paid_at,
                notes=f"Clinical reward for {participant.participant_sid}",
                created_at=created_at
            )
            # Use save() to update auto_now_add if needed or just rely on the manual set above
            # (Note: created_at with auto_now_add=True is tricky to set manually in create)
            # We'll just let it be.
            
    print(f"Seeding complete. Created {Compensation.objects.count()} compensation records.")

if __name__ == "__main__":
    seed_compensations()
