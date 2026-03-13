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
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0ea5e9; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; font-weight: 900;">MusB Research</h1>
                <p style="color: #64748b; font-size: 12px; margin-top: 5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Clinical Discovery Portal</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #f1f5f9;">
                <h2 style="color: #1e293b; margin-top: 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">{submission.inquiry_type.label if submission.inquiry_type else 'New Submission'}</h2>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 120px;">NAME</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700;">{submission.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">EMAIL</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700;">{submission.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">PHONE</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700;">{submission.phone or 'N/A'}</td>
                    </tr>
                </table>

                <div style="margin-top: 25px; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Message / Data</p>
                    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">{submission.message}</p>
                </div>
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px; font-weight: 500;">
                This is an automated notification from the MusB Research Platform.<br>
                Submitted on {submission.submitted_at.strftime('%m/%d/%Y at %H:%M:%S')} UTC
            </p>
        </div>
        """
        
        try:
            resend.api_key = os.getenv("RESEND_API_KEY")
            params = {
                "from": "MusB Research Clinical Team <onboarding@resend.dev>",
                "to": [recipient],
                "subject": f"MusB Research: {subject}",
                "html": html_content,
                "reply_to": "info@musbresearch.com"
            }
            
            # If domain is verified, you can use info@musbresearch.com in "from"
            # For now, using onboarding@resend.dev as default for tested integration
            
            resend.Emails.send(params)
            
            submission.is_processed = True
            submission.save()
            print(f"Email sent successfully via Resend to {recipient}")
        except Exception as e:
            print(f"Error sending email via Resend: {e}")

