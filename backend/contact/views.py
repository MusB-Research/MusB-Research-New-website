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

    def create(self, request, *args, **kwargs):
        """Override to return clean JSON errors instead of Django HTML 500 pages."""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"[Contact Submit] DB error, falling back to email-only mode: {e}\n{error_trace}")

            # DB failed — try email-only fallback so the submission isn't lost
            try:
                data = request.data
                name = data.get('name', 'Unknown')
                email = data.get('email', '')
                phone = data.get('phone', '')
                message = data.get('message', '')
                metadata = data.get('metadata', {})

                fallback_html = f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 32px;">
                    <h2 style="color:#e53e3e;">⚠ Contact Form — DB Fallback Submission</h2>
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Phone:</strong> {phone}</p>
                    <p><strong>Message:</strong> {message}</p>
                    <pre style="background:#f7fafc;padding:16px;border-radius:8px;font-size:12px;">{str(metadata)}</pre>
                    <hr/>
                    <p style="color:#e53e3e;font-size:12px;">DB Error: {str(e)[:500]}</p>
                </div>
                """
                from api.utils.resend_utils import safe_resend_send
                safe_resend_send({
                    "from": "MusB Research <info@musbresearch.com>",
                    "to": ["info@musbresearch.com"],
                    "subject": f"[FALLBACK] Contact Form: {name}",
                    "html": fallback_html
                })

                # Confirm to the user — they submitted successfully even if DB failed
                return Response(
                    {"detail": "Your message has been received. Our team will contact you shortly."},
                    status=status.HTTP_201_CREATED
                )
            except Exception as email_err:
                print(f"[Contact Submit] Email fallback also failed: {email_err}")
                return Response(
                    {"detail": "We encountered a technical issue. Please email us directly at info@musbresearch.com."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

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
        
        # Always mark submission as processed and save first (before any email attempt)
        try:
            submission.is_processed = True
            submission.save()
        except Exception as save_err:
            print(f"Warning: Could not mark submission as processed: {save_err}")

        # 3. Send emails — this block NEVER causes a 500, all failures are caught
        try:
            from api.utils.resend_utils import safe_resend_send
            from_email = 'MusB Research <info@musbresearch.com>'
            
            # Fetch study to get PI/Coordinator if available
            study_id = self.request.data.get('study_id')
            recipients = ["info@musbresearch.com"]
            
            if study_id:
                try:
                    from api.models import Study
                    study = None
                    try:
                        study = Study.objects.get(pk=study_id)
                    except Exception:
                        study = Study.objects.filter(protocol_id=study_id).first()
                    
                    if study:
                        if study.pi and study.pi.email:
                            recipients.append(study.pi.email)
                        if study.coordinator and study.coordinator.email:
                            recipients.append(study.coordinator.email)
                except Exception as study_err:
                    print(f"Warning: Could not fetch study team for email: {study_err}")

            # deduplicate
            recipients = list(set([r for r in recipients if r]))

            # Send to Admin & Study Team
            safe_resend_send({
                "from": from_email,
                "to": recipients,
                "subject": admin_subject,
                "html": admin_html
            })
            
            # Send to Participant
            safe_resend_send({
                "from": from_email,
                "to": [submission.email],
                "subject": participant_subject,
                "html": participant_html,
                "reply_to": "info@musbresearch.com"
            })
        except Exception as e:
            print(f"Email sending error (non-critical): {e}")


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
                    # 1. Create the lead (Recruitment tracking)
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
                    
                    # 2. ALSO Create/Update the Participant (Clinical Review tracking)
                    # This ensures the "Subject Review" module in the Coordinator Dashboard is NOT empty.
                    from api.models import Participant
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    
                    user_obj = User.objects.filter(email=submission.email).first()
                    
                    # Check if a participant record already exists for this study/user or study/email
                    # (Note: Since Participant doesn't have an email field, we use study/user if user exists)
                    participant = None
                    if user_obj:
                        participant = Participant.objects.filter(study=study, user=user_obj).first()
                    
                    if not participant:
                        import secrets
                        import string
                        random_id = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
                        p_sid = f"SCR-{random_id}"
                        
                        participant = Participant.objects.create(
                            study=study,
                            user=user_obj,
                            participant_sid=p_sid,
                            status='PENDING_REVIEW'
                        )
                    
                    # Always update eligibility data and timestamp
                    participant.eligibility_data = metadata.get('formData', {})
                    participant.status = 'PENDING_REVIEW'
                    participant.submitted_at = submission.submitted_at
                    participant.save()

                    # 3. SYNC WITH USER MASTER PROFILE (Requirement 11)
                    if user_obj:
                        needs_save = False
                        
                        # Use screener data to fill profile gaps
                        if not user_obj.age and form_data.get('age'):
                            user_obj.age = form_data.get('age')
                            needs_save = True
                        if not user_obj.date_of_birth and form_data.get('date_of_birth'):
                            user_obj.date_of_birth = form_data.get('date_of_birth')
                            needs_save = True
                        if not user_obj.zip_code and form_data.get('zipCode'):
                            user_obj.zip_code = form_data.get('zipCode')
                            needs_save = True
                        if not user_obj.phone_number and form_data.get('phone'):
                            user_obj.phone_number = form_data.get('phone')
                            needs_save = True
                        if not user_obj.full_address and form_data.get('location'):
                            user_obj.full_address = form_data.get('location')
                            needs_save = True
                            
                        # Update name if empty
                        if not decrypt_data(user_obj.full_name) and submission.name:
                            user_obj.full_name = submission.name
                            needs_save = True

                        if needs_save:
                            user_obj.save()
                    
                    # 4. Root Cause Fix: Automatically transition SCREENER tasks if they exist for this study
                    from api.models import ParticipantTask
                    ParticipantTask.objects.filter(
                        participant=participant,
                        task__task_type='SCREENER',
                        status='PENDING'
                    ).update(status='COMPLETED', completed_at=submission.submitted_at)

                    print(f"Lead, Participant and Profile Synchronized for study: {study.protocol_id}")
            except Exception as e:
                print(f"Failed to create Clinical records: {e}")
