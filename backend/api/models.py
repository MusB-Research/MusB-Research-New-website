from django.db import models
from django.conf import settings
from authentication.security import encrypt_data, decrypt_data

class Study(models.Model):
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
    ]

    STATUS_CHOICES = [
        ('RECRUITING', 'Recruiting'),
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    protocol_id = models.CharField(max_length=100, unique=True, null=True, blank=True, verbose_name="Protocol ID / Internal ID")
    sponsor_name = models.CharField(max_length=255)
    study_type = models.CharField(max_length=20, choices=STUDY_TYPES, default='IN_PERSON')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='RECRUITING')
    
    # Core Medical Team (direct fields for easier dashboard access)
    pi = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='pi_studies')
    coordinator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='coordinator_studies')
    
    # Workflow approval status
    approval_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_studies')
    
    primary_indication = models.CharField(max_length=255, blank=True)
    design_type = models.CharField(max_length=255, blank=True) # Legacy
    
    trial_model = models.CharField(max_length=30, choices=TRIAL_MODEL_CHOICES, default='RCT')
    is_double_blind = models.BooleanField(default=False)
    has_placebo_control = models.BooleanField(default=False)
    has_screening_log = models.BooleanField(default=True)
    
    shipment_mode = models.CharField(max_length=30, choices=[
        ('CLINIC', 'Clinic Delivery'),
        ('DTP', 'Direct-to-Patient (DTP)'),
    ], default='CLINIC')
    
    consent_mode = models.CharField(max_length=30, choices=[
        ('PAPER', 'Paper Consent'),
        ('ECONSENT', 'Electronic Consent (eConsent)'),
    ], default='ECONSENT')
    
    # Frontend Data Fields
    condition = models.CharField(max_length=255, blank=True)
    trial_format = models.CharField(max_length=50, blank=True)
    benefit = models.TextField(blank=True)
    duration = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list, blank=True)
    compensation = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    time_commitment = models.CharField(max_length=255, blank=True)
    overview = models.TextField(blank=True)
    timeline = models.JSONField(default=list, blank=True)
    kits_info = models.TextField(blank=True)
    safety_info = models.TextField(blank=True)
    privacy_standards = models.JSONField(default=list, blank=True)
    remote_participation = models.BooleanField(default=False)
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    launch_date = models.DateField(null=True, blank=True)
    irb_status = models.CharField(max_length=100, blank=True)

    # Enrollment Targets
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
    kit_tracking_enabled = models.BooleanField(default=False)
    lab_uploads_enabled = models.BooleanField(default=False)
    notifications_enabled = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.protocol_id} - {self.title}"

class News(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    type = models.CharField(max_length=50, blank=True)
    published_at = models.DateTimeField(auto_now_add=True)

class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateTimeField()

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
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='assignments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='study_assignments')
    role = models.CharField(max_length=30, choices=[
        ('PI', 'Principal Investigator'),
        ('COORDINATOR', 'Clinical Coordinator'),
        ('SPONSOR_ADMIN', 'Sponsor Admin'),
        ('SPONSOR_MANAGER', 'Study Manager'),
        ('SPONSOR_VIEWER', 'Sponsor Viewer'),
    ])
    date_assigned = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('study', 'user', 'role')

class Document(models.Model):
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='study_docs/')
    version = models.CharField(max_length=20, default='1.0')
    is_archived = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} (v{self.version})"

