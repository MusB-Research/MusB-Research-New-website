"""
Management command to seed all database tables with initial data
matching the existing frontend data.ts content.
"""
from django.core.management.base import BaseCommand
from api.models import (
    HomePageSettings, SupportPageSettings, AboutPageSettings,
    NewsItem, CareerCategory, JobOpening,
    Study, TeamMember, Advisor, ClinicalCollaborator, StaffMember,
    ResearchCapability, Facility, Partner, Certification
)


class Command(BaseCommand):
    help = 'Seed database with initial data from data.ts'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...\n')

        # ---- Singleton settings (just ensure they exist) ----
        HomePageSettings.load()
        SupportPageSettings.load()
        AboutPageSettings.load()
        self.stdout.write(self.style.SUCCESS('✓ Page settings initialized'))

        # ---- Team Members ----
        if TeamMember.objects.count() == 0:
            members = [
                dict(name='Dr. Sarah Mitchell', role='Chief Scientific Officer & Principal Investigator',
                     bio='Leading translational research in microbiome and metabolic health.',
                     expanded_bio='Dr. Sarah Mitchell brings over 20 years of experience in translational research, with a focus on microbiome-based interventions for metabolic disorders.',
                     expertise_tags=['Microbiome', 'Clinical Trials', 'Metabolic Health'],
                     areas_of_expertise=['Microbiome Research', 'Clinical Trial Design', 'Metabolic Disorders', 'Regulatory Affairs'],
                     affiliations=['American Society for Nutrition', 'International Society for Microbiota', 'FDA Advisory Board'],
                     publications=['Over 50 peer-reviewed publications in Nature, Cell, and JAMA'],
                     display_order=1),
                dict(name='Dr. James Chen', role='Director of Clinical Operations',
                     bio='Specialist in GCP compliance and multi-site trial coordination.',
                     expanded_bio='Dr. James Chen oversees all clinical operations at MusB™ Research.',
                     expertise_tags=['GCP', 'Clinical Operations', 'Quality Assurance'],
                     areas_of_expertise=['Good Clinical Practice', 'Site Management', 'IRB Coordination', 'Data Quality'],
                     affiliations=['Society for Clinical Research Sites', 'Association of Clinical Research Professionals'],
                     publications=['Author of "Best Practices in Clinical Trial Management"'],
                     display_order=2),
                dict(name='Dr. Emily Rodriguez', role='Lead Research Scientist - Biotics & Omics',
                     bio='Expert in multi-omics analysis and gut-brain axis research.',
                     expanded_bio='Dr. Emily Rodriguez leads our biotics and omics research division.',
                     expertise_tags=['Omics', 'Bioinformatics', 'Gut-Brain Axis'],
                     areas_of_expertise=['Metagenomics', 'Bioinformatics', 'Neuroinflammation', 'Systems Biology'],
                     affiliations=['American Society for Microbiology', 'International Society for Computational Biology'],
                     publications=['30+ publications in Science, Microbiome, and Gut journals'],
                     display_order=3),
                dict(name='Dr. Michael Thompson', role='Senior Biostatistician',
                     bio='Specialized in clinical trial data analysis and statistical modeling.',
                     expanded_bio='Dr. Michael Thompson provides statistical expertise for all clinical trials.',
                     expertise_tags=['Biostatistics', 'Data Science', 'Clinical Analytics'],
                     areas_of_expertise=['Statistical Modeling', 'Clinical Data Analysis', 'R & Python Programming', 'CDISC Standards'],
                     affiliations=['American Statistical Association', 'Society for Clinical Trials'],
                     publications=['Expert in Bayesian methods and adaptive trial designs'],
                     display_order=4),
            ]
            for m in members:
                TeamMember.objects.create(**m)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(members)} team members created'))

        # ---- Advisors ----
        if Advisor.objects.count() == 0:
            advisors = [
                dict(name='Dr. Patricia Williams', advisory_role='Scientific Advisory Board',
                     expertise_area='Regulatory Strategy', organization='Former FDA Deputy Director',
                     bio='Dr. Williams provides strategic guidance on regulatory pathways.', display_order=1),
                dict(name='Prof. David Kumar', advisory_role='Clinical Advisory Board',
                     expertise_area='Gastroenterology', organization='Johns Hopkins University',
                     bio='Prof. Kumar advises on clinical trial design for GI and microbiome studies.', display_order=2),
                dict(name='Dr. Lisa Anderson', advisory_role='Scientific Advisory Board',
                     expertise_area='Immunology', organization='Stanford Medical School',
                     bio='Dr. Anderson provides expertise in immunomodulatory research.', display_order=3),
                dict(name='Dr. Robert Martinez', advisory_role='Industry Advisory Board',
                     expertise_area='Product Development', organization='Former VP R&D, Major Pharma',
                     bio='Dr. Martinez advises on translating research findings into commercial products.', display_order=4),
            ]
            for a in advisors:
                Advisor.objects.create(**a)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(advisors)} advisors created'))

        # ---- Clinical Collaborators ----
        if ClinicalCollaborator.objects.count() == 0:
            collabs = [
                dict(name='Unilever', display_order=1),
                dict(name='Synbiotic Health', display_order=2),
                dict(name='Vidya Herbs', display_order=3),
                dict(name='Biova', display_order=4),
                dict(name='India Glycol Ltd', display_order=5),
                dict(name='APT Testing and Research Pvt. Ltd.', display_order=6),
                dict(name='Croissance Clinical Research', display_order=7),
                dict(name='Clintek', display_order=8),
                dict(name='Zeda AI', display_order=9),
                dict(name='Excel Imaging Center', display_order=10),
                dict(name='Bay Area Gastroenterology Associates LLC', display_order=11),
                dict(name='Tampa General Hospital', specialty='Multi-Specialty Research', location='Tampa, FL', display_order=12),
                dict(name='Moffitt Cancer Center', specialty='Oncology', location='Tampa, FL', display_order=13),
                dict(name='USF Health', specialty='Academic Research', location='Tampa, FL', display_order=14),
                dict(name='Bay Area Gastroenterology', specialty='Gastroenterology', location='St. Petersburg, FL', display_order=15),
                dict(name='Florida Neurology Associates', specialty='Neurology', location='Tampa Bay Area', display_order=16),
                dict(name="Women's Health Specialists", specialty="Women's Health", location='Clearwater, FL', display_order=17),
            ]
            for c in collabs:
                ClinicalCollaborator.objects.create(**c)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(collabs)} clinical collaborators created'))

        # ---- Staff Members ----
        if StaffMember.objects.count() == 0:
            staff = [
                dict(name='Vaishnavi S', role='Business & Administration Manager', dept='Operations', display_order=1),
                dict(name='Indushekar Manjunatha', role='Clinical Coordinator', dept='Clinical Research', display_order=2),
                dict(name='Falguni Kanani', role='Community Outreach Liaison', dept='Public Relations', display_order=3),
                dict(name='Alain Ramirez', role='Laboratory Technician', dept='Lab Services', display_order=4),
                dict(name='Andreas Mbah', role='Medical Laboratory Director', dept='Diagnostics', display_order=5),
                dict(name='Jason Chandler', role='IT Professional', dept='Technology', display_order=6),
                dict(name='Shray Paliwal', role='Research Intern', dept='Scientific Support', display_order=7),
                dict(name='Osula Ebiuwa', role='Research Intern', dept='Scientific Support', display_order=8),
                dict(name='Barenya Prasad Mishra', role='Digital Health Platform Developer', dept='Product Engineering', display_order=9),
                dict(name='Brijesh Kumar', role='Junior Software Engineer', dept='Software Development', display_order=10),
            ]
            for s in staff:
                StaffMember.objects.create(**s)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(staff)} staff members created'))

        # ---- Research Capabilities ----
        if ResearchCapability.objects.count() == 0:
            caps = [
                dict(title='Clinical Trials', description='Phase I–IV trials, including natural products and medical devices.', icon='activity', display_order=1),
                dict(title='Preclinical Research', description='In-depth in vitro and animal models for translational research.', icon='test-tube', display_order=2),
                dict(title='Microbiome, Biotics & Omics', description='Advanced analysis of microbial ecosystems and multi-omics data.', icon='microscope', display_order=3),
                dict(title='Nutrition & Natural Products', description='Efficacy and safety studies for dietary supplements and functional foods.', icon='leaf', display_order=4),
                dict(title='Aging, Metabolic & Brain Health', description='Focusing on musculoskeletal aging, brain health, and metabolic disorders.', icon='brain', display_order=5),
                dict(title='Leaky Gut, Inflammation, Skin & Women\u2019s Health', description='Specialized research in skin health, inflammation, and women-specific conditions.', icon='flower', display_order=6),
                dict(title='Immunomodulatory Research', description='Studying immune system responses and therapeutic interventions.', icon='shield-check', display_order=7),
                dict(title='Muscle, Gut, Skin & Vascular Health', description='Analysis of cardiovascular fitness and skeletal muscle performance.', icon='zap', display_order=8),
                dict(title='Toxicology & Bioavailability', description='Safety profiling and assessment of compound absorption rates.', icon='beaker', display_order=9),
                dict(title='Biostatistics & Data Science', description='Complex data analysis and robust statistical modeling workflows.', icon='bar-chart', display_order=10),
                dict(title='Regulatory Compliance Support', description='End-to-end guidance for FDA, FTC, and international compliance.', icon='file-text', display_order=11),
            ]
            for c in caps:
                ResearchCapability.objects.create(**c)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(caps)} capabilities created'))

        # ---- Facilities ----
        if Facility.objects.count() == 0:
            facs = [
                dict(name='Multidisciplinary Clinical Research Site', description='State-of-the-art facility equipped for diverse therapeutic studies.', features=['Consultation Rooms', 'Locked Storage', 'Reception Area'], display_order=1),
                dict(name='Participant-Friendly Clinics', description='Designed for comfort and efficiency during research visits.', features=['Private Bays', 'Waiting Lounge', 'Accessible Facilities'], display_order=2),
                dict(name='Central Laboratory & Biorepository', description='Secure on-site storage and advanced sample processing capabilities.', features=['-80°C Freezers', 'Centrifuges', 'Cryogenic Storage'], display_order=3),
                dict(name='Sample Processing & Secure IT Systems', description='HIPAA-compliant, high-security infrastructure for data management.', features=['Encrypted Servers', '24/7 Monitoring', 'Redundant Backups'], display_order=4),
                dict(name='Mobile Clinic & Phlebotomy Services', description='Bringing research to the community with mobile phlebotomy units.', features=['On-site Collection', 'Remote Monitoring', 'Outreach Kits'], display_order=5),
                dict(name='Metabolic Chambers', description='Precision measurement of energy expenditure and metabolic rates.', features=['Gas Analysis', 'Controlled Environment', 'Real-time Tracking'], display_order=6),
            ]
            for f in facs:
                Facility.objects.create(**f)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(facs)} facilities created'))

        # ---- Partners ----
        if Partner.objects.count() == 0:
            partners = [
                dict(name='University of South Florida', category='Academic', display_order=1),
                dict(name='Tampa General Hospital', category='Academic', display_order=2),
                dict(name='Global Pharma Solutions', category='Industry', display_order=3),
                dict(name='BioTech Innovations Inc.', category='Industry', display_order=4),
                dict(name='Clinical Research Alliance', category='CRO', display_order=5),
                dict(name='MedTrials Network', category='CRO', display_order=6),
                dict(name='Tampa Bay Health Foundation', category='Community', display_order=7),
                dict(name='Florida Research Consortium', category='Academic', display_order=8),
                dict(name='Natural Products Association', category='Industry', display_order=9),
                dict(name='Community Health Partners', category='Community', display_order=10),
            ]
            for p in partners:
                Partner.objects.create(**p)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(partners)} partners created'))

        # ---- Certifications ----
        if Certification.objects.count() == 0:
            certs = [
                dict(label='IRB-Approved Studies', image_url='/irb-seal.jpg', display_order=1),
                dict(label='GCP-Trained Staff', image_url='/gcp-trained.jpg', display_order=2),
                dict(label='HIPAA-Compliant Systems', image_url='/hipaa-compliant.jpg', display_order=3),
                dict(label='CLIA Laboratory Partnerships', image_url='/clia-certified.jpg', display_order=4),
                dict(label='COLA Laboratory Partnerships', image_url='/cola-certified.jpg', display_order=5),
                dict(label='SOP-Driven Operations', image_url='/sop-certified.jpg', display_order=6),
                dict(label='ISO Certified', image_url='/iso-certified.jpg', display_order=7),
                dict(label='GLP Certified', image_url='/glp-certified.jpg', display_order=8),
            ]
            for c in certs:
                Certification.objects.create(**c)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(certs)} certifications created'))

        # ---- Studies ----
        if Study.objects.count() == 0:
            studies = [
                dict(title='Microbiome Diversity & Bone Density in Post-Menopausal Women', condition='Gut', duration='12 Weeks', status='Recruiting'),
                dict(title='Neural Correlation of Cognitive Decline in Early-Stage Aging', condition='Brain', duration='6 Months', status='Recruiting'),
                dict(title='Novel Therapeutics for Bone Regeneration Post-Fracture', condition='Aging', duration='1 Year', status='Active'),
                dict(title='Estrogen Influence on Ligament Elasticity & Injury Risk', condition="Women's Health", duration='8 Weeks', status='Recruiting'),
                dict(title='Supportive Care Interventions for Bone Health in Cancer Survivors', condition='Cancer Support', duration='2 Months', status='Upcoming'),
            ]
            for s in studies:
                Study.objects.create(**s)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(studies)} studies created'))

        # ---- News Items ----
        if NewsItem.objects.count() == 0:
            news = [
                dict(title='MusB™ Research Launches New Microbiome Clinical Trial in Tampa Bay', type='News',
                     excerpt='A new IRB-approved study evaluating microbiome-based interventions for metabolic health is now recruiting participants.',
                     content='Full details about the microbiome trial...', image_url='/news/microbiome-trial.png',
                     date='March 2026', is_featured=True, publish_status='Published',
                     tags=['Microbiome', 'Clinical Trial', 'Tampa Bay']),
                dict(title='New Partnership with Global Pharma for Bone Regeneration Study', type='Partnership',
                     excerpt='MusB™ Research announces a strategic collaboration with leading pharmaceutical innovators.',
                     content='Full details about the partnership...', image_url='/news/partnership.png',
                     date='Feb 2026', is_featured=False, publish_status='Published',
                     tags=['Partnership', 'Bone Health', 'Pharma']),
                dict(title='Upcoming Seminar: The Future of Aging and Metabolic Health', type='Event',
                     excerpt='Join our lead researchers for an in-depth seminar on modern approaches to aging.',
                     content='Full details about the seminar...', image_url='/news/seminar.png',
                     date='April 2026', is_featured=False, publish_status='Published',
                     tags=['Seminar', 'Aging', 'Health'],
                     start_time='10:00 AM', end_time='2:00 PM', location_type='Hybrid',
                     location='Main Auditorium & Zoom', registration_link='#'),
                dict(title='Gut Microbiome Diversity and Its Role in Metabolic Regulation: A Systematic Review', type='Publication',
                     excerpt='Published in Journal of Translational Medicine examining gut microbiome diversity and metabolic health outcomes.',
                     content='Full details...', image_url='/news/microbiome-trial.png',
                     date='Jan 2026', is_featured=False, publish_status='Published',
                     tags=['Publication', 'Microbiome', 'Metabolic Health']),
                dict(title='Probiotic Interventions for GLP-1 Stimulation: Preclinical Evidence', type='Publication',
                     excerpt='Original research in Nature Microbiology exploring probiotic strains that promote GLP-1 secretion.',
                     content='Full details...', image_url='/news/neural-update.png',
                     date='Dec 2025', is_featured=False, publish_status='Published',
                     tags=['Publication', 'GLP-1', 'Probiotics']),
                dict(title='Understanding Clinical Trials: A Guide for Participants', type='Educational Material',
                     excerpt='An introductory resource explaining the clinical trial process and participant rights.',
                     content='Full details...', image_url='/news/seminar.png',
                     date='Feb 2026', is_featured=False, publish_status='Published',
                     tags=['Education', 'Clinical Trials', 'Participants']),
                dict(title='The Science of Microbiome Health: What You Need to Know', type='Educational Material',
                     excerpt='Comprehensive guide covering microbiome basics, the gut-brain axis, and evidence-based strategies.',
                     content='Full details...', image_url='/news/outreach.png',
                     date='Jan 2026', is_featured=False, publish_status='Published',
                     tags=['Education', 'Microbiome', 'Health']),
                dict(title='MusB™ Research Receives ISO 9001 Certification', type='News',
                     excerpt='MusB™ Research Group has been recognized for its commitment to quality management systems.',
                     content='Full details...', image_url='/news/iso-cert.png',
                     date='Jan 2026', is_featured=False, publish_status='Published',
                     tags=['ISO', 'Quality', 'Certification']),
            ]
            for n in news:
                NewsItem.objects.create(**n)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(news)} news items created'))

        # ---- Career Categories ----
        if CareerCategory.objects.count() == 0:
            categories = [
                dict(name='Research & Innovation', description='Scientists, postdocs, research associates.', icon='microscope', display_order=1),
                dict(name='Clinical Research', description='Coordinators, nurses, and trial managers.', icon='activity', display_order=2),
                dict(name='Laboratory & Diagnostics', description='Lab technicians, analysts, QA/QC professionals.', icon='test-tube', display_order=3),
                dict(name='Data & Biostatistics', description='Data scientists and statisticians.', icon='bar-chart', display_order=4),
                dict(name='Operations & Administration', description='HR, finance, and compliance professionals.', icon='briefcase', display_order=5),
                dict(name='Students & Internships', description='Interns, trainees, and fellows.', icon='graduation-cap', display_order=6),
            ]
            for c in categories:
                CareerCategory.objects.create(**c)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(categories)} career categories created'))

        # ---- Job Openings ----
        if JobOpening.objects.count() == 0:
            jobs = [
                dict(title='Senior Clinical Research Coordinator', department='Clinical Research',
                     location='Tampa, FL (On-site)', type='Full-time', experience_level='Senior',
                     summary='Lead the management of complex clinical trials in microbiome and metabolic health.',
                     description='As a Senior Clinical Research Coordinator at MusB™ Research, you will play a pivotal role in leading and managing high-impact clinical trials.',
                     requirements=[
                         'Bachelor\u2019s or Master\u2019s degree in a life science or nursing field.',
                         'Minimum of 5 years of experience in clinical research coordination.',
                         'In-depth knowledge of GCP, IRB protocols, and FDA regulations.',
                         'Excellent communication and leadership skills.',
                         'Ability to manage multiple complex trials simultaneously.'
                     ],
                     is_featured=True, status='Live'),
                dict(title='Research Associate - Biotics & Omics', department='Research & Innovation',
                     location='Tampa, FL (Hybrid)', type='Full-time', experience_level='Mid-level',
                     summary='Support bench-top research in our multi-omics laboratory.',
                     description='We are seeking a dedicated Research Associate to join our Biotics & Omics team.',
                     requirements=[
                         'Bachelor\u2019s or Master\u2019s degree in Biology, Biochemistry, or related field.',
                         '2-3 years of wet-lab experience.',
                         'Experience with sample processing (DNA/RNA extraction, PCR, NGS).',
                         'Familiarity with data analysis software.',
                         'Strong attention to detail.'
                     ],
                     is_featured=False, status='Live'),
                dict(title='Laboratory Technician', department='Laboratory & Diagnostics',
                     location='Tampa, FL (On-site)', type='Full-time', experience_level='Entry-level',
                     summary='Execute standard laboratory protocols for clinical sample processing.',
                     description='MusB™ Research is looking for a Laboratory Technician to support operations.',
                     requirements=[
                         'Associate\u2019s or Bachelor\u2019s degree in laboratory science.',
                         'Basic understanding of laboratory safety.',
                         'Experience with pipetting and sample handling.',
                         'Ability to work carefully under supervision.',
                         'Excellent record-keeping skills.'
                     ],
                     is_featured=False, status='Live'),
                dict(title='Clinical Data Analyst', department='Data & Biostatistics',
                     location='Remote / Tampa, FL', type='Contract', experience_level='Mid-level',
                     summary='Perform statistical cleaning and analysis of microbiome-based clinical data.',
                     description='As a Clinical Data Analyst, you will handle data from our clinical trials.',
                     requirements=[
                         'Master\u2019s degree in Biostatistics, Data Science, or related field.',
                         'Proficiency in R or Python.',
                         'Experience with clinical trial data and CDISC standards.',
                         'Background in microbiome data analysis is a plus.',
                         'Strong analytical thinking.'
                     ],
                     is_featured=False, status='Live'),
            ]
            for j in jobs:
                JobOpening.objects.create(**j)
            self.stdout.write(self.style.SUCCESS(f'✓ {len(jobs)} job openings created'))

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeding complete!'))
