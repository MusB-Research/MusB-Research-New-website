import os
import django
import sys
from datetime import date, timedelta

# Setup django
sys.path.append('d:\\MusB Research Website-1\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from careers.models import JobPosting

def seed_careers():
    # Clear existing to keep it clean and up-to-date with new fields
    JobPosting.objects.all().delete()

    jobs = [
        {
            'title': 'Senior Clinical Research Coordinator',
            'category': 'Clinical Research',
            'is_featured': True,
            'location': 'Tampa, FL (On-site)',
            'job_type': 'Full-time',
            'experience_level': 'Senior',
            'role_summary': 'Lead the management of complex clinical trials in microbiome and metabolic health.',
            'description': 'As a Senior Clinical Research Coordinator at MusB™ Research, you will play a pivotal role in leading and managing high-impact clinical trials. You will oversee study protocols, ensure regulatory compliance, and coordinate with cross-functional teams to deliver high-quality data.',
            'requirements': [
                "Bachelor's or Master's degree in a life science or nursing field.",
                'Minimum of 5 years of experience in clinical research coordination.',
                'In-depth knowledge of GCP, IRB protocols, and FDA regulations.',
                'Excellent communication and leadership skills.',
                'Ability to manage multiple complex trials simultaneously.'
            ],
            'status': 'Active',
            'publish_date': date.today(),
            'expiry_date': date.today() + timedelta(days=90)
        },
        {
            'title': 'Research Associate - Biotics & Omics',
            'category': 'Research & Innovation',
            'is_featured': False,
            'location': 'Tampa, FL (Hybrid)',
            'job_type': 'Full-time',
            'experience_level': 'Mid-level',
            'role_summary': 'Support bench-top research in our multi-omics laboratory.',
            'description': 'We are seeking a dedicated Research Associate to join our Biotics & Omics team. You will be responsible for sample processing, DNA/RNA extraction, and supporting next-generation sequencing workflows in our state-of-the-art facility.',
            'requirements': [
                "Bachelor's or Master's degree in Biology, Biochemistry, or related field.",
                '2-3 years of wet-lab experience.',
                'Experience with sample processing (DNA/RNA extraction, PCR, NGS).',
                'Familiarity with data analysis software.',
                'Strong attention to detail.'
            ],
            'status': 'Active',
            'publish_date': date.today(),
            'expiry_date': date.today() + timedelta(days=60)
        },
        {
            'title': 'Laboratory Technician',
            'category': 'Laboratory & Diagnostics',
            'is_featured': False,
            'location': 'Tampa, FL (On-site)',
            'job_type': 'Full-time',
            'experience_level': 'Entry-level',
            'role_summary': 'Execute standard laboratory protocols for clinical sample processing.',
            'description': 'MusB™ Research is looking for a Laboratory Technician to support operations. You will handle daily sample intake, maintain lab equipment, and ensure adherence to safety protocols and study-specific processing guidelines.',
            'requirements': [
                "Associate's or Bachelor's degree in laboratory science.",
                'Basic understanding of laboratory safety.',
                'Experience with pipetting and sample handling.',
                'Ability to work carefully under supervision.',
                'Excellent record-keeping skills.'
            ],
            'status': 'Active',
            'publish_date': date.today(),
            'expiry_date': date.today() + timedelta(days=45)
        },
        {
            'title': 'Clinical Data Analyst',
            'category': 'Data & Biostatistics',
            'is_featured': False,
            'location': 'Remote / Tampa, FL',
            'job_type': 'Contract',
            'experience_level': 'Mid-level',
            'role_summary': 'Perform statistical cleaning and analysis of microbiome-based clinical data.',
            'description': 'As a Clinical Data Analyst, you will handle data from our multi-omic clinical trials. Your focus will be on ensuring data integrity, performing exploratory analyses, and supporting the biostatistics team in reporting clinical outcomes and safety profiles.',
            'requirements': [
                "Master's degree in Biostatistics, Data Science, or related field.",
                'Proficiency in R or Python.',
                'Experience with clinical trial data and CDISC standards.',
                'Background in microbiome data analysis is a plus.',
                'Strong analytical thinking.'
            ],
            'status': 'Active',
            'publish_date': date.today(),
            'expiry_date': date.today() + timedelta(days=30)
        }
    ]

    for job_info in jobs:
        JobPosting.objects.create(**job_info)
        print(f"Created/Updated job: {job_info['title']}")

if __name__ == "__main__":
    seed_careers()
