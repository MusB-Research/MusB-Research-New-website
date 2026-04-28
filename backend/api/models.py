from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from authentication.security import encrypt_data, decrypt_data
from django.utils import timezone
import datetime

class BaseMongoModel(models.Model):
    class Meta:
        abstract = True

    # __hash__ is now handled by global patch in settings.py

class SponsorOrganization(BaseMongoModel):
    name = models.CharField(max_length=255, unique=True)
    org_type = models.CharField(max_length=100, blank=True) # Corporate, University, CRO, NGO
    contact_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Study(BaseMongoModel):
    STUDY_TYPES = [
        ('IN_PERSON', 'In-Person Clinical Trial'),
        ('VIRTUAL', 'Virtual Clinical Trial'),
        ('DECENTRALIZED', 'Decentralized Trial (Hybrid)'),
    ]

    TRIAL_MODEL_CHOICES = [
        ('RCT', 'Randomized Controlled Trial'),
        ('OPEN_LABEL', 'Open Label Study'),
        ('IHUT', 'In-Home Use Test'),
        ('REGISTRY', 'Patient Registry'),
        ('OBSERVATIONAL', 'Observational Study'),
        ('BIOEQUIVALENCE', 'Bioequivalence Study'),
    ]

    PHASE_CHOICES = [
        ('N/A', 'N/A'),
        ('PHASE_0', 'Phase 0'),
        ('PHASE_1', 'Phase 1'),
        ('PHASE_1_2', 'Phase 1/2'),
        ('PHASE_2', 'Phase 2'),
        ('PHASE_2_3', 'Phase 2/3'),
        ('PHASE_3', 'Phase 3'),
        ('PHASE_4', 'Phase 4'),
        ('PILOT', 'Pilot Study'),
        ('BIOEQUIVALENCE', 'Bioequivalence'),
    ]

    MASKING_CHOICES = [
        ('NONE', 'None'),
        ('SINGLE_BLIND', 'Single Blind'),
        ('DOUBLE_BLIND', 'Double Blind'),
        ('TRIPLE_BLIND', 'Triple Blind'),
        ('QUADRUPLE_BLIND', 'Quadruple Blind'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PROPOSAL_SUBMITTED', 'Proposal Submitted'),
        ('PROPOSAL_UNDER_NEGOTIATION', 'Proposal Under Negotiation'),
        ('AGREEMENT_SIGNED', 'Agreement Signed'),
        ('IRB_PROTOCOL_INITIATED', 'IRB Protocol Initiated'),
        ('UNDER_IRB_SUBMISSION', 'Under IRB Submission / Development'),
        ('IRB_APPROVED', 'IRB Approved'),
        ('PREPARING_TO_LAUNCH', 'Preparing to Launch'),
        ('ACTIVE', 'Active'),
        ('RECRUITING', 'Recruiting'),
        ('RECRUITMENT_COMPLETED', 'Recruitment Completed'),
        ('ANALYSIS_UNDERWAY', 'Analysis Underway'),
        ('PROGRESS_REPORT_DRAFT', 'Progress Report Draft'),
        ('FINAL_REPORT_SENT', 'Final Report Sent'),
        ('COMPLETED', 'Completed'),
        ('PAUSED', 'Paused'),
        ('CLOSED_ARCHIVED', 'Closed / Archived'),
    ]

    title = models.CharField(max_length=255)
    full_title = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    protocol_id = models.CharField(max_length=100, unique=True, null=True, blank=True, verbose_name="Protocol ID / Internal ID")
    sponsor_name = models.CharField(max_length=255, blank=True, default='')
    study_type = models.CharField(max_length=20, choices=STUDY_TYPES, default='IN_PERSON')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')
    stage = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')
    is_archived = models.BooleanField(default=False)
    created_by_role = models.CharField(max_length=50, blank=True)
    
    # Core Medical Team (direct fields for easier dashboard access)
    pi = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='pi_studies')
    coordinator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='coordinator_studies')
    sponsor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sponsor_studies')
    sponsor_org = models.ForeignKey(SponsorOrganization, on_delete=models.SET_NULL, null=True, blank=True, related_name='studies')
    
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ]
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending')
    
    # Sponsor & Agreement Tracking
    proposal_source = models.CharField(max_length=20, choices=[('ONLINE', 'Online'), ('OFFLINE', 'Offline')], default='OFFLINE')
    proposal_submitted_date = models.DateField(null=True, blank=True)
    agreement_signed_date = models.DateField(null=True, blank=True)
    contract_status = models.CharField(max_length=50, blank=True)
    sponsor_contact_name = models.CharField(max_length=255, blank=True)
    sponsor_contact_email = models.EmailField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_studies')
    
    primary_indication = models.CharField(max_length=255, blank=True)
    design_type = models.CharField(max_length=255, blank=True) # Legacy
    
    trial_model = models.CharField(max_length=30, choices=TRIAL_MODEL_CHOICES, default='RCT')
    phase = models.CharField(max_length=30, choices=PHASE_CHOICES, default='PHASE_1')
    masking_strategy = models.CharField(max_length=30, choices=MASKING_CHOICES, default='NONE')
    is_double_blind = models.BooleanField(default=False)
    has_placebo_control = models.BooleanField(default=False)
    has_screening_log = models.BooleanField(default=True)
    
    shipment_mode = models.CharField(max_length=30, choices=[
        ('CLINIC', 'Clinic Delivery'),
        ('DTP', 'Direct-to-Patient (DTP)'),
        ('HYBRID', 'Hybrid (Both Modes)')
    ], default='CLINIC')
    
    consent_mode = models.CharField(max_length=30, choices=[
        ('PAPER', 'Paper Consent'),
        ('ECONSENT', 'Electronic Consent (eConsent)'),
        ('HYBRID', 'Hybrid (Both Modes)')
    ], default='ECONSENT')
    consent_collection = models.JSONField(default=list, blank=True)

    # Operational Parameters (Requirement 12.2)
    rct_design = models.CharField(max_length=50, blank=True, null=True)
    medication_supply = models.CharField(max_length=100, blank=True, null=True)
    has_study_kit = models.BooleanField(default=False)
    
    # Frontend Data Fields
    condition = models.CharField(max_length=255, blank=True)
    trial_format = models.CharField(max_length=50, blank=True)
    benefit = models.TextField(blank=True)
    duration = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list, blank=True)
    compensation = models.CharField(max_length=255, blank=True)
    compensation_currency = models.CharField(max_length=10, default='USD', blank=True)
    location = models.CharField(max_length=255, blank=True)
    time_commitment = models.CharField(max_length=255, blank=True)
    overview = models.TextField(blank=True)
    timeline = models.JSONField(default=list, blank=True)
    safety_info = models.TextField(blank=True)
    privacy_standards = models.JSONField(default=list, blank=True)
    remote_participation = models.BooleanField(default=False)
    participation_message = models.TextField(blank=True, null=True)
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    launch_date = models.DateField(null=True, blank=True)
    irb_status = models.CharField(max_length=100, blank=True)
    
    # Dynamic Screener Configuration
    screener_config = models.JSONField(default=dict, blank=True, help_text="Config for screener steps: {'steps': [{'id': 'STEP1', 'type': 'auto', 'editable': true}, ...]}")


    # Reward & Compensation Configuration
    REWARD_TYPE_CHOICES = [
        ('CASH', 'Cash'),
        ('COUPONS', 'Coupons'),
        ('MASTER_CARD', 'Master Card'),
        ('VISA_CARD', 'Visa Card'),
        ('WALMART_CARDS', 'Walmart Cards'),
        ('TARGET_CARD', 'Target Card'),
        ('CVS_CARD', 'CVS Card'),
        ('PUBLIX_CARDS', 'Publix Cards'),
        ('MIXED', 'Mixed (Both)')
    ]
    REWARD_LOGIC_CHOICES = [
        ('PER_TASK', 'Per Task Completion'),
        ('PER_VISIT', 'Per Visit Completion'),
        ('FULL_STUDY', 'Full Study Completion')
    ]
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPE_CHOICES, default='CASH')
    reward_logic = models.CharField(max_length=20, choices=REWARD_LOGIC_CHOICES, default='PER_TASK')
    reward_config = models.JSONField(default=dict, blank=True, help_text="Config for rewards: {'tasks': {'task_id': 10}, 'visits': {'visit_id': 50}, 'full_study': 100}")

    # Enrollment Targets
    target_subjects = models.IntegerField(default=0, verbose_name="Target Randomized Subjects")
    target_screened = models.IntegerField(default=0)
    target_eligible = models.IntegerField(default=0)
    target_consented = models.IntegerField(default=0)
    target_randomized = models.IntegerField(default=0)
    target_active = models.IntegerField(default=0)
    target_completed = models.IntegerField(default=0)

    # Actual Counts
    actual_screened = models.IntegerField(default=0)
    actual_eligible = models.IntegerField(default=0)
    actual_consented = models.IntegerField(default=0)
    actual_randomized = models.IntegerField(default=0)
    actual_active = models.IntegerField(default=0)
    actual_completed = models.IntegerField(default=0)
    actual_dropped = models.IntegerField(default=0)

    # Operational Settings
    portal_enabled = models.BooleanField(default=True)
    lead_intake_enabled = models.BooleanField(default=True)
    scheduling_enabled = models.BooleanField(default=False)
    compensation_enabled = models.BooleanField(default=False)
    show_lab_upload = models.BooleanField(default=False)
    notifications_enabled = models.BooleanField(default=True)
    show_dosing_log = models.BooleanField(default=True)
    show_ae_report = models.BooleanField(default=True)
    
    # Legacy field - moved to ConsentTemplate model
    consent_template_file = models.FileField(upload_to='consent_templates/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['created_at']  # Oldest first — first study created appears at the top everywhere

    def __hash__(self) -> int:
        # Patch for Django 6.x + MongoDB crash during migration construction
        pk = getattr(self, 'pk', None)
        if pk is None:
            return id(self)
        try:
            return hash(str(pk))
        except Exception:
            return id(self)

    @property
    def avg_screener_duration(self):
        """Calculates the average time leads spend on the screener for this study."""
        leads = Lead.objects.filter(study_id=self.id)
        valid_leads = [l for l in leads if l.metadata.get('performance', {}).get('total_seconds')]
        if not valid_leads:
            return 0
        total = sum(l.metadata['performance']['total_seconds'] for l in valid_leads)
        return total / len(valid_leads)

    def __str__(self):
        return f"{self.protocol_id} - {self.title}"

class News(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    type = models.CharField(max_length=50, blank=True)
    published_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='news_images/', null=True, blank=True)

class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateTimeField()
    image = models.ImageField(upload_to='event_images/', null=True, blank=True)

class FacilityInquiry(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    company = models.CharField(max_length=255, blank=True)
    inquiry_type = models.CharField(max_length=100, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Candidate(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    password = models.CharField(max_length=128)
    resume = models.FileField(upload_to='resumes/')
    applied_at = models.DateTimeField(auto_now_add=True)

class StudyAssignment(models.Model):
    """Links Users to Studies with specific hierarchy/access roles"""
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='assignments', db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='study_assignments', db_index=True)
    role = models.CharField(max_length=30, choices=[
        ('PI', 'Principal Investigator'),
        ('COORDINATOR', 'Clinical Coordinator'),
        ('SPONSOR_ADMIN', 'Sponsor Admin'),
        ('SPONSOR_MANAGER', 'Study Manager'),
        ('SPONSOR_VIEWER', 'Sponsor Viewer'),
    ])
    date_assigned = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        unique_together = ('study', 'user', 'role')

class Document(BaseMongoModel):
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='study_docs/')
    version = models.CharField(max_length=20, default='1.0')
    visibility = models.JSONField(default=list, blank=True, help_text="List of roles that can see this document: SPONSOR, PARTICIPANT, PI, COORDINATOR")
    is_archived = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} (v{self.version})"

class ProgressReport(BaseMongoModel):
    """Formal study progress and safety reports for Sponsors"""
    REPORT_TYPES = [('PROGRESS', 'Progress'), ('SAFETY', 'Safety'), ('FINAL', 'Final')]
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='progress_reports')
    name = models.CharField(max_length=255)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, default='PROGRESS')
    report_date = models.DateField()
    file = models.FileField(upload_to='study_reports/')
    status = models.CharField(max_length=20, default='SENT') # DRAFT, SENT, REVIEWED
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.study.protocol_id}"

