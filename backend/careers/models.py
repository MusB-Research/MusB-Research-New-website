from django.db import models
import uuid

class JobPosting(models.Model):
    JOB_TYPES = [
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Contract', 'Contract'),
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
    job_type = models.CharField(max_length=50, choices=JOB_TYPES)
    experience_level = models.CharField(max_length=100)
    role_summary = models.TextField()
    requirements = models.JSONField(default=list) # JSON Array as bullet points
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    publish_date = models.DateField()
    expiry_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-is_featured', '-publish_date']
