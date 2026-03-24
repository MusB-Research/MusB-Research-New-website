from rest_framework import generics, status, permissions
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
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        return ContactPageSettings.load()

class ContactFormConfigView(generics.RetrieveAPIView):
    serializer_class = ContactFormConfigurationSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        return ContactFormConfiguration.load()

class InquiryTypeListView(generics.ListAPIView):
    queryset = InquiryType.objects.filter(is_active=True)
    serializer_class = InquiryTypeSerializer
    permission_classes = [permissions.AllowAny]

import resend
import os

class SubmissionCreateView(generics.CreateAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.AllowAny]
    
    def perform_create(self, serializer):
        submission = serializer.save()
        
        # 1. ADMIN NOTIFICATION: Send all details to info@musbresearch.com
        admin_recipient = "info@musbresearch.com"
        admin_subject = f"Alert: New Contact Submission - {submission.name}"
        
        admin_html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0ea5e9;">MusB Research: New Contact Submission</h2>
            <p>A participant has completed the contact form. Below are the full details:</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                <p><strong>Name:</strong> {submission.name}</p>
                <p><strong>Email:</strong> {submission.email}</p>
                <p><strong>Phone:</strong> {submission.phone or 'N/A'}</p>
                <p><strong>Company:</strong> {submission.company or 'N/A'}</p>
                <p><strong>Inquiry Type:</strong> {submission.inquiry_type.label if submission.inquiry_type else 'N/A'}</p>
                <div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
                    <p><strong>Message / Details:</strong></p>
                    <pre style="white-space: pre-wrap; font-size: 13px; color: #374151;">{submission.message}</pre>
                </div>
            </div>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">Submitted on {submission.submitted_at.strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
        </div>
        """
        
        # 2. PARTICIPANT CONFIRMATION: Send a "revert" message to the participant
        participant_subject = f"Contact Confirmation for {submission.name} - MusB Research"
        participant_html = f"""
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0ea5e9; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; font-weight: 900;">MusB Research</h1>
                <p style="color: #64748b; font-size: 12px; margin-top: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Thank you for your interest</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #f1f5f9; color: #1e293b;">
                <h2 style="font-size: 18px; font-weight: 800; margin-top: 0;">Submission Confirmed</h2>
                <p style="font-size: 15px; line-height: 1.6;">Hello {submission.name},</p>
                <p style="font-size: 15px; line-height: 1.6;">Thank you for reaching out to us.</p>
                <p style="font-size: 15px; line-height: 1.6;">Our team has received your information securely. A team member will connect with you shortly regarding your inquiry.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="font-size: 13px; font-weight: 701; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">What's next?</p>
                    <ul style="font-size: 14px; margin: 0; padding-left: 20px; color: #475569;">
                        <li>Team Review: 24-48 Hours</li>
                        <li>Follow-up: Inquiry Discussion</li>
                    </ul>
                </div>
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px; font-weight: 500;">
                If you have any questions, please reply directly to this email or contact us at info@musbresearch.com.
            </p>
        </div>
        """
        
        try:
            resend.api_key = os.getenv("RESEND_API_KEY")
            
            # Send to Admin
            resend.Emails.send({
                "from": "MusB Research System <onboarding@resend.dev>",
                "to": [admin_recipient],
                "subject": admin_subject,
                "html": admin_html
            })
            
            # Send to Participant
            resend.Emails.send({
                "from": "MusB Research Clinical Team <onboarding@resend.dev>",
                "to": [submission.email],
                "subject": participant_subject,
                "html": participant_html,
                "reply_to": "info@musbresearch.com"
            })
            
            submission.is_processed = True
            submission.save()
            print(f"Both notification and confirmation emails sent for {submission.email}")
            
        except Exception as e:
            print(f"Error sending emails via Resend: {e}")