class Participant(models.Model):
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='participant_records')
    
    # Section 18.3: unique study-linked ID
    participant_sid = models.CharField(max_length=50, unique=True, verbose_name="Participant Study ID")
    
    # Enrollment Tracking
    status = models.CharField(max_length=30, default='NEW', choices=[
        ('NEW', 'New Lead'),
        ('CONTACTED', 'Contact Attempted'),
        ('INTERESTED', 'Interested'),
        ('SCREENING', 'Prescreening in Progress'),
        ('ELIGIBLE', 'Eligible'),
        ('INELIGIBLE', 'Ineligible'),
        ('CONSENTED', 'Consented'),
        ('RANDOMIZED', 'Randomized'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('DROPPED', 'Dropped'),
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

    def save(self, *args, **kwargs):
        if self.gender and not self.gender.startswith('gAAAA'):
            self.gender = encrypt_data(self.gender)
        super().save(*args, **kwargs)

    @property
    def decrypted_gender(self):
        return decrypt_data(self.gender)

    def __str__(self):
        return f"{self.participant_sid} ({self.study.protocol_id})"

class InterventionArm(models.Model):
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='arms')
    name = models.CharField(max_length=100) # Group A, Group B
    description = models.TextField(blank=True)
    regimen = models.TextField(blank=True)

    def __str__(self):
        return f"{self.study.protocol_id} - {self.name}"

class Visit(models.Model):
    VISIT_TYPES = [
        ('SCREENING', 'Screening Visit'),
        ('BASELINE', 'Baseline Visit'),
        ('FOLLOW_UP', 'Follow-up Visit'),
        ('FINAL', 'Final Visit'),
        ('UNSCHEDULED', 'Unscheduled Visit'),
        ('ONBOARDING', 'Onboarding Call'),
    ]

    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='visits')
    visit_type = models.CharField(max_length=20, choices=VISIT_TYPES)
    scheduled_date = models.DateTimeField()
    actual_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='SCHEDULED', choices=[
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('MISSED', 'Missed'),
        ('CANCELLED', 'Cancelled'),
    ])
    
    # Clinical Measures
    notes = models.TextField(blank=True)
    measurements = models.JSONField(default=dict, blank=True) # Anthropometrics, vitals, etc.

    def save(self, *args, **kwargs):
        if self.notes and not self.notes.startswith('gAAAA'):
            self.notes = encrypt_data(self.notes)
        super().save(*args, **kwargs)

    @property
    def decrypted_notes(self):
        return decrypt_data(self.notes)

    def __str__(self):
        return f"{self.participant.participant_sid} - {self.visit_type}"

class Kit(models.Model):
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='kits')
    participant = models.ForeignKey(Participant, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_kits')
    kit_number = models.CharField(max_length=100, unique=True)
    kit_type = models.CharField(max_length=100)
    
    status = models.CharField(max_length=30, default='ASSIGNED', choices=[
        ('ASSIGNED', 'Kit Assigned'),
        ('AWAITING', 'Awaiting Collection'),
        ('COLLECTED', 'Collected'),
        ('SHIPPED', 'Shipped by Participant'),
        ('RECEIVED', 'Received at Site'),
        ('MISSING', 'Missing'),
        ('DELAYED', 'Delayed'),
        ('DAMAGED', 'Damaged / Invalid'),
    ])
    
    assignment_date = models.DateTimeField(null=True, blank=True)
    collection_date = models.DateTimeField(null=True, blank=True)
    received_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Kit {self.kit_number} ({self.status})"

class Form(models.Model):
    """Dynamic form definition for questionnaires"""
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='forms')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    schema = models.JSONField(help_text="JSON representation of fields and conditional logic")
    
    is_published = models.BooleanField(default=False)
    version = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} v{self.version}"

class FormResponse(models.Model):
    form = models.ForeignKey(Form, on_delete=models.CASCADE)
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='form_responses')
    visit = models.ForeignKey(Visit, on_delete=models.SET_NULL, null=True, blank=True)
    
    data = models.JSONField(help_text="Stored answers")
    is_complete = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

class Task(models.Model):
    """Protocol-defined activities (Surveys, Logs, Sensors)"""
    TASK_TYPES = [
        ('SURVEY', 'Questionnaire / Survey'),
        ('LOG', 'Daily Log (Symptoms/Meds)'),
        ('SENSOR', 'Device / Sensor Data'),
        ('UPLOAD', 'File Upload / Photo'),
    ]
    
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
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

    def __str__(self):
        return f"{self.title} ({self.frequency})"