class Participant(BaseMongoModel):
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='participants', db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='participant_records', db_index=True)
    
    # Section 18.3: unique study-linked ID
    participant_sid = models.CharField(max_length=50, unique=False, verbose_name="Participant Study ID", db_index=True)
    
    # Enrollment Tracking
    status = models.CharField(max_length=30, default='NEW', db_index=True, choices=[
        ('RECRUITING', 'Recruiting'),
        ('PENDING_REVIEW', 'Pending Review'),
        ('ELIGIBLE', 'Eligible'),
        ('INELIGIBLE', 'Not Eligible'),
        ('ENROLLED', 'Enrolled'),
        ('CONSENTED', 'Consented'),
        ('RANDOMIZED', 'Randomized'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Study Completed'),
        ('DROPPED', 'Dropped'),
    ])

    # Eligibility Form Data
    eligibility_data = models.JSONField(default=dict, blank=True, help_text="Stored results from the eligibility/screener form")
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    # Review & Approval Infrastructure (Requirement 3)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_participants')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    status_notes = models.TextField(blank=True, help_text="Notes from PI/Coordinator regarding status changes")

    coordinator_approved = models.BooleanField(default=False)
    coordinator_approved_at = models.DateTimeField(null=True, blank=True)
    coordinator_signature = models.TextField(blank=True, null=True, help_text="Base64 signature of the coordinator")
    
    pi_approved = models.BooleanField(default=False)
    pi_approved_at = models.DateTimeField(null=True, blank=True)
    pi_signature = models.TextField(blank=True, null=True, help_text="Base64 signature of the PI")
    
    approval_status = models.CharField(max_length=50, default='PENDING_INITIAL_REVIEW', choices=[
        ('PENDING_INITIAL_REVIEW', 'Pending Initial Review'),
        ('COORDINATOR_REVIEWED', 'Reviewed by Coordinator (Pending PI)'),
        ('PI_REVIEWED', 'Reviewed by PI (Pending Coordinator)'),
        ('FULLY_APPROVED', 'Fully Approved & Enrolled'),
        ('REJECTED', 'Rejected / Ineligible'),
    ])
    
    # Demographics (PII - only visible to Admin/PI/Coordinator)
    gender = models.CharField(max_length=20, blank=True)
    dob = models.DateField(null=True, blank=True)
    
    # Assignment
    assigned_arm = models.ForeignKey('InterventionArm', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Audit trail fields
    is_locked = models.BooleanField(default=False)
    completion_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta(BaseMongoModel.Meta):
        # Optimize dashboard queries: get participant by user or by study+user
        indexes = [
            models.Index(fields=['user', '-created_at']),  # For fetching user's participants
            models.Index(fields=['study', 'status']),       # For stats queries
            models.Index(fields=['study', 'user']),          # For enrollment checks
        ]
        unique_together = ('study', 'participant_sid')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.participant_sid} ({self.study.protocol_id})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Invalidate related caches when participant record is updated
        if self.user_id:
            from .utils.cache_utils import invalidate_cache
            invalidate_cache("participant_dashboard", user_id=self.user_id)
            invalidate_cache("participant_me", user_id=self.user_id)
            invalidate_cache("participants_list", user_id=self.user_id)

class InterventionArm(BaseMongoModel):
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='arms')
    name = models.CharField(max_length=100) # Group A, Group B
    description = models.TextField(blank=True)
    regimen = models.TextField(blank=True)

    def __str__(self):
        return f"{self.study.protocol_id} - {self.name}"

class Visit(BaseMongoModel):
    VISIT_TYPES = [
        ('SCREENING', 'Screening Visit'),
        ('BASELINE', 'Baseline Visit'),
        ('FOLLOW_UP', 'Follow-up Visit'),
        ('FINAL', 'Final Visit'),
        ('UNSCHEDULED', 'Unscheduled Visit'),
        ('ONBOARDING', 'Onboarding Call'),
    ]

    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='visits', db_index=True)
    scheduled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='scheduled_visits')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_visits', help_text="Staff who performed/completed the visit")
    visit_type = models.CharField(max_length=100) # relaxed choices
    scheduled_date = models.DateTimeField()
    actual_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='SCHEDULED', choices=[
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('MISSED', 'Missed'),
        ('CANCELLED', 'Cancelled'),
    ])
    location_address = models.TextField(blank=True, help_text="Specific address or room for this visit")
    
    # Clinical Measures & Protocol State
    notes = models.TextField(blank=True)
    location = models.CharField(max_length=100, default='Clinic') # relaxed choices
    
    # High-Density Data Blobs (JSON for flexibility in clinical assessments)
    checklist = models.JSONField(default=list, blank=True)
    assessments = models.JSONField(default=list, blank=True)
    measurements = models.JSONField(default=dict, blank=True) # Vitals: weight, height, bp, hr, temp
    deviations = models.JSONField(default=list, blank=True)
    samples = models.JSONField(default=list, blank=True)
    dispensing = models.JSONField(default=list, blank=True)
    
    # Authorization
    pi_approved = models.BooleanField(default=False)
    locked = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.notes and not self.notes.startswith('gAAAA'):
            self.notes = encrypt_data(self.notes)
        super().save(*args, **kwargs)

    @property
    def decrypted_notes(self):
        return decrypt_data(self.notes)

    def __str__(self):
        return f"{self.participant.participant_sid} - {self.visit_type}"

    class Meta(BaseMongoModel.Meta):
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['participant', '-scheduled_date']),
            models.Index(fields=['status']),
        ]

