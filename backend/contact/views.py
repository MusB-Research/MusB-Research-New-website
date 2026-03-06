from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.mail import send_mail
from django.conf import settings
from .models import ContactPageSettings, ContactFormConfiguration, InquiryType, Submission
from .serializers import (
    ContactPageSettingsSerializer, 
    ContactFormConfigurationSerializer, 
    InquiryTypeSerializer, 
    SubmissionSerializer
)

class ContactPageSettingsView(generics.RetrieveAPIView):
    serializer_class = ContactPageSettingsSerializer
    
    def get_object(self):
        return ContactPageSettings.load()

class ContactFormConfigView(generics.RetrieveAPIView):
    serializer_class = ContactFormConfigurationSerializer
    
    def get_object(self):
        return ContactFormConfiguration.load()

class InquiryTypeListView(generics.ListAPIView):
    queryset = InquiryType.objects.filter(is_active=True)
    serializer_class = InquiryTypeSerializer

import resend
import os

class SubmissionCreateView(generics.CreateAPIView):
    serializer_class = SubmissionSerializer
    
    def perform_create(self, serializer):
        submission = serializer.save()
        
        # Send Email Notification
        recipient = submission.routed_to or "info@musbresearch.com"
        subject = f"New Website Inquiry: {submission.inquiry_type.label if submission.inquiry_type else 'General'}"
        
        # HTML Email Content
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #06b6d4; text-transform: uppercase;">New Inquiry Received</h2>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p><strong>Name:</strong> {submission.name}</p>
            <p><strong>Email:</strong> {submission.email}</p>
            <p><strong>Phone:</strong> {submission.phone or 'N/A'}</p>
            <p><strong>Company:</strong> {submission.company or 'N/A'}</p>
            <p><strong>Inquiry Type:</strong> {submission.inquiry_type.label if submission.inquiry_type else 'General'}</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">{submission.message}</p>
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 30px;">Submitted on {submission.submitted_at.strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
        </div>
        """
        
        try:
            resend.api_key = os.getenv("RESEND_API_KEY")
            params = {
                "from": "MusB Website <onboarding@resend.dev>",
                "to": [recipient],
                "subject": subject,
                "html": html_content,
                "reply_to": submission.email
            }
            
            # If domain is verified, you can use info@musbresearch.com in "from"
            # For now, using onboarding@resend.dev as default for tested integration
            
            resend.Emails.send(params)
            
            submission.is_processed = True
            submission.save()
            print(f"Email sent successfully via Resend to {recipient}")
        except Exception as e:
            print(f"Error sending email via Resend: {e}")

