import os
import resend
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

class SubmissionCreateView(generics.CreateAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.AllowAny]
    
    def perform_create(self, serializer):
        submission = serializer.save()
        metadata = submission.metadata or {}
        form_data = metadata.get('formData', {})
        outcome = metadata.get('outcome', 'PENDING')
        study_protocol = metadata.get('study_protocol') or 'MusB Research Program'
        is_screener = bool(form_data)

        # Generate a clean, plain-text style list for the screening data (if any)
        data_content = ""
        if is_screener:
            for key, value in form_data.items():
                if not value or key in ['cvConsent']: continue
                label = ''.join([' ' + c if c.isupper() else c for c in key]).strip().capitalize()
                if key == 'trialsInLast30Days': label = "Trials In Last 30 Days"
                if key == 'healthConditions': 
                    label = "Health Conditions"
                    if isinstance(value, list): value = ", ".join(value)
                
                data_content += f"""
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">{label}</p>
                    <p style="margin: 4px 0 0; font-size: 15px; color: #1e293b; font-weight: 500;">{value}</p>
                </div>
                """

        # Decide on headers and subjects based on whether this is a screener or regular inquiry
        header_title = "MusB Clinical Screening" if is_screener else "MusB Research Inquiry"
        admin_subject = f"Alert: New { 'Screening [' + outcome + ']' if is_screener else 'Inquiry' } - {submission.name}"
        
        # If it's a general inquiry, we should show the raw message
        message_html = ""
        if submission.message and not is_screener:
            message_html = f"""
            <div style="margin-bottom: 40px;">
                <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Inquiry Message</h3>
                <p style="font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">{submission.message}</p>
            </div>
            """

        # 1. ADMIN NOTIFICATION: Send all details to info@musbresearch.com
        admin_recipient = "info@musbresearch.com"
        
        admin_html = f"""
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; color: #1a202c; border: 1px solid #f1f5f9; border-radius: 16px;">
            <div style="margin-bottom: 32px;">
                <h1 style="color: #0ea5e9; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 900;">{header_title}</h1>
                <p style="margin: 8px 0 0; color: #64748b; font-size: 12px; font-weight: 600;">Context: {study_protocol}</p>
            </div>

            {f'<div style="margin-bottom: 40px; padding: 20px; background: {"#f0fdf4" if outcome == "ELIGIBLE" else "#fffbeb" if outcome == "MAYBE" else "#fef2f2"}; border-radius: 12px; text-align: center;"><span style="color: {"#166534" if outcome == "ELIGIBLE" else "#92400e" if outcome == "MAYBE" else "#991b1b"}; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">Candidate Status: {outcome}</span></div>' if is_screener else ''}

            <div style="margin-bottom: 40px;">
                <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Contact Information</h3>
                <p style="margin: 0 0 8px; font-size: 15px;"><strong>Name:</strong> {submission.name}</p>
                <p style="margin: 0 0 8px; font-size: 15px;"><strong>Email:</strong> {submission.email}</p>
                <p style="margin: 0 0 8px; font-size: 15px;"><strong>Phone:</strong> {submission.phone or 'Not Provided'}</p>
            </div>

            {f'<div style="margin-bottom: 40px;"><h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Screening Responses</h3>{data_content}</div>' if is_screener else ''}

            {message_html}

            <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">Lead automatically recorded in Clinical CRM.</p>
            </div>
        </div>
        """
        
        # 2. PARTICIPANT CONFIRMATION
        participant_subject = f"Confirmation: Your Study Screening for {study_protocol}" if is_screener else f"MusB Research: Inquiry Received"
        participant_html = f"""
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: auto; padding: 48px; background-color: #ffffff; text-align: left; color: #1e293b; border: 1px solid #f1f5f9; border-radius: 20px;">
            <div style="margin-bottom: 40px; text-align: center;">
                <h1 style="color: #0ea5e9; margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">MusB Research</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">Hello {submission.name},</p>
            <p style="font-size: 16px; line-height: 1.6;">{f"Thank you for completing the eligibility protocol for <strong>{study_protocol}</strong>." if is_screener else "Thank you for reaching out to MusB Research."}</p>
            <p style="font-size: 16px; line-height: 1.6;">{"Our clinical team has received your information. We are currently reviewing your eligibility and a study coordinator will reach out to you within 24-48 hours to discuss the next steps." if is_screener else "Our team has received your message. We will review your inquiry and get back to you shortly."}</p>
            
            <div style="margin: 40px 0; padding: 32px; background: #f8fafc; border-radius: 16px;">
                <h3 style="font-size: 14px; font-weight: 800; color: #0ea5e9; text-transform: uppercase; margin-top: 0; margin-bottom: 16px;">Next Steps</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #475569; line-height: 2;">
                    { "<li>Scientific review of your screening data</li><li>Follow-up call for clinical verification</li><li>Scheduling of initial site visit (if eligible)</li>" if is_screener else "<li>Inquiry routing to project leads</li><li>Response from research coordinator</li>" }
                </ul>
            </div>
            
            <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; text-align: center;">
                If you have urgent questions, please contact us at <a href="mailto:info@musbresearch.com" style="color: #0ea5e9; text-decoration: none;">info@musbresearch.com</a>.
            </p>
        </div>
        """
        
        try:
            # ALWAYS use Resend as per user request (SMTP fallback removed)
            resend.api_key = os.getenv("RESEND_API_KEY", getattr(settings, 'RESEND_API_KEY', ''))
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'MusB Research System <onboarding@resend.dev>')
            
            # Send to Admin
            resend.Emails.send({
                "from": from_email,
                "to": [admin_recipient],
                "subject": admin_subject,
                "html": admin_html
            })
            
            # Send to Participant
            resend.Emails.send({
                "from": from_email,
                "to": [submission.email],
                "subject": participant_subject,
                "html": participant_html,
                "reply_to": "info@musbresearch.com"
            })
            
            print(f"Sent both emails via Resend directly to {[admin_recipient, submission.email]}")
            
            submission.is_processed = True
            submission.save()
            
        except Exception as e:
            print(f"Error sending emails: {e}")

        # 3. CLINICAL LEAD CREATION: If study_id is provided in request, create a Lead in the api app
        study_id = self.request.data.get('study_id')
        metadata = self.request.data.get('metadata', {})
        if study_id:
            try:
                from api.models import Lead, Study
                
                # Try to find the study
                study = None
                try:
                    # Try by PK directly if it's a hex ID/MongoID
                    study = Study.objects.get(pk=study_id)
                except Exception:
                    # Fallback to protocol_id
                    study = Study.objects.filter(protocol_id=study_id).first()
                
                if study:
                    # Create the lead
                    names = (submission.name or "Anonymous").split(" ", 1)
                    first_name = names[0]
                    last_name = names[1] if len(names) > 1 else ""
                    
                    Lead.objects.create(
                        study=study,
                        first_name=first_name,
                        last_name=last_name,
                        email=submission.email,
                        phone=submission.phone,
                        status='NEW',
                        source='ONLINE_SCREENER',
                        notes=f"Auto-generated from screening form. Outcome: {metadata.get('outcome', 'Unknown')}"
                    )
                    print(f"Lead created successfully for study: {study.protocol_id}")
            except Exception as e:
                print(f"Failed to create Lead record: {e}")
