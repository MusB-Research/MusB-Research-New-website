from django.db import models
from django.conf import settings
from api.models import Study, BaseMongoModel

class SupportTicket(BaseMongoModel):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('WAITING', 'Waiting for Investigator'),
        ('ESCALATED', 'Escalated to Super Admin'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]
    
    TICKET_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    ticket_id = models.CharField(max_length=20, unique=True, help_text="e.g. TCK-1015")
    title = models.CharField(max_length=255)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tickets')
    study = models.ForeignKey(Study, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    priority = models.CharField(max_length=10, choices=TICKET_LEVELS, default='MEDIUM')
    category = models.CharField(max_length=50, blank=True) # e.g. "DATA & REPORTS"
    
    assigned_to = models.CharField(max_length=50, default='SITE_COORDINATOR')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.ticket_id} - {self.title}"

class TicketMessage(BaseMongoModel):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    content = models.TextField()
    is_internal = models.BooleanField(default=False)
    
    # Metadata for the UI labels (e.g. "REGULATORY SPECIALIST", "PI")
    user_role_label = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

class TicketAuditLog(BaseMongoModel):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.CharField(max_length=100)
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