class Form(BaseMongoModel):
    """Dynamic form definition for questionnaires"""
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='forms')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    schema = models.JSONField(help_text="JSON representation of fields and conditional logic")
    
    is_published = models.BooleanField(default=False)
    is_required_on_enrollment = models.BooleanField(default=False, help_text="Automatically assign this form to participants upon enrollment")
    version = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} v{self.version}"

class QuestionnaireTemplate(BaseMongoModel):
    name = models.CharField(max_length=255)
    pdf_file = models.FileField(upload_to='questionnaire_pdfs/', null=True, blank=True)
    json_structure = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class StudyQuestionnaire(BaseMongoModel):
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='study_questionnaires')
    template = models.ForeignKey(QuestionnaireTemplate, on_delete=models.CASCADE)
    mode = models.CharField(max_length=20, choices=[('PDF', 'Full PDF'), ('STRUCTURED', 'Structured Questions')], default='STRUCTURED')
    repeat_type = models.CharField(max_length=20, choices=[('DAILY', 'Daily'), ('WEEKLY', 'Weekly'), ('MONTHLY', 'Monthly'), ('CUSTOM', 'Custom')], default='MONTHLY', help_text="Deprecated: Use frequency_interval and frequency_unit instead.")
    frequency_interval = models.IntegerField(default=1, help_text="Number of units between occurrences")
    frequency_unit = models.CharField(max_length=10, choices=[('DAYS', 'Days'), ('WEEKS', 'Weeks'), ('MONTHS', 'Months')], default='WEEKS')
    repeat_count = models.IntegerField(default=1, help_text="Total number of times to repeat")
    schedule_name = models.CharField(max_length=255, blank=True, null=True, help_text="Custom name for the schedule")
    
    # Advanced Window Logic
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    relative_to_enrollment = models.BooleanField(default=False, help_text="Calculate dates relative to participant enrollment date")
    
    window_open_time = models.TimeField(null=True, blank=True, help_text="Time of day window opens (e.g. 08:00)")
    window_close_time = models.TimeField(null=True, blank=True, help_text="Time of day window closes (e.g. 20:00)")
    allow_late_submission = models.BooleanField(default=True)
    
    show_answers_to_participant = models.BooleanField(default=True)
    allow_participant_download = models.BooleanField(default=False, help_text="Allow participants to download their completed response as PDF")
    notify_staff_on_submission = models.BooleanField(default=True, help_text="Notify PI and Coordinator when a response is submitted")
    created_at = models.DateTimeField(auto_now_add=True)

    def generate_instances_for_participant(self, participant):
        from datetime import timedelta, datetime
        base_date = self.start_date or self.study.start_date or participant.created_at.date()
        if self.relative_to_enrollment:
            base_date = participant.created_at.date()

        # Step 1: Pre-calculate all target dates
        target_dates_map = {}
        for i in range(self.repeat_count):
            offset_days = 0
            if self.frequency_interval and self.frequency_unit:
                if self.frequency_unit == 'DAYS': offset_days = i * self.frequency_interval
                elif self.frequency_unit == 'WEEKS': offset_days = i * 7 * self.frequency_interval
                elif self.frequency_unit == 'MONTHS': offset_days = i * 30 * self.frequency_interval
            else:
                if self.repeat_type == 'DAILY': offset_days = i
                elif self.repeat_type == 'WEEKLY': offset_days = i * 7
                elif self.repeat_type == 'MONTHLY': offset_days = i * 30
            
            target_date = base_date + timedelta(days=offset_days)
            target_dates_map[target_date] = {
                'open': datetime.combine(target_date, self.window_open_time) if self.window_open_time else None,
                'close': datetime.combine(target_date, self.window_close_time) if self.window_close_time else None
            }

        # Step 2: Fetch existing instances in ONE query
        existing_dates = set(QuestionnaireScheduleInstance.objects.filter(
            study_questionnaire=self,
            participant=participant,
            scheduled_date__in=target_dates_map.keys()
        ).values_list('scheduled_date', flat=True))

        # Step 3: Identify missing instances and bulk_create
        new_instances = []
        for date, windows in target_dates_map.items():
            if date not in existing_dates:
                new_instances.append(QuestionnaireScheduleInstance(
                    study_questionnaire=self,
                    participant=participant,
                    scheduled_date=date,
                    window_open_at=windows['open'],
                    window_close_at=windows['close']
                ))
        
        if new_instances:
            QuestionnaireScheduleInstance.objects.bulk_create(new_instances)


    def __str__(self):
        return f"{self.study.protocol_id} - {self.template.name}"

class QuestionnaireScheduleInstance(BaseMongoModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('LATE', 'Late Submission'),
        ('MISSED', 'Missed Window'),
        ('EXPIRED', 'Expired'),
    ]

    study_questionnaire = models.ForeignKey(StudyQuestionnaire, on_delete=models.CASCADE, related_name='instances')
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='scheduled_questionnaires')
    scheduled_date = models.DateField(db_index=True)
    
    # Precise timing windows
    window_open_at = models.DateTimeField(null=True, blank=True)
    window_close_at = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    lateness_minutes = models.IntegerField(default=0, help_text="Minutes submitted after window_close_at")
    
    response_data = models.JSONField(default=dict, blank=True)
    response_file = models.FileField(upload_to='questionnaire_responses/', null=True, blank=True)
    
    reminder_count = models.IntegerField(default=0)
    last_reminder_at = models.DateTimeField(null=True, blank=True)

    # Multi-signatory clinical completion
    participant_signature = models.TextField(blank=True, null=True)
    participant_signed_at = models.DateTimeField(null=True, blank=True)
    
    coordinator_signature = models.TextField(blank=True, null=True)
    coordinator_signed_at = models.DateTimeField(null=True, blank=True)
    
    pi_signature = models.TextField(blank=True, null=True)
    pi_signed_at = models.DateTimeField(null=True, blank=True)
    
    signed_pdf = models.FileField(upload_to='signed_questionnaires/', null=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        
        # Trigger PDF generation on completion if it's a PDF-mode instrument
        if self.status == 'COMPLETED' and not self.signed_pdf:
            from .utils.pdf_utils import generate_signed_questionnaire_pdf
            try:
                generate_signed_questionnaire_pdf(self)
                super().save(update_fields=['signed_pdf'])
            except Exception as e:
                print(f"Instrument PDF Generation Error: {e}")

    def __str__(self):
        return f"{self.participant.participant_sid} - {self.study_questionnaire.template.name} ({self.scheduled_date}) - {self.status}"

class FormResponse(BaseMongoModel):
    form = models.ForeignKey(Form, on_delete=models.CASCADE)
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='form_responses')
    visit = models.ForeignKey(Visit, on_delete=models.SET_NULL, null=True, blank=True)
    
    data = models.JSONField(help_text="Stored answers")
    is_complete = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-submitted_at']

class Task(BaseMongoModel):
    """Protocol-defined activities (Surveys, Logs, Sensors)"""
    TASK_TYPES = [
        ('SURVEY', 'Questionnaire / Survey'),
        ('LOG', 'Daily Log (Symptoms/Meds)'),
        ('SENSOR', 'Device / Sensor Data'),
        ('UPLOAD', 'File Upload / Photo'),
        ('CONSENT', 'Informed Consent'),
        ('FORM_SIGNATURE', 'Form Signature Workflow'),
    ]
    
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    task_type = models.CharField(max_length=20, choices=TASK_TYPES, default='SURVEY', null=True, blank=True)
    frequency = models.CharField(max_length=20, choices=[
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('BIWEEKLY', 'Bi-Weekly'),
        ('MONTHLY', 'Monthly'),
        ('ONCE', 'One-time'),
    ])
    
    # Optional link to a dynamic form
    form = models.ForeignKey(Form, on_delete=models.SET_NULL, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-created_at']

    # UI Configuration for Participant Portal
    show_dosing_log = models.BooleanField(default=True)
    show_ae_report = models.BooleanField(default=True)
    show_lab_upload = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.title} ({self.frequency})"

