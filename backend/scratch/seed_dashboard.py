import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Participant, Study, Visit, QuestionnaireTemplate, StudyQuestionnaire, QuestionnaireScheduleInstance
from django.contrib.auth import get_user_model

User = get_user_model()

def seed():
    print("Seeding dashboard data...")
    
    # Get or create a study
    study = Study.objects.first()
    if not study:
        print("No studies found. Creating one...")
        study = Study.objects.create(
            title="Cardiovascular Health Initiative",
            protocol_id="CVD-2026-001",
            status="ACTIVE",
            stage="ACTIVE"
        )
    
    # Get participants
    participants = Participant.objects.all()
    if not participants:
        print("No participants found. Creating some...")
        for i in range(5):
            user = User.objects.create(
                email=f"subject{i}@example.com",
                username=f"subject{i}",
                role="PARTICIPANT"
            )
            Participant.objects.create(
                study=study,
                user=user,
                participant_sid=f"SUB-{100+i}",
                status="ACTIVE"
            )
        participants = Participant.objects.all()

    # Create Visits
    now = timezone.now()
    if Visit.objects.count() == 0:
        print("Creating visits...")
        for p in participants:
            # 1 Overdue Visit
            Visit.objects.create(
                participant=p,
                visit_type="Baseline Physical",
                scheduled_date=now - timedelta(days=2),
                status="SCHEDULED",
                location="Main Clinic"
            )
            # 1 Upcoming Visit
            Visit.objects.create(
                participant=p,
                visit_type="Week 2 Follow-up",
                scheduled_date=now + timedelta(days=5),
                status="SCHEDULED",
                location="Main Clinic"
            )
            # 1 Completed Visit
            Visit.objects.create(
                participant=p,
                visit_type="Screening",
                scheduled_date=now - timedelta(days=10),
                actual_date=now - timedelta(days=10),
                status="COMPLETED",
                location="Main Clinic"
            )

    # Create Questionnaires
    if QuestionnaireTemplate.objects.count() == 0:
        print("Creating questionnaire template...")
        template = QuestionnaireTemplate.objects.create(
            name="Daily Symptom Tracker",
            json_structure={"fields": []}
        )
    else:
        template = QuestionnaireTemplate.objects.first()

    if StudyQuestionnaire.objects.count() == 0:
        print("Linking questionnaire to study...")
        sq = StudyQuestionnaire.objects.create(
            study=study,
            template=template,
            frequency_unit="DAYS",
            frequency_interval=1,
            repeat_count=30,
            status="ACTIVE"
        )
    else:
        sq = StudyQuestionnaire.objects.first()

    if QuestionnaireScheduleInstance.objects.count() == 0:
        print("Creating questionnaire instances...")
        for p in participants:
            QuestionnaireScheduleInstance.objects.create(
                study_questionnaire=sq,
                participant=p,
                scheduled_date=now.date(),
                status="PENDING"
            )

    print("Seeding complete.")

if __name__ == "__main__":
    seed()
