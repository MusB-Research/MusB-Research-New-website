import os
import resend
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.mail import send_mail
from django.conf import settings
from authentication.models import User
from .models import ContactPageSettings, ContactFormConfiguration, InquiryType, Submission

from .serializers import (
    ContactPageSettingsSerializer, 
    ContactFormConfigurationSerializer, 
    InquiryTypeSerializer, 
    SubmissionSerializer
)
from api.utils.cache_utils import cache_api_response
from api.utils.resend_utils import safe_resend_send
from django.utils.html import strip_tags
from authentication.security import encrypt_data, decrypt_data
from django.utils import timezone
from datetime import timedelta

class ContactPageSettingsView(generics.RetrieveAPIView):
    serializer_class = ContactPageSettingsSerializer
    permission_classes = [permissions.AllowAny]
    
    @cache_api_response("contact_settings", timeout=3600)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_object(self):
        return ContactPageSettings.load()

class ContactFormConfigView(generics.RetrieveAPIView):
    serializer_class = ContactFormConfigurationSerializer
    permission_classes = [permissions.AllowAny]
    
    @cache_api_response("contact_form_config", timeout=3600)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_object(self):
        return ContactFormConfiguration.load()

class InquiryTypeListView(generics.ListAPIView):
    queryset = InquiryType.objects.filter(is_active=True)
    serializer_class = InquiryTypeSerializer
    permission_classes = [permissions.AllowAny]
    
    @cache_api_response("inquiry_types", timeout=3600)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class SubmissionCreateView(generics.CreateAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        """Override to return clean JSON errors instead of Django HTML 500 pages."""
        try:
            # 1. EMAIL UNIQUENESS & USER CHECK
            email = request.data.get('email', '').strip().lower()
            study_id = request.data.get('study_id')
            
            if email:
                # Check if user already exists
                if User.objects.filter(email=email).exists():
                    return Response({
                        'error': 'EXISTS',
                        'detail': 'An account with this email already exists. Please log in to your dashboard to continue or use "Forgot Password".'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if a screener query was already sent for this study
                if study_id:
                    existing_query = Submission.objects.filter(
                        email=email, 
                        metadata__study_id=study_id
                    ).exists()
                    if existing_query:
                        return Response({
                            'error': 'DUPLICATE',
                            'detail': 'You have already submitted a screening query for this study. Our team will contact you soon.'
                        }, status=status.HTTP_400_BAD_REQUEST)

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
                safe_resend_send({
                    "from": "MusB Research <info@musbresearch.com>",
                    "to": ["info@musbresearch.com"],
                    "subject": f"[FALLBACK] Contact Form: {name}",
                    "text": strip_tags(fallback_html)
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

        # --- START NEW PROFESSIONAL LAYOUT ---
        initials = "".join([n[0] for n in submission.name.split() if n][:2]).upper()
        submission_id = f"SCR-{submission.submitted_at.strftime('%Y%m%d')}-{str(submission.id)[-4:]}"
        
        # Color coding based on outcome
        status_colors = {
            'ELIGIBLE': {'bg': '#f0fdf4', 'text': '#166534', 'border': '#bbf7d0', 'icon': '✓'},
            'MAYBE': {'bg': '#fffbeb', 'text': '#92400e', 'border': '#fde68a', 'icon': '⚠'},
            'INELIGIBLE': {'bg': '#fef2f2', 'text': '#991b1b', 'border': '#fecaca', 'icon': '✕'},
            'PENDING': {'bg': '#f8fafc', 'text': '#475569', 'border': '#e2e8f0', 'icon': '○'}
        }
        color = status_colors.get(outcome.upper(), status_colors['PENDING'])

        # Build dynamic cards for responses
        cards_html = ""
        if is_screener:
            # Map for human-readable labels
            label_map = {
                'trialsInLast30Days': "Trials In Last 30 Days",
                'healthConditions': "Health Conditions",
                'biologicalSex': "Sex",
                'gender': "Gender",
                'age': "Age",
                'height': "Height",
                'weight': "Weight",
                'zipCode': "Zip Code"
            }

            # Grouping logic: We'll put demographics first, then others
            demographics = []
            others = []
            
            for key, value in form_data.items():
                if not value or key in ['cvConsent', 'firstName', 'lastName', 'email', 'phone', 'zipCode']: continue
                label = label_map.get(key, ''.join([' ' + c if c.isupper() else c for c in key]).strip().capitalize())
                
                if key in ['age', 'gender', 'height', 'weight', 'sex', 'biologicalSex']:
                    demographics.append((label, value))
                else:
                    others.append((label, value))
            
            if demographics:
                items = "".join([f'<div style="width: 48%; margin-bottom: 12px; display: inline-block; vertical-align: top;"><p style="margin:0; font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">{l}</p><p style="margin:2px 0 0; font-size: 14px; color: #1e293b; font-weight: 700;">{v}</p></div>' for l,v in demographics])
                cards_html += f"""
                <div style="background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
                    <h3 style="margin: 0 0 16px; font-size: 11px; font-weight: 900; color: #0369a1; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #bae6fd; padding-bottom: 8px;">Demographics</h3>
                    <div>{items}</div>
                </div>
                """
            
            if others:
                items = "".join([f'<div style="margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;"><p style="margin:0; font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">{l}</p><p style="margin:4px 0 0; font-size: 14px; color: #1e293b; font-weight: 600; line-height: 1.4;">{v}</p></div>' for l,v in others])
                cards_html += f"""
                <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
                    <h3 style="margin: 0 0 16px; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Screening Responses</h3>
                    {items}
                </div>
                """

        admin_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: #0ea5e9; padding: 40px 20px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.02em;">MusB Research</h1>
                    <p style="margin: 8px 0 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8;">Clinical Study Screening</p>
                </div>

                <!-- Status Badge -->
                <div style="padding: 32px 20px 0; text-align: center;">
                    <div style="display: inline-flex; align-items: center; background: {color['bg']}; border: 1px solid {color['border']}; padding: 8px 24px; border-radius: 9999px; margin-bottom: 12px;">
                        <span style="font-size: 14px; margin-right: 8px;">{color['icon']}</span>
                        <span style="font-size: 12px; font-weight: 900; color: {color['text']}; text-transform: uppercase; letter-spacing: 0.15em;">{outcome}</span>
                    </div>
                    <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #1e293b;">{study_protocol}</h2>
                </div>

                <!-- Profile Section -->
                <div style="padding: 40px 32px; border-bottom: 1px solid #f1f5f9;">
                    <table style="width: 100%; margin-bottom: 32px;">
                        <tr>
                            <td style="width: 48px; padding-right: 16px;">
                                <div style="width: 48px; height: 48px; background: #e0f2fe; color: #0369a1; border-radius: 50%; text-align: center; line-height: 48px; font-weight: 800; font-size: 16px;">
                                    {initials}
                                </div>
                            </td>
                            <td>
                                <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: #1e293b;">{submission.name}</h4>
                                <p style="margin: 2px 0 0; font-size: 11px; color: #94a3b8; font-weight: 600;">ID: {submission_id}</p>
                            </td>
                        </tr>
                    </table>

                    <div style="display: block; margin-top: 24px;">
                        <div style="width: 48%; display: inline-block; vertical-align: top; margin-bottom: 20px;">
                            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Email</p>
                            <p style="margin: 4px 0 0; font-size: 13px; font-weight: 700; color: #0ea5e9;">{submission.email}</p>
                        </div>
                        <div style="width: 48%; display: inline-block; vertical-align: top; margin-bottom: 20px;">
                            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Phone</p>
                            <p style="margin: 4px 0 0; font-size: 13px; font-weight: 700; color: #1e293b;">{submission.phone or 'N/A'}</p>
                        </div>
                        <div style="width: 48%; display: inline-block; vertical-align: top;">
                            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Location</p>
                            <p style="margin: 4px 0 0; font-size: 13px; font-weight: 700; color: #1e293b;">{metadata.get('location') or 'Not Specified'}</p>
                        </div>
                        <div style="width: 48%; display: inline-block; vertical-align: top;">
                            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Submitted</p>
                            <p style="margin: 4px 0 0; font-size: 13px; font-weight: 700; color: #1e293b;">{submission.submitted_at.strftime('%b %d, %Y')}</p>
                        </div>
                    </div>
                </div>

                <!-- Responses Section -->
                <div style="padding: 32px; background: #fcfdfe;">
                    <p style="margin: 0 0 20px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Detailed Screening Data</p>
                    {cards_html}
                    
                    {f'<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;"><p style="margin:0 0 8px; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Message</p><p style="margin:0; font-size: 14px; color: #1e293b; line-height: 1.6;">{submission.message}</p></div>' if submission.message else ''}
                </div>

                <!-- Actions -->
                <div style="padding: 32px; text-align: center; background: #ffffff; border-top: 1px solid #f1f5f9;">
                    <div style="display: block; width: 100%;">
                        <a href="https://musbresearch.com/dashboard/coordinator" style="display: inline-block; background: #0ea5e9; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 6px 12px;">View in Dashboard</a>
                        <a href="mailto:{submission.email}" style="display: inline-block; background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 6px 12px;">Email Participant</a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding: 32px; text-align: center; background: #1e293b; color: #64748b;">
                    <p style="margin: 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">MusB Research Clinical Studies Team</p>
                    <p style="margin: 8px 0 0; font-size: 11px;"><a href="mailto:support@musbresearch.com" style="color: #0ea5e9; text-decoration: none;">support@musbresearch.com</a></p>
                </div>
            </div>
        </body>
        </html>
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
            
            # ONLY send to info@musbresearch.com as requested
            recipients = ["info@musbresearch.com"]

            # Deduplicate and filter
            recipients = list(set([r for r in recipients if r]))
            
            # Store routing info for audit trail
            submission.routed_to = ", ".join(recipients)
            submission.save()

            # Send to Admin (Professional HTML)
            safe_resend_send({
                "from": from_email,
                "to": ["info@musbresearch.com"],
                "subject": admin_subject,
                "html": admin_html,
                "text": admin_text
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
                    
                    # Create StaffTask for Coordinator (SLA tracking)
                    from api.models import StaffTask
                    coordinator = study.coordinator or study.pi
                    if coordinator:
                        StaffTask.objects.create(
                            user=coordinator,
                            study=study,
                            title=f"New Screening Review: {submission.name}",
                            description=f"Automated Alert: A new clinical screening form has been submitted for {study.protocol_id}. Please review and update status.",
                            task_type='SCREENER_REVIEW',
                            reference_id=str(participant.pk),
                            status='NEW',
                            due_date=timezone.now() + timedelta(hours=48)
                        )
                    
                    # Always update eligibility data and timestamp
                    # Merge flat answers and formData to ensure all clinical review keys are present
                    form_data = metadata.get('formData', {})
                    answers = metadata.get('answers', {})
                    
                    participant.eligibility_data = {**form_data, **answers}
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
                            user_obj.phone_number = encrypt_data(form_data.get('phone'))
                            needs_save = True
                        if not user_obj.full_address and form_data.get('location'):
                            user_obj.full_address = encrypt_data(form_data.get('location'))
                            needs_save = True
                            
                        # Update name if empty
                        current_name = decrypt_data(user_obj.full_name) if user_obj.full_name else ""
                        if not current_name and submission.name:
                            user_obj.full_name = encrypt_data(submission.name)
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