class ParticipantTask(BaseMongoModel):
    """Instance of a task assigned to a participant with a specific window"""
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='assigned_tasks', db_index=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, db_index=True)
    
    due_date = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING', choices=[
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('MISSED', 'Missed'),
        ('IN_PROGRESS', 'In Progress'),
    ])
    
    # New fields for Advanced Portal UX
    visit_name = models.CharField(max_length=100, default='Visit 1 (Baseline)')
    timeline_group = models.CharField(max_length=50, default='Day 0')
    estimated_time = models.CharField(max_length=20, default='15 min')
    is_locked = models.BooleanField(default=False)
    
    # Store dynamic state for multi-step tasks if needed
    current_data = models.JSONField(default=dict, blank=True)
    assigned_form = models.ForeignKey('AssignedForm', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')

    class Meta(BaseMongoModel.Meta):
        ordering = ['due_date']
        indexes = [
            models.Index(fields=['participant', 'status', 'due_date']),
            models.Index(fields=['is_locked']),
        ]

    def __str__(self):
        return f"{self.participant.participant_sid} - {self.task.title}"

    @property
    def is_overdue(self):
        from django.utils.timezone import now
        return self.status != 'COMPLETED' and self.due_date < now()

    def check_and_lock(self):
        if self.is_overdue and not self.is_locked:
            self.is_locked = True
            self.save(update_fields=['is_locked'])
            # Create a StaffTask for PI/Coordinator to alert them
            from .models import StaffTask
            StaffTask.objects.create(
                user=self.participant.study.coordinator or self.participant.study.pi,
                study=self.participant.study,
                title=f"ALERT: Task Overdue for {self.participant.participant_sid}",
                description=f"Task '{self.task.title}' reached its deadline and has been locked for security.",
                task_type='OVERDUE_ALERT',
                reference_id=str(self.id),
                due_date=timezone.now() + timezone.timedelta(hours=48),
                status='NEW'
            )
            return True
        return False

class StaffTask(BaseMongoModel):
    """Tasks assigned to Staff members (PIs, Coordinators)"""
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('IN_PROGRESS', 'In Progress'),
        ('ADDRESSED', 'Addressed'),
        ('OVERDUE', 'Overdue'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_tasks')
    study = models.ForeignKey(Study, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    task_type = models.CharField(max_length=50, default='CONSENT_SIGNATURE')
    reference_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    is_completed = models.BooleanField(default=False)
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['study', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} for {self.user.email}"

class ConsentTemplate(BaseMongoModel):
    """Protocol definition for Informed Consent (Signatory requirements, versions, etc.)"""
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='consent_templates')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    version = models.CharField(max_length=20, default='1.0')
    status = models.CharField(max_length=20, default='DRAFT', choices=[
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('ARCHIVED', 'Archived')
    ])
    
    # Requirements Matrix
    require_participant_sig = models.BooleanField(default=True)
    require_cc_verification = models.BooleanField(default=True)
    require_pi_signoff = models.BooleanField(default=True)
    require_witness = models.BooleanField(default=False)
    require_lar = models.BooleanField(default=False)
    require_initials_on_pages = models.BooleanField(default=False)
    require_initial_sections = models.BooleanField(default=False)
    
    # Rules
    must_scroll_full = models.BooleanField(default=True)
    must_answer_quiz = models.BooleanField(default=False)
    
    # Data fields
    terms_content = models.TextField(blank=True, help_text="Textual terms displayed for participant review if no PDF is used or as a summary.")
    irb_number = models.CharField(max_length=100, blank=True)
    irb_approval_date = models.DateField(null=True, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    expiration_date = models.DateField(null=True, blank=True)
    
    file = models.FileField(upload_to='consent_templates/', null=True, blank=True)
    page_count = models.IntegerField(default=1)
    
    # Coordinates for signatures/initials {"f1": {"type": "p_sig", "page": 12, "x": 15, "y": 80}, ...}
    placed_fields = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-version']

    def __str__(self):
        return f"{self.title} v{self.version} ({self.study.protocol_id})"

class Consent(BaseMongoModel):
    """Immutable record of electronic informed consent (eConsent)"""
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='consent_records', db_index=True)
    template = models.ForeignKey(ConsentTemplate, on_delete=models.PROTECT, related_name='executions', null=True, db_index=True)
    participant = models.ForeignKey(Participant, on_delete=models.SET_NULL, null=True, blank=True, related_name='consent_records', db_index=True)
    
    full_name = models.CharField(max_length=255, verbose_name="Electronic Signature")
    email = models.EmailField()
    
    agreed_at = models.DateTimeField(auto_now_add=True)
    participant_signed_at = models.DateTimeField(null=True, blank=True)
    participant_signature = models.TextField(blank=True, null=True)
    
    # Coordinator Section
    cc_name = models.CharField(max_length=255, blank=True, null=True)
    cc_signature = models.TextField(blank=True, null=True)
    cc_verified = models.BooleanField(default=False)
    cc_verified_at = models.DateTimeField(null=True, blank=True)
    cc_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='cc_consents')
    
    # PI Section
    pi_name = models.CharField(max_length=255, blank=True, null=True)
    pi_signature = models.TextField(blank=True, null=True)
    pi_verified = models.BooleanField(default=False)
    pi_verified_at = models.DateTimeField(null=True, blank=True)
    pi_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='pi_consents')
    
    device_hash = models.CharField(max_length=255, blank=True, help_text="Anonymous browser fingerprint")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timezone_detected = models.CharField(max_length=100, blank=True)
    
    signed_pdf = models.FileField(upload_to='signed_consents/', null=True, blank=True)
    is_valid = models.BooleanField(default=True)
    
    # Metadata for the signed event
    audit_trail = models.JSONField(default=list, blank=True) # [{"action": "SIGNED", "time": "...", "user": "..."}]

    IS_VALID_CHOICES = [
        ('PENDING', 'Pending Participant Signature'),
        ('PARTIALLY_SIGNED', 'Signed by Participant (Awaiting Coordinator)'),
        ('AWAITING_PI', 'Signed by Coordinator (Awaiting PI Signature)'),
        ('FULLY_SIGNED', 'Fully Executed (Signed by All)'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired / Superseded')
    ]
    signing_status = models.CharField(max_length=30, choices=IS_VALID_CHOICES, default='PENDING')

    def __str__(self):
        status_label = dict(self.IS_VALID_CHOICES).get(self.signing_status, 'Unknown')
        return f"Consent: {self.full_name} ({self.study.protocol_id}) - {status_label}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_pi_verified = False

        if not is_new:
            try:
                db_record = Consent.objects.get(pk=self.pk)
                old_pi_verified = db_record.pi_verified
                old_cc_verified = db_record.cc_verified
            except Consent.DoesNotExist:
                pass

        # ── NEW RECORD: mutate fields BEFORE the single super().save() ──
        if is_new and self.participant:
            from django.utils.timezone import now as _now
            self.signing_status = 'PARTIALLY_SIGNED'
            if not self.participant_signed_at:
                self.participant_signed_at = _now()
            # Append to audit trail (avoid duplicates already set by view)
            if not any(e.get('action') == 'PARTICIPANT_SIGNED' and e.get('role') == 'PARTICIPANT' for e in self.audit_trail):
                self.audit_trail.append({
                    "action": "PARTICIPANT_SIGNED",
                    "time": _now().isoformat(),
                    "actor": self.full_name,
                    "role": "PARTICIPANT"
                })

        # ── SINGLE authoritative save ──
        super().save(*args, **kwargs)

        # ── POST-SAVE side effects for new records ──
        if is_new and self.participant:
            from django.utils.timezone import now as _now
            # Mark consent tasks complete
            tasks = ParticipantTask.objects.filter(
                participant=self.participant,
                task__task_type='CONSENT',
                status__in=['PENDING', 'IN_PROGRESS']
            )
            for pt in tasks:
                pt.status = 'COMPLETED'
                pt.completed_at = _now()
                pt.save()

            # StaffTask notification for Coordinator
            try:
                from .models import StaffTask
                if self.study and self.study.coordinator:
                    StaffTask.objects.create(
                        user=self.study.coordinator,
                        study=self.study,
                        title="Review Required: Consent Signed by Participant",
                        description=f"Participant {self.participant.participant_sid} has signed the consent form. Coordinator signature required.",
                        task_type='CONSENT_COORDINATOR_SIGN',
                        reference_id=str(self.id)
                    )
            except Exception as e:
                print(f"StaffTask creation error: {e}")

            # Generate initial signed PDF
            try:
                from .utils.pdf_utils import generate_signed_consent_pdf
                generate_signed_consent_pdf(self)
            except Exception as e:
                print(f"PDF Generation Error (Initial): {e}")

        # ── POST-SAVE side effects for CC sign transition ──
        if not is_new and self.cc_verified and not old_cc_verified:
            from django.utils.timezone import now as _now
            
            # Check if PI verification is required
            requires_pi = False
            if self.template:
                requires_pi = self.template.require_pi_signoff
            
            if requires_pi and not self.pi_verified:
                self.signing_status = 'AWAITING_PI'
                # StaffTask notification for PI
                try:
                    from .models import StaffTask
                    if self.study and self.study.pi:
                        StaffTask.objects.get_or_create(
                            user=self.study.pi,
                            study=self.study,
                            task_type='CONSENT_SIGNATURE',
                            reference_id=str(self.id),
                            defaults={
                                'title': "PI Verification Required",
                                'description': f"Consent co-signed by coordinator for participant {self.participant.participant_sid}. Your final verification is required."
                            }
                        )
                except Exception as e:
                    print(f"PI StaffTask error: {e}")
            elif not requires_pi or self.pi_verified:
                self.signing_status = 'FULLY_SIGNED'

            if not self.cc_verified_at:
                self.cc_verified_at = _now()
            
            self.audit_trail.append({
                "action": "COORDINATOR_SIGNED",
                "time": self.cc_verified_at.isoformat(),
                "actor": self.cc_name or "Coordinator",
                "role": "COORDINATOR"
            })
            super().save(update_fields=['signing_status', 'cc_verified_at', 'audit_trail'])

        # ── POST-SAVE side effects for PI sign transition ──
        if not is_new and self.pi_verified and not old_pi_verified:
            from django.utils.timezone import now as _now
            self.signing_status = 'FULLY_SIGNED'
            if not self.pi_verified_at:
                self.pi_verified_at = _now()
            
            self.audit_trail.append({
                "action": "PI_VERIFIED",
                "time": self.pi_verified_at.isoformat(),
                "actor": self.pi_name or "Principal Investigator",
                "role": "PI"
            })
            super().save(update_fields=['signing_status', 'pi_verified_at', 'audit_trail'])

        # ── Archival logic for when it becomes FULLY_SIGNED ──
        if not is_new and self.signing_status == 'FULLY_SIGNED' and ((self.cc_verified and not old_cc_verified) or (self.pi_verified and not old_pi_verified)):
            try:
                from .utils.pdf_utils import generate_signed_consent_pdf
                generate_signed_consent_pdf(self)
                if self.signed_pdf:
                    from .models import Document
                    doc_title = f"Executed Consent - {self.study.protocol_id}"
                    Document.objects.update_or_create(
                        study=self.study,
                        title=doc_title,
                        defaults={
                            'file': self.signed_pdf,
                            'visibility': ['PARTICIPANT', 'COORDINATOR', 'PI'],
                            'version': '1.0 (Signed)'
                        }
                    )
            except Exception as e:
                print(f"Archival Error: {e}")

# ─────────────────────────────────────────────────────────
# NEW MODELS FOR FULL BUILD PROMPT
# ─────────────────────────────────────────────────────────

class Lead(BaseMongoModel):
    """Recruitment tracking for potential participants"""
    LEAD_STATUS = [
        ('NEW', 'New'),
        ('ATTEMPTED', 'Contact Attempted'),
        ('NO_ANSWER', 'No Answer'),
        ('NOT_INTERESTED', 'Not Interested'),
        ('INTERESTED', 'Interested'),
        ('NEEDS_INFO', 'Needs More Info'),
        ('PRESCREENING', 'Prescreening in Progress'),
        ('ELIGIBLE', 'Eligible'),
        ('INELIGIBLE', 'Ineligible'),
        ('SCHEDULED', 'Scheduled'),
        ('CONSENTED', 'Consented'),
        ('RANDOMIZED', 'Randomized'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
    ]
    
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='leads')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    source = models.CharField(max_length=100, default='ONLINE_INTAKE') # ONLINE, OFFLINE, REFERRAL, etc.
    status = models.CharField(max_length=30, choices=LEAD_STATUS, default='NEW')
    assigned_coordinator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.status})"

