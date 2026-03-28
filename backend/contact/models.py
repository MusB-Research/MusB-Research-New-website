from django.db import models
from django.core.validators import EmailValidator

class ContactPageSettings(models.Model):
    """Singleton model for Contact Page content"""
    page_title = models.CharField(max_length=200, default="Contact Us")
    intro_text = models.TextField(default="Get in touch with us.")
    
    # Section Toggles
    show_map_section = models.BooleanField(default=True)
    show_quick_links_section = models.BooleanField(default=True)
    show_cta_band = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Contact Page Settings"
        verbose_name_plural = "Contact Page Settings"

    def save(self, *args, **kwargs):
        self.pk = '000000000000000000000001'
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk='000000000000000000000001')
        return obj

    def __str__(self):
        return "Contact Page Settings"


class ContactFormConfiguration(models.Model):
    """Singleton configuration for form fields"""
    # Field Labels
    name_label = models.CharField(max_length=100, default="Full Name")
    email_label = models.CharField(max_length=100, default="Email Address")
    company_label = models.CharField(max_length=100, default="Company / Organization")
    phone_label = models.CharField(max_length=100, default="Phone Number")
    inquiry_type_label = models.CharField(max_length=100, default="Reason for Inquiry")
    message_label = models.CharField(max_length=100, default="Message")
    
    # Required Toggles
    is_company_required = models.BooleanField(default=False)
    is_phone_required = models.BooleanField(default=False)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Contact Form Configuration"
        verbose_name_plural = "Contact Form Configurations"

    def save(self, *args, **kwargs):
        self.pk = '000000000000000000000001'
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk='000000000000000000000001')
        return obj
    
    def __str__(self):
        return "Contact Form Configuration"


class InquiryType(models.Model):
    """Routing rules for inquiry types"""
    label = models.CharField(max_length=100, help_text="e.g., Business / Sponsorship")
    slug = models.SlugField(unique=True, help_text="Unique identifier for frontend logic")
    recipient_email = models.EmailField(help_text="Where to send these inquiries")
    
    # Conditional Logic (Simple implementation: list fields to show)
    # For now, we'll keep it simple. If we need complex conditional logic, 
    # we can add a JSONField here. 
    
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'label']

    def __str__(self):
        return f"{self.label} -> {self.recipient_email}"


class Submission(models.Model):
    """Store contact form submissions"""
    # Contact Info
    name = models.CharField(max_length=200)
    email = models.EmailField()
    company = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    
    # Inquiry Details
    inquiry_type = models.ForeignKey(InquiryType, on_delete=models.SET_NULL, null=True)
    message = models.TextField()
    
    # Config Snapshot (in case settings change later, we know what was required at the time? 
    # identifying metadata is usually enough)
    
    # Routing Info
    routed_to = models.EmailField(blank=True, help_text="Email address this was sent to")
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Status
    is_processed = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.name} - {self.inquiry_type} ({self.submitted_at.strftime('%Y-%m-%d')})"
