import os
import django
import sys

# Add backend directory to sys.path so we can import 'musb_backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study

HARDCODED_STUDIES = [
    {
        'id': 'beat-the-bloat',
        'title': 'Beat The Bloat Study',
        'condition': 'Gut Health',
        'type': 'Hybrid',
        'trialFormat': 'RCT',
        'status': 'Recruiting',
        'description': 'Bloating reducing natural formula',
        'benefit': 'Free supply of study product & personalized health report.',
        'duration': '12 Weeks (2-3 visits)',
        'tags': ['Gut Health', 'Natural Formula', 'Bloating'],
        'compensation': 'Up to $400 for travel and time',
        'location': 'Tampa, FL',
        'timeCommitment': '2-3 clinic visits',
        'overview': 'This study evaluates the effectiveness of a natural herbal formula in reducing persistent abdominal bloating and improving overall digestive comfort. Participants will replace their current probiotic with the study supplement.',
        'timeline': [
            { 'step': 'Week 1', 'label': 'Initial Screening & Baseline Assessment' },
            { 'step': 'Week 2-6', 'label': 'Active Phase: Daily Supplement Use' },
            { 'step': 'Week 12', 'label': 'Final Evaluation & Health Report Delivery' }
        ],
        'kitsInfo': 'Participants will receive an at-home microbiome testing kit and a 12-week supply of the study probiotic during the first clinic visit.',
        'safetyInfo': 'All natural ingredients. Product is manufactured in GMP-certified facilities and has been safety-validated in clinical lab settings.',
        'privacyStandards': ['HIPAA', 'GDPR'],
        'remoteParticipation': True
    },
    {
        'id': 'vital-age',
        'title': 'VITAL-Age Study',
        'condition': 'Aging',
        'type': 'On-site',
        'trialFormat': 'Pre-post',
        'status': 'Recruiting',
        'description': 'Anti-aging probiotics',
        'benefit': 'Free supply of anti-aging probiotics & health assessments.',
        'duration': '5 Months (3-4 visits)',
        'tags': ['Aging', 'Probiotics', 'Vitality'],
        'compensation': 'Up to $600 upon completion',
        'location': 'Tampa, FL',
        'timeCommitment': '3-4 clinic visits',
        'overview': 'Examines the impact of specific probiotic strains on cellular aging markers and overall vitality in adults over 50.',
        'timeline': [
            { 'step': 'Month 1', 'label': 'Biomarker Screening' },
            { 'step': 'Month 2-4', 'label': 'Controlled Probiotic Intake' },
            { 'step': 'Month 5', 'label': 'Cellular Health Re-assessment' }
        ],
        'kitsInfo': 'Bloodwork and skin vitality assessments performed on-site. Home kits provided for daily monitoring.',
        'safetyInfo': 'Standard probiotic profile. Minor bloating may occur in the first few days. All data is de-identified.',
        'privacyStandards': ['HIPAA'],
        'remoteParticipation': False
    },
    {
        'id': 'sam-study',
        'title': 'SAM Study',
        'condition': 'Women’s Health',
        'type': 'Remote',
        'trialFormat': 'IHUT',
        'status': 'Recruiting',
        'description': 'Herbal formula for women health',
        'benefit': 'Free clinical supply of herbal formula & hormone tracking.',
        'duration': '12 weeks (4 visits)',
        'tags': ['Women\'s Health', 'Herbal', 'Hormonal'],
        'compensation': 'Get PAID',
        'location': 'Tampa, FL',
        'timeCommitment': '4 clinic visits',
        'overview': 'Investigating a specialized herbal blend for hormonal balance and symptom relief during mid-life transitions.',
        'timeline': [
            { 'step': 'Week 1', 'label': 'Hormone Level Baseline' },
            { 'step': 'Week 4', 'label': 'Progress Check-in' },
            { 'step': 'Week 12', 'label': 'Final Lab Panel' }
        ],
        'kitsInfo': 'Hormone tracking kits and supplements provided at the Tampa facility.',
        'safetyInfo': 'Clinically tested herbal extracts. No synthetic hormones used.',
        'privacyStandards': ['GDPR'],
        'remoteParticipation': True
    },
    {
        'id': 'shine-study',
        'title': 'SHINE Study',
        'condition': 'Women’s Health',
        'type': 'On-site',
        'trialFormat': 'Open-label',
        'status': 'Recruiting',
        'description': 'Bioenhancer formula for women health',
        'benefit': 'Free bioenhancer formula & expert health consultations.',
        'duration': '8 weeks (3-4 visits)',
        'tags': ['Women\'s Health', 'Bioenhancer', 'Wellness'],
        'compensation': 'Competitive compensation',
        'location': 'Tampa, FL',
        'timeCommitment': '3-4 clinic visits',
        'overview': 'Study of a novel bioenhancer to improve the absorption of essential nutrients in women, promoting overall energy and well-being.',
        'timeline': [
            { 'step': 'Week 1', 'label': 'Nutrient Level Screening' },
            { 'step': 'Week 4', 'label': 'Interim Assessment' },
            { 'step': 'Week 8', 'label': 'Conclusion & Results' }
        ],
        'kitsInfo': 'On-site clinical visits required for absorption testing.',
        'safetyInfo': 'Bioenhancers are derived from food-grade sources. Safety profile is well-documented.',
        'privacyStandards': ['HIPAA', 'SOC2'],
        'remoteParticipation': False
    }
]

def map_status(status_str):
    mapping = {
        'Recruiting': 'RECRUITING',
        'Active': 'ACTIVE',
        'Closed': 'CLOSED',
        'Upcoming': 'PREPARING_LAUNCH'
    }
    return mapping.get(status_str, 'DRAFT')

def map_type(type_str):
    return 'VIRTUAL' if type_str == 'Remote' else 'IN_PERSON'

def populate():
    for data in HARDCODED_STUDIES:
        defaults = {
            'title': data['title'],
            'study_type': map_type(data['type']),
            'status': map_status(data['status']),
            'condition': data['condition'],
            'trial_format': data['trialFormat'],
            'description': data['description'],
            'benefit': data['benefit'],
            'duration': data['duration'],
            'tags': data['tags'],
            'compensation': data['compensation'],
            'location': data['location'],
            'time_commitment': data['timeCommitment'],
            'overview': data['overview'],
            'timeline': data['timeline'],
            'kits_info': data['kitsInfo'],
            'safety_info': data['safetyInfo'],
            'privacy_standards': data['privacyStandards'],
            'remote_participation': data['remoteParticipation'],
            'sponsor_name': 'MusB Research' # Default value
        }
        
        study, created = Study.objects.update_or_create(
            protocol_id=data['id'],
            defaults=defaults
        )
        if created:
            print(f"Created study: {study.title}")
        else:
            print(f"Updated study: {study.title}")

if __name__ == '__main__':
    populate()
    print("Database population complete.")