class CommunicationLog(BaseMongoModel):
    """Log of all outreach attempts (Calls, Texts, Emails)"""
    COM_TYPES = [('CALL', 'Call'), ('SMS', 'Text Message'), ('EMAIL', 'Email')]
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, null=True, blank=True)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, null=True, blank=True)
    coordinator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    type = models.CharField(max_length=10, choices=COM_TYPES)
    direction = models.CharField(max_length=10, choices=[('OUTBOUND', 'Outbound'), ('INBOUND', 'Inbound')], default='OUTBOUND')
    outcome = models.CharField(max_length=255) # Spoke, Left Message, Busy, No Answer, etc.
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

class Compensation(BaseMongoModel):
    """Participant rewards and payments registry"""
    PAY_METHODS = [
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('STIPEND_CARD', 'Stipend Card'), 
        ('CASH', 'Cash'), 
        ('CHECK', 'Check'),
        ('COUPON', 'Coupon / Voucher')
    ]
    TRANS_TYPES = [
        ('TASK_COMPLETION', 'Task Completion'),
        ('VISIT_COMPLETION', 'Visit Completion'),
        ('STUDY_COMPLETION', 'Study Completion'),
        ('BONUS', 'Milestone Bonus'),
        ('OTHER', 'Other Incentive')
    ]
    
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='compensation')
    study = models.ForeignKey(Study, on_delete=models.CASCADE, null=True, blank=True, related_name='all_compensations')
    visit = models.ForeignKey(Visit, on_delete=models.SET_NULL, null=True, blank=True)
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True)
    
    transaction_type = models.CharField(max_length=30, choices=TRANS_TYPES, default='TASK_COMPLETION')
    description = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='PENDING', choices=[
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled')
    ])
    payment_method = models.CharField(max_length=30, choices=PAY_METHODS, default='CASH')
    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.participant.participant_sid} - {self.transaction_type} - ${self.amount}"

class LabResult(BaseMongoModel):
    """Clinical test data uploads"""
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='lab_results', db_index=True)
    test_name = models.CharField(max_length=255)
    value = models.CharField(max_length=100)
    units = models.CharField(max_length=50, blank=True)
    lab_date = models.DateField()
    status = models.CharField(max_length=20, default='RESULTED', choices=[
        ('SHIPPED', 'Shipped'),
        ('PROCESSING', 'Processing'),
        ('RESULTED', 'Resulted'),
        ('ALERT', 'Alert')
    ])
    is_critical = models.BooleanField(default=False)
    document = models.FileField(upload_to='lab_reports/', null=True, blank=True)
    is_released = models.BooleanField(default=False)
    released_at = models.DateTimeField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class DataAuditLog(BaseMongoModel):
    """Protocol-compliant audit trail for system and clinical actions"""
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    model_name = models.CharField(max_length=100, db_index=True)
    record_id = models.CharField(max_length=100, db_index=True) # Usually the participant_sid or object ID
    
    # Store changes as JSON: {"field": {"old": val, "new": val}}
    changes = models.JSONField(default=dict, blank=True)
    details = models.TextField(blank=True, help_text="Human-readable description of the action")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['model_name', 'record_id']),
            models.Index(fields=['action', 'timestamp']),
        ]

class PermissionMatrix(BaseMongoModel):
    """Dynamic RBAC control configurable by Super Admin"""
    role = models.CharField(max_length=30)
    capability = models.CharField(max_length=100) # e.g., 'EDIT_STUDY_STATUS', 'CREATE_FORM'
    is_allowed = models.BooleanField(default=False)

    class Meta(BaseMongoModel.Meta):
        unique_together = ('role', 'capability')

