from django.db import models
from django.conf import settings

class Study(models.Model):
    STUDY_TYPES = [
        ('IN_PERSON', 'In-Person Clinical Trial'),
        ('VIRTUAL', 'Virtual Clinical Trial'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PROPOSAL_SUBMITTED', 'Proposal Submitted'),
        ('PROPOSAL_NEGOTIATION', 'Proposal Under Negotiation'),
        ('AGREEMENT_SIGNED', 'Agreement Signed'),
        ('IRB_INITIATED', 'IRB Protocol Initiated'),
        ('IRB_SUBMISSION', 'Under IRB Submission / Development'),
        ('IRB_APPROVED', 'IRB Approved'),
        ('PREPARING_LAUNCH', 'Preparing to Launch'),
        ('ACTIVE', 'Active'),
        ('RECRUITING', 'Recruiting'),
        ('RECRUITMENT_COMPLETED', 'Recruitment Completed'),
        ('ANALYSIS', 'Analysis Underway'),
        ('PROGRESS_REPORT', 'Progress Report Draft Created'),
        ('FINAL_REPORT', 'Project Report Sent to Sponsor'),
        ('COMPLETED', 'Completed'),
        ('PAUSED', 'Paused'),
        ('CLOSED', 'Closed / Archived'),
    ]

    title = models.CharField(max_length=255)
    protocol_id = models.CharField(max_length=100, unique=True, verbose_name="Protocol ID / Internal ID")
    sponsor_name = models.CharField(max_length=255)
    study_type = models.CharField(max_length=20, choices=STUDY_TYPES, default='IN_PERSON')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')
    
    primary_indication = models.CharField(max_length=255, blank=True)
    design_type = models.CharField(max_length=255, blank=True)
    
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

class StudyAssignment(models.Model):
    """Links Users to Studies with specific hierarchy/access roles"""
    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='assignments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='study_assignments')
    role = models.CharField(max_length=20, choices=[
        ('PI', 'Principal Investigator'),
        ('COORDINATOR', 'Clinical Coordinator'),
        ('SPONSOR', 'Sponsor Representative'),
        ('VIEWER', 'Sponsor Viewer'),
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
