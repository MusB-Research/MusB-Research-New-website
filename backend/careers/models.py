from django.db import models
import uuid

class JobPosting(models.Model):
    JOB_TYPES = [
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Contract', 'Contract'),
        ('Full-time Internship', 'Full-time Internship'),
    ]
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    is_featured = models.BooleanField(default=False)
    location = models.CharField(max_length=255)
    duration = models.CharField(max_length=100, blank=True)
    job_type = models.CharField(max_length=50, choices=JOB_TYPES)
    experience_level = models.CharField(max_length=100)
    role_summary = models.CharField(max_length=700)
    description = models.TextField(blank=True)
    responsibilities = models.JSONField(default=list) # JSON Array as bullet points
    requirements = models.JSONField(default=list) # JSON Array as bullet points
    benefits = models.JSONField(default=list) # JSON Array as bullet points
    apply_instructions = models.JSONField(default=list) # JSON Array as bullet points
    about_hiring = models.TextField(blank=True) # Paragraph content
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    publish_date = models.DateField()
    expiry_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