class Notification(BaseMongoModel):
    """Real-time system alerts and message notifications for users"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, default='INFO') # INFO, SUCCESS, WARNING, ERROR, MESSAGE
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title} ({'Read' if self.is_read else 'Unread'})"

@receiver(post_save, sender=QuestionnaireScheduleInstance)
def notify_on_questionnaire_completion(sender, instance, created, **kwargs):
    """Notify PI and Coordinator when a participant completes a questionnaire"""
    if not created and instance.status == 'COMPLETED' and instance.study_questionnaire.notify_staff_on_submission:
        study = instance.participant.study
        if not study: return
        
        staff_team = [study.pi, study.coordinator]
        sid = instance.participant.participant_sid
        instrument_name = instance.study_questionnaire.template.name
        
        for staff in filter(None, staff_team):
            Notification.objects.create(
                user=staff,
                title="Questionnaire Submitted",
                message=f"Participant {sid} has completed the '{instrument_name}' assessment.",
                type="SUCCESS",
                link=f"/dashboard/coordinator/participants/{instance.participant.id}/assessments"
            )

class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    user_type = models.CharField(max_length=20, choices=[('BUSINESS', 'Business'), ('INDIVIDUAL', 'Individual')], default='BUSINESS')
    is_subscribed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} ({self.user_type})"

class AssignedForm(BaseMongoModel):
    """Workflow tracking for multi-signatory forms (Participant -> Coordinator -> PI)"""
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='assigned_forms')
    form = models.ForeignKey(Form, on_delete=models.CASCADE)
    study = models.ForeignKey(Study, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=30, default='PENDING', choices=[
        ('PENDING', 'Pending'),
        ('PARTICIPANT_SIGNED', 'Participant Signed'),
        ('COORDINATOR_SIGNED', 'Coordinator Signed'),
        ('COMPLETED', 'Fully Completed'),
    ])
    
    # Signature Data
    participant_signature = models.TextField(blank=True, null=True)
    participant_signed_at = models.DateTimeField(null=True, blank=True)
    
    coordinator_signature = models.TextField(blank=True, null=True)
    coordinator_signed_at = models.DateTimeField(null=True, blank=True)
    coordinator_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='coordinator_assigned_forms')
    
    pi_signature = models.TextField(blank=True, null=True)
    pi_signed_at = models.DateTimeField(null=True, blank=True)
    pi_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='pi_assigned_forms')
    
    # Form Results (Snapshot of the data at time of participant signature)
    data = models.JSONField(default=dict, blank=True, help_text="Stored answers from the form")
    signed_pdf = models.FileField(upload_to='signed_forms/', null=True, blank=True)
    
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-created_at']

    def __str__(self):
        return f"Assigned Form: {self.form.title} for {self.participant.participant_sid}"

# --- Signals for Notifications ---

@receiver(post_save, sender=News)
def notify_subscribers_on_news(sender, instance, created, **kwargs):
    if created:
        subject = f"New Update from MusB Research: {instance.title}"
        content = f"<p>A new research update has been posted.</p><h2>{instance.title}</h2><p>{instance.content[:200]}...</p><p><a href='https://musbresearch.com/news'>Read More at musbresearch.com</a></p>"
        from .utils.resend_utils import send_newsletter_update
        try:
            send_newsletter_update.delay(subject, content)
        except Exception as e:
            print(f"Error triggering newsletter update: {e}")

class BookletDownloadRequest(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    company = models.CharField(max_length=255)
    designation = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    technology_name = models.CharField(max_length=100)
    nda_agreed = models.BooleanField(default=False)
    downloaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.technology_name}"

class Partnership(BaseMongoModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    logo = models.ImageField(upload_to='partnership_logos/', max_length=1024, blank=True, null=True)
    link = models.URLField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='authored_partnerships')
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.status})"

class TeamMember(BaseMongoModel):
    CATEGORY_CHOICES = [
        ('leadership', 'Leadership'),
        ('advisors', 'Advisors'),
        ('staff', 'Operational Staff'),
    ]
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='staff')
    role = models.CharField(max_length=255, blank=True, default='')
    advisory_role = models.CharField(max_length=255, blank=True, default='')
    dept = models.CharField(max_length=255, blank=True, default='')
    expertise_area = models.CharField(max_length=255, blank=True, default='')
    organization = models.CharField(max_length=255, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    expanded_bio = models.TextField(blank=True, default='')
    expertise_tags = models.JSONField(default=list, blank=True)
    areas_of_expertise = models.JSONField(default=list, blank=True)
    affiliations = models.JSONField(default=list, blank=True)
    publications = models.JSONField(default=list, blank=True)
    image = models.CharField(max_length=512, blank=True, default='')
    linkedin_url = models.CharField(max_length=512, blank=True, default='')
    system_role = models.CharField(max_length=50, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['display_order', 'created_at']

    def __str__(self):
        return f"{self.name} ({self.category})"

class Publication(BaseMongoModel):
    title = models.CharField(max_length=255)
    authors = models.TextField()
    journal = models.CharField(max_length=255)
    publication_date = models.DateField()
    link = models.URLField(blank=True, null=True)
    abstract = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='authored_publications')
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"

class EducationMaterial(BaseMongoModel):
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    file = models.FileField(upload_to='education_materials/', blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='authored_education')
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"

class StudyInquiry(BaseMongoModel):
    """Sponsor-initiated inquiries for new clinical studies"""
    INQUIRY_STATUS = [
        ('PRELIMINARY', 'Preliminary Lead'),
        ('NDA_REQUESTED', 'NDA Requested'),
        ('NDA_SENT', 'NDA Sent'),
        ('NDA_EXECUTED', 'NDA Executed'),
        ('QUALIFIED', 'Qualified Lead'),
        ('PROPOSAL_STAGE', 'Proposal Stage'),
        ('CLOSED_LOST', 'Closed / Lost'),
    ]

    PRODUCT_CATEGORIES = [
        ('PROBIOTIC', 'Probiotic / Postbiotic'),
        ('NUTRACEUTICAL', 'Nutraceutical'),
        ('BOTANICAL', 'Botanical'),
        ('FUNCTIONAL_FOOD', 'Functional Food'),
        ('PHARMACEUTICAL', 'Pharmaceutical'),
        ('DEVICE', 'Device'),
        ('OTHER', 'Other'),
    ]

    DEVELOPMENT_STAGES = [
        ('CONCEPT', 'Concept'),
        ('PRECLINICAL', 'Preclinical Complete'),
        ('READY', 'Ready for Clinical'),
        ('MARKETED', 'Marketed Product Seeking Data'),
    ]

    TIMELINE_CHOICES = [
        ('IMMEDIATE', 'Immediate (0–3 months)'),
        ('3_6_MONTHS', '3–6 months'),
        ('6_12_MONTHS', '6–12 months'),
        ('EXPLORING', 'Exploring Options'),
    ]

    BUDGET_CHOICES = [
        ('UNDER_100K', '<$100K'),
        ('100K_250K', '$100K–$250K'),
        ('250K_500K', '$250K–$500K'),
        ('OVER_500K', '$500K+'),
        ('DISCUSS', 'Prefer to Discuss'),
    ]

    # Links
    sponsor_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='study_inquiries')
    
    # Step 1 Fields
    product_name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=PRODUCT_CATEGORIES)
    development_stage = models.CharField(max_length=50, choices=DEVELOPMENT_STAGES)
    needs = models.JSONField(default=list) # List of strings: New Study, Preclinical, etc.
    primary_focus = models.CharField(max_length=100, blank=True, default='')
    timeline = models.CharField(max_length=50, choices=TIMELINE_CHOICES)
    
    # NDA Fields
    nda_preference = models.CharField(max_length=10, choices=[('YES', 'Yes'), ('NO', 'No')], default='NO')
    legal_name = models.CharField(max_length=255, blank=True)
    signatory_name = models.CharField(max_length=255, blank=True)
    signatory_title = models.CharField(max_length=255, blank=True)
    corporate_address_deprecated = models.TextField(null=True, blank=True, db_column='corporate_address', default='') # Keep old column name for data safety during migration if needed
    street_address = models.TextField(null=True, blank=True, default='')
    city = models.CharField(max_length=100, null=True, blank=True, default='')
    state = models.CharField(max_length=100, null=True, blank=True, default='')
    zip_code = models.CharField(max_length=20, null=True, blank=True, default='')
    country = models.CharField(max_length=100, null=True, blank=True, default='')
    country_code = models.CharField(max_length=10, null=True, blank=True, default='')
    contact_email = models.EmailField(max_length=255, blank=True, null=True, default='')
    contact_person_name = models.CharField(max_length=255, blank=True, null=True, default='')
    contact_person_designation = models.CharField(max_length=255, blank=True, null=True, default='')
    contact_mobile = models.CharField(max_length=50, blank=True, null=True, default='')

    # Operational Address Fields
    has_operational_address = models.BooleanField(default=False)
    op_street_address = models.TextField(null=True, blank=True, default='')
    op_city = models.CharField(max_length=100, null=True, blank=True, default='')
    op_state = models.CharField(max_length=100, null=True, blank=True, default='')
    op_zip_code = models.CharField(max_length=20, null=True, blank=True, default='')
    op_country = models.CharField(max_length=100, null=True, blank=True, default='')

    @property
    def corporate_address(self):
        """Unified address string for display/legacy use."""
        parts = [self.street_address, self.city, self.state, self.zip_code, self.country]
        return ", ".join(filter(None, parts)) or self.corporate_address_deprecated
    
    # Step 2 Fields
    study_type_needed = models.JSONField(default=list) # Pilot, RCT, etc.
    target_population = models.TextField(blank=True)
    budget_range = models.CharField(max_length=50, choices=BUDGET_CHOICES, blank=True)
    services_needed = models.JSONField(default=list) # Recruitment, Lab, etc.
    project_description = models.TextField(blank=True)
    supporting_files = models.FileField(upload_to='inquiry_docs/', null=True, blank=True)
    
    # Discovery Call Scheduling
    discovery_call_date = models.DateField(null=True, blank=True, default=None)
    discovery_call_time = models.TimeField(null=True, blank=True, default=None)
    discovery_call_timezone = models.CharField(max_length=100, null=True, blank=True, default='')
    
    status = models.CharField(max_length=30, choices=INQUIRY_STATUS, default='PRELIMINARY')
    routing_target = models.CharField(max_length=100, blank=True) # sales@, lab@, etc.
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Inquiry: {self.product_name} ({self.legal_name or self.sponsor_user.email if self.sponsor_user else 'Unknown'})"

class ClinicalConversation(BaseMongoModel):
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='conversations')
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='clinical_conversations')
    
    status = models.CharField(max_length=30, choices=[
        ('UNREAD', 'Unread'),
        ('ACTION_REQUIRED', 'Action Required'),
        ('RESOLVED', 'Resolved'),
        ('OPEN', 'Open')
    ], default='OPEN')
    
    is_flagged = models.BooleanField(default=False)
    
    last_message_preview = models.TextField(blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_updated']

    def __str__(self):
        return f"Conversation: {self.participant.participant_sid} ({self.study.protocol_id})"

class ClinicalMessage(BaseMongoModel):
    conversation = models.ForeignKey(ClinicalConversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    text = models.TextField()
    tag = models.CharField(max_length=20, choices=[
        ('SAFETY', 'Safety'),
        ('PROTOCOL', 'Protocol'),
        ('ELIGIBILITY', 'Eligibility'),
        ('GENERAL', 'General')
    ], default='GENERAL')
    
    attachment = models.FileField(upload_to='clinical_attachments/', null=True, blank=True)
    is_from_pi = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

class DosingLog(BaseMongoModel):
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='dosing_logs')
    date = models.DateField()
    dose_taken = models.BooleanField(default=True)
    missed_reason = models.CharField(max_length=255, blank=True)
    side_effects = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        unique_together = ('participant', 'date')
        ordering = ['-date', '-created_at']

class DailyMedicationLog(BaseMongoModel):
    FEELING_CHOICES = [
        ('VERY_GOOD', 'Very Good'),
        ('GOOD', 'Good'),
        ('FAIR', 'Fair'),
        ('POOR', 'Poor'),
    ]
    SEVERITY_CHOICES = [
        ('MILD', 'Mild'),
        ('MODERATE', 'Moderate'),
        ('SEVERE', 'Severe'),
    ]

    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='daily_logs', db_index=True)
    date = models.DateField()
    
    # A. Medicine intake
    took_medicine = models.BooleanField(default=True)
    time_taken = models.TimeField(null=True, blank=True)
    full_dose = models.BooleanField(default=True)
    dose_amount = models.CharField(max_length=255, blank=True)
    reason_missed = models.TextField(blank=True)

    # B. Adverse events / side effects
    noticed_side_effects = models.BooleanField(default=False)
    side_effect_description = models.TextField(blank=True)
    side_effect_start_time = models.CharField(max_length=100, blank=True) # UI flexibility
    side_effect_ongoing = models.BooleanField(default=False)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, blank=True, null=True)
    interfered_daily_activities = models.BooleanField(default=False)
    sought_medical_care = models.BooleanField(default=False)
    ae_additional_comments = models.TextField(blank=True)

    # C. General health check
    overall_feeling = models.CharField(max_length=20, choices=FEELING_CHOICES, blank=True, null=True)
    health_updates = models.TextField(blank=True)
    supporting_file = models.FileField(upload_to='daily_log_files/', null=True, blank=True)
    
    is_draft = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('participant', 'date')
        ordering = ['-date']

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        
        # Invalidate related caches when a log is submitted/updated
        if self.participant and self.participant.user_id:
            try:
                from .utils.cache_utils import invalidate_cache
                invalidate_cache("participant_dashboard", user_id=self.participant.user_id)
            except Exception:
                pass

class AEReport(BaseMongoModel):
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='ae_reports')
    description = models.TextField()
    start_date = models.DateTimeField()
    is_ongoing = models.BooleanField(default=True)
    severity = models.CharField(max_length=20, choices=[
        ('MILD', 'Mild'),
        ('MODERATE', 'Moderate'),
        ('SEVERE', 'Severe'),
    ])
    action_taken = models.TextField(blank=True)
    related_to_product = models.CharField(max_length=20, choices=[
        ('YES', 'Yes'),
        ('NO', 'No'),
        ('UNSURE', 'Unsure'),
    ])
    attachment = models.FileField(upload_to='ae_reports/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-created_at']

@receiver(post_save, sender=FacilityInquiry)
def notify_team_on_facility_inquiry(sender, instance, created, **kwargs):
    if created:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admins = User.objects.filter(role='SUPER_ADMIN')
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title="New Facility Inquiry",
                message=f"New inquiry from {instance.name} ({instance.company})",
                type="MESSAGE",
                link="/admin/inquiries"
            )
        from .utils.resend_utils import send_facility_inquiry_email
        try:
            send_facility_inquiry_email(instance)
        except Exception as e:
            print(f"Error triggering facility inquiry email: {e}")

@receiver(post_save, sender=StudyInquiry)
def notify_on_study_inquiry(sender, instance, created, **kwargs):
    if created:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Notify Super Admins, PIs, and Coordinators
        recipients = User.objects.filter(role__in=['SUPER_ADMIN', 'PI', 'COORDINATOR'])
        
        role_link_map = {
            'SUPER_ADMIN': '/dashboard/admin/study-inquiries',
            'PI': '/dashboard/pi/alerts',
            'COORDINATOR': '/dashboard/coordinator/alerts',
        }
        
        for user in recipients:
            Notification.objects.create(
                user=user,
                title="New Study Proposal",
                message=f"New {instance.category} proposal for {instance.product_name}",
                type="MESSAGE",
                link=role_link_map.get((user.role or '').upper(), '/dashboard/coordinator/alerts')
            )
# ─────────────────────────────────────────────────────────
# SPONSOR INTELLIGENCE ALERTS (SIGNALS)
# ─────────────────────────────────────────────────────────

@receiver(post_save, sender=Study)
def notify_sponsor_on_study_update(sender, instance, created, **kwargs):
    """Notify sponsor when their study is launched or updated by PI/Admin"""
    if instance.sponsor:
        action = "launched" if created else "updated"
        Notification.objects.create(
            user=instance.sponsor,
            title=f"Study {action.capitalize()}: {instance.protocol_id}",
            message=f"Your study '{instance.title}' has been {action} by the clinical team. Status: {instance.get_status_display()}",
            type="SUCCESS" if instance.status == 'ACTIVE' else "INFO",
            link=f"/dashboard/sponsor/studies"
        )

@receiver(post_save, sender=Participant)
def notify_sponsor_on_new_enrollment(sender, instance, created, **kwargs):
    """Notify sponsor when a new participant joins or the enrollment target is met"""
    if created and instance.study and instance.study.sponsor:
        study = instance.study
        current_count = Participant.objects.filter(study=study).count()
        target = study.target_randomized or 100
        
        # Standard Enrollment Alert
        Notification.objects.create(
            user=study.sponsor,
            title="New Participant Enrolled",
            message=f"A new participant has joined {study.protocol_id}. Total: {current_count}/{target}",
            type="INFO",
            link="/dashboard/sponsor/participants"
        )
        
        # Final Participant Milestone Alert
        if current_count >= target:
             Notification.objects.create(
                user=study.sponsor,
                title="🚀 ENROLLMENT TARGET MET",
                message=f"Congratulations! {study.protocol_id} has reached its full enrollment target of {target} participants.",
                type="SUCCESS",
                link="/dashboard/sponsor/reports"
            )

@receiver(post_save, sender=StudyInquiry)
def notify_sponsor_on_inquiry_reply(sender, instance, created, **kwargs):
    """Notify sponsor when an admin updates/replies to their inquiry"""
    if not created and instance.sponsor_user:
        Notification.objects.create(
            user=instance.sponsor_user,
            title="Inquiry Update",
            message=f"There is a new update regarding your inquiry for '{instance.product_name}'. Status: {instance.get_status_display()}",
            type="MESSAGE",
            link="/dashboard/sponsor"
        )

@receiver(post_save, sender=Consent)
def notify_sponsor_on_new_consent_doc(sender, instance, created, **kwargs):
    """Notify sponsor when a new signed consent is available"""
    if created and instance.study and instance.study.sponsor:
        Notification.objects.create(
            user=instance.study.sponsor,
            title="New Consent Uploaded",
            message=f"A new signed consent form is available for review in {instance.study.protocol_id}.",
            type="MESSAGE",
            link="/dashboard/sponsor/documents"
        )

@receiver(post_save, sender=LabResult)
def notify_sponsor_on_lab_data(sender, instance, created, **kwargs):
    """Notify sponsor when new clinical lab data is synchronized"""
    if created and instance.participant and instance.participant.study and instance.participant.study.sponsor:
        study = instance.participant.study
        Notification.objects.create(
            user=study.sponsor,
            title="Clinical Data Sync",
            message=f"New lab results have been synchronized for participant {instance.participant.participant_sid} in {study.protocol_id}.",
            type="INFO",
            link="/dashboard/sponsor/participants"
        )

class StudyActionRequest(BaseMongoModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('IN_PROGRESS', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
    ]

    participant = models.ForeignKey('Participant', on_delete=models.CASCADE, related_name='action_requests')
    study = models.ForeignKey('Study', on_delete=models.CASCADE, related_name='action_requests')
    request_type = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.request_type} - {self.status}"

class StudyKit(BaseMongoModel):
    KIT_STATUS_CHOICES = [
        ('ASSIGNED', 'Kit Assigned'),
        ('PENDING', 'Pending Dispatch'),
        ('PREPARING', 'Preparing for Shipment'),
        ('SHIPPED', 'In Transit'),
        ('DELIVERED', 'Arrived at Site / Participant'),
        ('RETURN_SHIPPED', 'Return Transit Initiated'),
        ('RECEIVED', 'Samples Received at Lab'),
        ('DAMAGED', 'Damaged / Invalid'),
    ]

    CARRIER_CHOICES = [
        ('FedEx', 'FedEx'),
        ('UPS', 'UPS'),
        ('DHL', 'DHL'),
        ('USPS', 'USPS'),
        ('Other', 'Other'),
    ]

    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='study_kits')
    participant = models.ForeignKey(Participant, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_kits')
    kit_number = models.CharField(max_length=100, unique=True)
    kit_type = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=30, choices=KIT_STATUS_CHOICES, default='ASSIGNED')
    carrier = models.CharField(max_length=20, choices=CARRIER_CHOICES, default='Other')
    tracking_number = models.CharField(max_length=100, blank=True)
    
    address = models.TextField(blank=True, help_text="Delivery address for DTP kits")
    shipping_label_url = models.URLField(blank=True, null=True)
    return_label_url = models.URLField(blank=True, null=True)
    
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseMongoModel.Meta):
        ordering = ['-last_updated']

    def __str__(self):
        return f"Kit {self.kit_number} ({self.status})"

@receiver(post_save, sender=Document)
def notify_sponsor_on_new_doc(sender, instance, created, **kwargs):
    """Notify sponsor when any general study document (IRB, Protocol) is uploaded"""
    if created and instance.study and instance.study.sponsor:
        Notification.objects.create(
            user=instance.study.sponsor,
            title="New Document Uploaded",
            message=f"A new file '{instance.title}' has been added to the protocol folders for {instance.study.protocol_id}.",
            type="INFO",
            link="/dashboard/sponsor/documents"
        )

@receiver(post_save, sender=ProgressReport)
def notify_sponsor_on_new_report(sender, instance, created, **kwargs):
    """Notify sponsor when a formal progress/monthly report is available"""
    if created and instance.study and instance.study.sponsor:
        Notification.objects.create(
            user=instance.study.sponsor,
            title="New Report Available",
            message=f"The latest {instance.get_report_type_display()} report '{instance.name}' is now ready for review.",
            type="SUCCESS",
            link="/dashboard/sponsor/reports"
        )
@receiver(post_save, sender=DosingLog)
def sync_dosing_log_task(sender, instance, created, **kwargs):
    """Automatically mark related tasks as COMPLETED when a dosing log is saved"""
    if instance.participant and instance.date:
        from datetime import datetime, time
        from django.utils.timezone import now
        # Mark related tasks as COMPLETED for the specific date
        start = datetime.combine(instance.date, time.min)
        end = datetime.combine(instance.date, time.max)
        from .models import ParticipantTask # Local import for safety
        # Use a loop instead of .update() to avoid MongoDB multi-collection limitations
        tasks_to_update = ParticipantTask.objects.filter(
            participant=instance.participant,
            task__task_type__in=['LOG', 'DAILY_LOG'],
            due_date__range=(start, end),
            status__in=['PENDING', 'IN_PROGRESS', 'OVERDUE']
        )
        for t in tasks_to_update:
            t.status = 'COMPLETED'
            t.completed_at = now()
            t.save()

@receiver(post_save, sender=DailyMedicationLog)
def sync_daily_med_log_task(sender, instance, created, **kwargs):
    """Mark related tasks COMPLETED and notify team on AE reports"""
    if instance.participant and instance.date:
        from datetime import datetime, time
        from django.utils.timezone import now
        start = datetime.combine(instance.date, time.min)
        end = datetime.combine(instance.date, time.max)
        from .models import ParticipantTask
        tasks_to_update = ParticipantTask.objects.filter(
            participant=instance.participant,
            task__task_type__in=['LOG', 'DAILY_LOG'],
            due_date__range=(start, end),
            status__in=['PENDING', 'IN_PROGRESS', 'OVERDUE']
        )
        for t in tasks_to_update:
            t.status = 'COMPLETED'
            t.completed_at = now()
            t.save()

        # AE-specific signal notification (backup / additional)
        if created and instance.noticed_side_effects and not instance.is_draft:
            try:
                study = instance.participant.study
                if not study:
                    return
                sid = instance.participant.participant_sid or ''
                severity = getattr(instance, 'severity', '') or ''
                date_str = instance.date.strftime('%d %b %Y')
                is_urgent = severity.upper() in ['MODERATE', 'SEVERE']
                ae_title = f"{'🚨 URGENT: ' if is_urgent else '⚠️ '}AE Reported — {sid} ({date_str})"
                ae_msg = (
                    f"Adverse event reported by participant {sid} on {date_str}.\n"
                    f"Severity: {severity or 'Not specified'}.\n"
                    f"Description: {instance.side_effect_description[:300] if instance.side_effect_description else 'N/A'}"
                )
                for staff_user in [getattr(study, 'coordinator', None), getattr(study, 'pi', None)]:
                    if staff_user:
                        # Check if perform_create already sent this (avoid duplicates within 60s)
                        from django.utils.timezone import now as tz_now
                        already_sent = Notification.objects.filter(
                            user=staff_user,
                            title__contains=ae_title[:40]
                        ).exists()
                        if not already_sent:
                            Notification.objects.create(
                                user=staff_user,
                                title=ae_title,
                                message=ae_msg,
                                link=f"/dashboard/coordinator/participants/{instance.participant.id}/logs"
                            )
            except Exception as e:
                print(f"AE signal notification error: {e}")


@receiver(post_save, sender=Participant)
def generate_questionnaire_schedules_for_new_participant(sender, instance, created, **kwargs):
    """When a new participant joins, generate all schedule instances for existing study questionnaires"""
    if created and instance.study:
        study_qs = StudyQuestionnaire.objects.filter(study=instance.study)
        for sq in study_qs:
            sq.generate_instances_for_participant(instance)

@receiver(post_save, sender=StudyQuestionnaire)
def generate_schedules_for_existing_participants(sender, instance, created, **kwargs):
    """When a new questionnaire is added to a study, generate instances for all enrolled participants"""
    if created:
        participants = Participant.objects.filter(study=instance.study)
        for p in participants:
            instance.generate_instances_for_participant(p)

class Technology(BaseMongoModel):
    name = models.CharField(max_length=255)
    tagline = models.CharField(max_length=255)
    positioning = models.TextField()
    focus_areas = models.JSONField(default=list)
    icon_name = models.CharField(max_length=100, default='FlaskConical')
    gradient_theme = models.CharField(max_length=100, default='blue-indigo')
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class InnovationPageSettings(BaseMongoModel):
    hero_title = models.CharField(max_length=255, default="Where Innovation Meets Scientific Proof")
    hero_subtitle = models.TextField(default="Partner with MusB™ Research to design and execute rigorous research")
    
    # Inquiry Routing
    study_inquiry_email = models.EmailField(default="sales@musbresearch.com")
    concept_inquiry_email = models.EmailField(default="innovation@musbresearch.com")
    partnership_inquiry_email = models.EmailField(default="partnerships@musbresearch.com")
    
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Innovation Page Settings"

class SponsorInquiry(BaseMongoModel):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    company = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sponsor Inquiry: {self.name} ({self.company})"

@receiver(post_save, sender=SponsorInquiry)
def notify_team_on_sponsor_inquiry(sender, instance, created, **kwargs):
    if created:
        from .utils.resend_utils import send_sponsor_inquiry_email
        try:
            send_sponsor_inquiry_email(instance)
        except Exception as e:
            print(f"Error triggering sponsor inquiry email: {e}")

@receiver(post_save, sender=QuestionnaireScheduleInstance)
def notify_on_questionnaire_completion(sender, instance, created, **kwargs):
    """Notify PI and Coordinator when a participant completes a questionnaire"""
    if not created and instance.status == 'COMPLETED' and instance.study_questionnaire.notify_staff_on_submission:
        study = instance.participant.study
        if not study: return
        
        staff_team = [study.pi, study.coordinator]
        sid = instance.participant.participant_sid
        instrument_name = instance.study_questionnaire.template.name
        
        for staff in filter(None, staff_team):
            Notification.objects.create(
                user=staff,
                title="Questionnaire Submitted",
                message=f"Participant {sid} has completed the '{instrument_name}' assessment.",
                type="SUCCESS",
                link=f"/dashboard/coordinator/participants/{instance.participant.id}/assessments"
            )

@receiver(post_save, sender=Candidate)
def notify_on_candidate_apply(sender, instance, created, **kwargs):
    if created:
        from .utils.resend_utils import send_career_application_email
        try:
            send_career_application_email(instance.id)
        except Exception as e:
            print(f"Error triggering career email: {e}")

@receiver(post_save, sender=BookletDownloadRequest)
def notify_on_booklet_request(sender, instance, created, **kwargs):
    if created:
        from .utils.resend_utils import send_booklet_request_email
        try:
            send_booklet_request_email(instance.id)
        except Exception as e:
            print(f"Error triggering booklet email: {e}")