class ParticipantTask(models.Model):
    """Instance of a task assigned to a participant with a specific window"""
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='assigned_tasks')
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    
    due_date = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING', choices=[
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('MISSED', 'Missed'),
        ('IN_PROGRESS', 'In Progress'),
    ])
    
    # Store dynamic state for multi-step tasks if needed
    current_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['due_date']

    def __str__(self):
        return f"{self.participant.participant_sid} - {self.task.title}"

class Consent(models.Model):
    """Immutable record of electronic informed consent (eConsent)"""
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='consent_records')
    # Link to participant if they exist, or keep anonymous until signup
    participant = models.ForeignKey(Participant, on_delete=models.SET_NULL, null=True, blank=True)
    
    full_name = models.CharField(max_length=255, verbose_name="Electronic Signature")
    email = models.EmailField()
    
    device_hash = models.CharField(max_length=255, blank=True, help_text="Anonymous browser fingerprint")
    timezone_detected = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    agreed_at = models.DateTimeField(auto_now_add=True)
    is_valid = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Consent: {self.full_name} ({self.study.protocol_id})"

# ─────────────────────────────────────────────────────────
# NEW MODELS FOR FULL BUILD PROMPT
# ─────────────────────────────────────────────────────────

class Lead(models.Model):
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

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.status})"

class CommunicationLog(models.Model):
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

class Compensation(models.Model):
    """Visit-based participant payments"""
    PAY_METHODS = [('BANK_TRANSFER', 'Bank Transfer'), ('STIPEND_CARD', 'Stipend Card'), ('CASH', 'Cash'), ('CHECK', 'Check')]
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='compensation')
    visit = models.ForeignKey(Visit, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='PENDING', choices=[('PENDING', 'Pending'), ('PAID', 'Paid'), ('CANCELLED', 'Cancelled')])
    payment_method = models.CharField(max_length=30, choices=PAY_METHODS, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

class LabResult(models.Model):
    """Clinical test data uploads"""
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='lab_results')
    test_name = models.CharField(max_length=255)
    value = models.CharField(max_length=100)
    units = models.CharField(max_length=50, blank=True)
    lab_date = models.DateField()
    document = models.FileField(upload_to='lab_reports/', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class DataAuditLog(models.Model):
    """Field-level audit trail for every data point modification"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=10, choices=[('CREATE', 'Created'), ('UPDATE', 'Updated'), ('DELETE', 'Deleted')])
    model_name = models.CharField(max_length=100)
    record_id = models.CharField(max_length=100)
    
    # Store changes as JSON: {"field": {"old": val, "new": val}}
    changes = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)

class PermissionMatrix(models.Model):
    """Dynamic RBAC control configurable by Super Admin"""
    role = models.CharField(max_length=30)
    capability = models.CharField(max_length=100) # e.g., 'EDIT_STUDY_STATUS', 'CREATE_FORM'
    is_allowed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('role', 'capability')

class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    user_type = models.CharField(max_length=20, choices=[('BUSINESS', 'Business'), ('INDIVIDUAL', 'Individual')], default='BUSINESS')
    is_subscribed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} ({self.user_type})"

# --- Signals for Notifications ---
from django.db.models.signals import post_save
from django.dispatch import receiver
from .utils.resend_utils import send_newsletter_update

@receiver(post_save, sender=News)
def notify_subscribers_on_news(sender, instance, created, **kwargs):
    if created:
        subject = f"New Update from MusB Research: {instance.title}"
        content = f"<p>A new research update has been posted.</p><h2>{instance.title}</h2><p>{instance.content[:200]}...</p><p><a href='https://musbresearch.com/news'>Read More at musbresearch.com</a></p>"
        # Run safely
        try:
            send_newsletter_update(subject, content)
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
