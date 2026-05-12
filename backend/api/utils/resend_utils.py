import os
import resend
from django.conf import settings
from django.utils.timezone import now
from celery import shared_task
from typing import List, Optional
from django.core.mail import send_mail
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

def _log_email_locally(to_email, subject, content):
    """Saves email to a local log file for development debugging when API fails."""
    try:
        log_file = os.path.join(settings.BASE_DIR, "sent_emails.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"DATE: {now()}\n")
            f.write(f"TO: {to_email}\n")
            f.write(f"SUBJECT: {subject}\n")
            f.write(f"CONTENT:\n{content}\n")
            f.write(f"{'='*80}\n")
        logger.info(f"Email content saved to local log: {log_file}")
    except Exception as e:
        logger.error(f"Failed to log email locally: {e}")

def send_email_task(params):
    """
    Directly sends email with threading fallback.
    Renamed from task to maintain compatibility but removed Celery logic.
    """
    return safe_resend_send(params)

import threading

def safe_resend_send(params):
    """
    Directly sends email via Resend API.
    As requested: No Celery, No SMTP fallback.
    Uses threading to prevent blocking the HTTP response.
    """
    thread = threading.Thread(target=_execute_resend_only, args=(params,))
    thread.start()
    return True

def _execute_resend_only(params):
    """Internal execution logic for Resend only."""
    try:
        resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
        if not resend.api_key:
            logger.error("Resend API key missing.")
            return False
            
        # Ensure plain text version exists (fallback from HTML if needed)
        if not params.get('text') and params.get('html'):
            params['text'] = strip_tags(params['html'])
            
        resend.Emails.send(params)
        logger.info(f"Direct Resend call successful: {params.get('subject')}")
        return True
    except Exception as e:
        logger.error(f"Resend Direct Send Failed: {e}")
        # Even if it fails, we don't use SMTP as requested.
        # We just log it locally for safety.
        to_emails = params.get('to', [])
        _log_email_locally(to_emails, f"[FAILED] {params.get('subject')}", params.get('text', 'No text'))
        return False


@shared_task
def send_newsletter_update(subject: str, html_content: str, text_content: Optional[str] = None):
    """
    Fetches all active Newsletter subscribers and sends them an email via Resend.
    """
    from api.models import NewsletterSubscriber

    # Ensure key is loaded
    resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
    
    if not resend.api_key:
        print("ERROR: Resend API key not found. Cannot send newsletter.")
        return False

    subscribers = NewsletterSubscriber.objects.filter(is_subscribed=True)
    emails: List[str] = [sub.email for sub in subscribers]

    if not emails:
        print("No active subscribers to send newsletter to.")
        return False

    # Split into chunks of 50 to avoid API limits (Resend limit per request is 50 bcc)
    chunk_size = 50
    chunks = [emails[i:i + chunk_size] for i in range(0, len(emails), chunk_size)]
    
    success_count: int = 0
    
    for chunk in chunks:
        try:
            params = {
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": ["noreply@musbresearch.com"], # Required TO field
                "bcc": chunk,
                "subject": subject,
                "html": html_content,
            }
            if text_content:
                params["text"] = text_content
                
            if safe_resend_send(params):
                success_count += len(chunk)
        except Exception as e:
            print(f"Error sending newsletter via Resend: {e}")
            
    return success_count > 0

@shared_task
def send_welcome_email(to_email: str):
    """
    Sends a welcome email to a new newsletter subscriber.
    Also notifies info@musbresearch.com.
    """
    resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
    
    if not resend.api_key:
        print("ERROR: Resend API key not found. Cannot send welcome email.")
        return False
        
    subject = "Welcome to MusB Research Newsletter!"
    html_content = "<h2>Thank you for subscribing!</h2><p>You will now receive the latest updates, news, and notifications from MusB Research.</p><p><a href='https://musbresearch.com/'>Visit our website</a></p>"
    
    try:
        # Admin Notification
        admin_text = f"NEW NEWSLETTER SUBSCRIBER\n=========================\nEmail: {to_email}\nTimestamp: {now().strftime('%Y-%m-%d %H:%M:%S')} UTC"
        safe_resend_send({
            "from": "MusB Inquiry <info@musbresearch.com>",
            "to": ["info@musbresearch.com"],
            "subject": f"New Newsletter Subscriber: {to_email}",
            "text": admin_text
        })
        
        # User Welcome
        return safe_resend_send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "text": "Thank you for subscribing to MusB Research Newsletter!",
            "html": html_content
        })
    except Exception as e:
        print(f"Error sending welcome email via Resend to {to_email}: {e}")
        return False

def send_career_application_email(candidate_id):
    """
    Sends notification when a new candidate applies for a role.
    Now direct/threaded (No Celery).
    """
    from api.models import Candidate
    try:
        candidate = Candidate.objects.get(pk=candidate_id)
        text_content = f"""
NEW CAREER APPLICATION
======================
Name: {candidate.name}
Email: {candidate.email}
Phone: {candidate.phone}
Applied At: {candidate.applied_at}

Resume Link:
{settings.SITE_URL}{candidate.resume.url}
"""
        
        subject = f"Alert: New Career Application - {candidate.name}"
        return safe_resend_send({
            "from": "MusB Careers <info@musbresearch.com>",
            "to": ["info@musbresearch.com"],
            "subject": subject,
            "text": text_content
        })
    except Exception as e:
        print(f"Error sending career app email: {e}")
        return False

def send_booklet_request_email(request_id):
    """
    Sends notification when a user requests a Clinical Booklet download.
    Now direct/threaded (No Celery).
    """
    from api.models import BookletDownloadRequest
    try:
        b_req = BookletDownloadRequest.objects.get(pk=request_id)
        
        subject = f"New Technical Booklet Request: {b_req.technology_name}"
        text_content = f"""
NEW TECHNICAL BOOKLET DOWNLOAD REQUEST
======================================
Name: {b_req.first_name} {b_req.last_name}
Email: {b_req.email}
Phone: {b_req.phone}
Company: {b_req.company}
Designation: {b_req.designation}
Technology: {b_req.technology_name}
Timestamp: {b_req.downloaded_at}

NDA Agreed: {"Yes" if b_req.nda_agreed else "No"}
"""
        
        params = {
            "from": "MusB Downloads <info@musbresearch.com>",
            "to": ["info@musbresearch.com"],
            "subject": subject,
            "text": text_content,
        }
        return safe_resend_send(params)
    except Exception as e:
        print(f"Error sending booklet request email: {e}")
        return False

def send_inquiry_notification(inquiry_data: dict, target_email: str):
    """
    Sends a detailed notification to MusB team when a new study inquiry is submitted.
    Now direct/threaded (No Celery). Uses plain text for maximum readability.
    """
    resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
    
    if not resend.api_key:
        print("ERROR: Resend API key not found. Cannot send inquiry notification.")
        return False

    product = inquiry_data.get('product_name', 'Unknown Product')
    legal_name = inquiry_data.get('legal_name', 'Not Provided')
    nda_pref = inquiry_data.get('nda_preference')
    nda = "YES (Immediate NDA Requested)" if nda_pref == 'YES' else "NO"
    
    subject = f"New Study Inquiry: {product} [{legal_name}]"
    
    # Build Plain Text Summary
    text_content = f"""
NEW CLINICAL STUDY INQUIRY
==========================
Legal Entity: {legal_name}
Subject Product: {product}
NDA Immediate Request: {nda}

CONTACT INFORMATION
-------------------
Name: {inquiry_data.get('contact_person_name', 'Not Provided')}
Designation: {inquiry_data.get('contact_person_designation', 'Not Provided')}
Email: {inquiry_data.get('contact_email')}
Mobile: {inquiry_data.get('contact_mobile', 'Not Provided')}

PROJECT SPECIFICATIONS
----------------------
Category: {inquiry_data.get('category', 'Not Specified')}
Development Stage: {inquiry_data.get('development_stage', 'Not Specified')}
Primary Focus: {inquiry_data.get('primary_focus', 'Not Specified')}
Timeline: {inquiry_data.get('timeline', 'Not Specified')}
Needs: {", ".join(inquiry_data.get('needs', [])) if inquiry_data.get('needs') else 'None Specified'}
Target Population: {inquiry_data.get('target_population', 'General Population')}
Budget: {inquiry_data.get('budget_range', 'Prefer to Discuss')}

Description:
{inquiry_data.get('project_description', 'No description provided.')}

ADDRESSES
---------
HQ: {inquiry_data.get('street_address')}, {inquiry_data.get('city')}, {inquiry_data.get('state')} {inquiry_data.get('zip_code')}, {inquiry_data.get('country')}
Operational: {f"{inquiry_data.get('op_street_address')}, {inquiry_data.get('op_city')}, {inquiry_data.get('op_state')} {inquiry_data.get('op_zip_code')}, {inquiry_data.get('op_country')}" if inquiry_data.get('has_operational_address') else "Same as Corporate HQ"}

DISCOVERY CALL
--------------
Sponsor Locale: {inquiry_data.get('discovery_call_date')} @ {inquiry_data.get('discovery_call_time')} ({inquiry_data.get('discovery_call_timezone')})
EST Site Time: {inquiry_data.get('est_discovery_call') or 'Not Calculated'}

---
Sent via MusB Research Inquiry System
Sponsor User: {inquiry_data.get('sponsor_email', 'Unknown')}
"""

    # Build HTML summary
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 650px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; color: #334155;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">New Clinical Study Inquiry</h2>
        
        <p style="font-size: 16px; line-height: 1.5;">A detailed study inquiry has been submitted by <b>{legal_name}</b> via the Sponsor Dashboard.</p>
        
        <!-- Section 1: Contact Details -->
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h3 style="margin-top: 0; color: #1e3a8a; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr><td style="padding: 6px 0; color: #64748b; width: 160px;"><b>Contact Name:</b></td><td>{inquiry_data.get('contact_person_name', 'Not Provided')}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Designation:</b></td><td>{inquiry_data.get('contact_person_designation', 'Not Provided')}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Email Address:</b></td><td><a href="mailto:{inquiry_data.get('contact_email')}" style="color: #2563eb;">{inquiry_data.get('contact_email')}</a></td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Mobile No:</b></td><td>{inquiry_data.get('contact_mobile', 'Not Provided')}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Legal Entity:</b></td><td>{legal_name}</td></tr>
            </table>
        </div>

        <!-- Section 2: Address Details -->
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h3 style="margin-top: 0; color: #1e3a8a; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Business Address</h3>
            <div style="font-size: 15px; line-height: 1.6;">
                <p style="margin: 0;"><b>Corporate HQ:</b><br/>{inquiry_data.get('street_address')}<br/>{inquiry_data.get('city')}, {inquiry_data.get('state')} {inquiry_data.get('zip_code')}, {inquiry_data.get('country')}</p>
                {f'<p style="margin-top: 12px; margin-bottom: 0; padding: 10px; background: #eff6ff; border-radius: 6px; border-left: 4px solid #2563eb;"><b>Operational Address (Different):</b><br/>{inquiry_data.get("op_street_address")}<br/>{inquiry_data.get("op_city")}, {inquiry_data.get("op_state")} {inquiry_data.get("op_zip_code")}, {inquiry_data.get("op_country")}</p>' if inquiry_data.get('has_operational_address') else '<p style="margin-top: 10px; font-style: italic; color: #94a3b8;">Operational address is same as corporate HQ.</p>'}
            </div>
            {f'<div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #eee;"><b>Signatory:</b> {inquiry_data.get("signatory_name")} ({inquiry_data.get("signatory_title")})</div>' if inquiry_data.get('signatory_name') else ''}
        </div>

        <!-- Section 3: Project Identification -->
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h3 style="margin-top: 0; color: #1e3a8a; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Project & NDA Status</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr><td style="padding: 6px 0; color: #64748b; width: 160px;"><b>Product Name:</b></td><td><b>{product}</b></td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Category:</b></td><td>{inquiry_data.get('category', 'Not Specified')}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Development:</b></td><td>{inquiry_data.get('development_stage', 'Not Specified')}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Health Focus:</b></td><td>{inquiry_data.get('primary_focus', 'Not Specified')}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Proposed Timeline:</b></td><td>{inquiry_data.get('timeline', 'Not Specified')}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>NDA Preference:</b></td><td><span style="color: {'#e11d48' if nda.startswith('YES') else '#059669'}; font-weight: bold;">{nda}</span></td></tr>
            </table>
        </div>

        <!-- Section 4: Clinical Requirements -->
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h3 style="margin-top: 0; color: #1e3a8a; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Study Scope & Requirements</h3>
            <div style="font-size: 15px; line-height: 1.6;">
                <p><b>Needs:</b> {", ".join(inquiry_data.get('needs', [])) or 'None Specified'}</p>
                <p><b>Study Type:</b> {", ".join(inquiry_data.get('study_type_needed', [])) or 'Not Specified'}</p>
                <p><b>Services Requested:</b> {", ".join(inquiry_data.get('services_needed', [])) or 'Not Specified'}</p>
                <p><b>Target Population:</b> {inquiry_data.get('target_population', 'General Population')}</p>
                <p><b>Estimated Budget:</b> {inquiry_data.get('budget_range', 'Prefer to Discuss')}</p>
                <div style="margin-top: 15px; padding: 15px; background: #fdfdfd; border: 1px solid #eee; border-radius: 6px;">
                    <b>Project Description:</b><br/>
                    <i style="color: #475569;">{inquiry_data.get('project_description', 'No description provided.')}</i>
                </div>
            </div>
        </div>

        <!-- Section 5: Scheduling -->
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #3b82f6; font-size: 18px; border-bottom: 1px solid #334155; padding-bottom: 8px;">Requested Discovery Call</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr><td style="padding: 6px 0; color: #94a3b8; width: 160px;"><b>Requested Date:</b></td><td>{inquiry_data.get('discovery_call_date') or 'Not Scheduled'}</td></tr>
                <tr><td style="padding: 6px 0; color: #94a3b8;"><b>Sponsor Time:</b></td><td>{inquiry_data.get('discovery_call_time', 'N/A')} ({inquiry_data.get('discovery_call_timezone', 'N/A')})</td></tr>
                <tr><td style="padding: 10px 0; border-top: 1px solid #334155; margin-top: 10px;"><b>EST Time (Site):</b></td><td style="padding: 10px 0; border-top: 1px solid #334155; font-size: 18px; font-weight: 900; color: #60a5fa;">{inquiry_data.get('est_discovery_call') or '---'}</td></tr>
            </table>
        </div>

        <p style="margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center;">
            This inquiry was automatically routed to <b>{target_email}</b> based on the sponsor selection.<br/>
            Sponsor User Account: {inquiry_data.get('sponsor_email', 'Unknown')} | Inquiry System
        </p>
    </div>
    """
    try:
        # Send as Plain Text Only as requested for the Admin
        return safe_resend_send({
            "from": "MusB Study Inquiry <info@musbresearch.com>",
            "to": [target_email],
            "subject": subject,
            "text": text_content
        })
    except Exception as e:
        print(f"Error sending inquiry notification: {e}")
        return False

def send_facility_inquiry_email(inquiry):
    """
    Sends an email notification when a new Facility Inquiry is submitted.
    Now direct/threaded (No Celery).
    """
    resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
    
    if not resend.api_key:
        print("ERROR: Resend API key not found. Cannot send facility inquiry email.")
        return False
        
    # 1. ADMIN NOTIFICATION: Send all details to info@musbresearch.com
    admin_recipient = "info@musbresearch.com"
    subject = f"Alert: New Facility Inquiry - {inquiry.name}"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0ea5e9;">MusB Research: New Facility Inquiry</h2>
        <p>A new facility inquiry has been submitted. Below are the full details:</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <p><strong>Name:</strong> {inquiry.name}</p>
            <p><strong>Email:</strong> {inquiry.email}</p>
            <p><strong>Phone:</strong> {inquiry.phone or 'N/A'}</p>
            <p><strong>Company:</strong> {inquiry.company or 'N/A'}</p>
            <p><strong>Inquiry Type:</strong> {inquiry.inquiry_type or 'N/A'}</p>
            <div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
                <p><strong>Message / Concept Explanation:</strong></p>
                <pre style="white-space: pre-wrap; font-size: 13px; color: #374151;">{inquiry.message}</pre>
            </div>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">Submitted on {inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
    </div>
    """
    
    # 2. PARTICIPANT CONFIRMATION: Send a "revert" message to the participant
    participant_subject = f"Inquiry Confirmation for {inquiry.name} - MusB Research"
    participant_html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0ea5e9; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; font-weight: 900;">MusB Research</h1>
            <p style="color: #64748b; font-size: 12px; margin-top: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Thank you for your interest</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #f1f5f9; color: #1e293b;">
            <h2 style="font-size: 18px; font-weight: 800; margin-top: 0;">Inquiry Received</h2>
            <p style="font-size: 15px; line-height: 1.6;">Hello {inquiry.name},</p>
            <p style="font-size: 15px; line-height: 1.6;">Thank you for reaching out regarding our facility and research services.</p>
            <p style="font-size: 15px; line-height: 1.6;">Our team has received your information securely and will review your conceptual explanation. A team member will connect with you shortly regarding the next steps.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 13px; font-weight: 701; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">What's next?</p>
                <ul style="font-size: 14px; margin: 0; padding-left: 20px; color: #475569;">
                    <li>Team Review: 24-48 Hours</li>
                    <li>Follow-up: Concept Discussion</li>
                </ul>
            </div>
        </div>
        
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px; font-weight: 500;">
            If you have any questions, please reply directly to this email or contact us at info@musbresearch.com.
        </p>
    </div>
    """
    
    # Build Plain Text Summary
    text_content = f"""
NEW FACILITY INQUIRY
====================
Name: {inquiry.name}
Email: {inquiry.email}
Phone: {inquiry.phone or 'N/A'}
Company: {inquiry.company or 'N/A'}
Inquiry Type: {inquiry.inquiry_type or 'N/A'}

Message / Concept:
{inquiry.message}

---
Submitted on {inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC
"""
    try:
        # 1. Admin ONLY Notification (Strict Plain Text)
        return safe_resend_send({
            "from": "MusB Facility Inquiry <info@musbresearch.com>",
            "to": [admin_recipient],
            "subject": subject,
            "text": text_content
        })
    except Exception as e:
        print(f"Error sending facility inquiry email: {e}")
        return False

@shared_task
def send_help_request_notification(study_title, participant_name, participant_id, action_title, pi_email, coordinator_email, age=None, gender=None, contact_email=None, description=None):
    """
    Sends an urgent help request notification to the PI and Coordinator.
    """
    resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
    if not resend.api_key:
        return False

    recipients = [pi_email, coordinator_email]
    # Filter out empty or None emails
    recipients = [email for email in recipients if email]
    # Include admin for monitoring
    recipients.append("info@musbresearch.com")
    recipients = list(set(recipients))

    subject = f"URGENT: Participant Help Requested - {study_title}"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 2px solid #ef4444; border-radius: 12px; background-color: #fef2f2; color: #1e293b;">
        <h2 style="color: #b91c1c; margin-top: 0;">Urgent Help Request Triggered</h2>
        <p>A participant has requested help or triggered a critical action in the Participant Portal.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #fee2e2;">
            <p style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #fee2e2; padding-bottom: 8px;"><b>Inquiry Information</b></p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><b>Study:</b></td><td>{study_title}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Participant:</b></td><td><b>{participant_name}</b> (ID: {participant_id})</td></tr>
                {f'<tr><td style="padding: 6px 0; color: #64748b;"><b>Age:</b></td><td>{age}</td></tr>' if age else ''}
                {f'<tr><td style="padding: 6px 0; color: #64748b;"><b>Gender:</b></td><td>{gender}</td></tr>' if gender else ''}
                {f'<tr><td style="padding: 6px 0; color: #64748b;"><b>Email:</b></td><td>{contact_email}</td></tr>' if contact_email else ''}
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Requested Action:</b></td><td><span style="color: #dc2626; font-weight: bold;">{action_title}</span></td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;"><b>Timestamp:</b></td><td>{now().strftime('%Y-%m-%d %H:%M:%S')} UTC</td></tr>
                {f'<tr><td colspan="2" style="padding: 12px 0; border-top: 1px dashed #fee2e2; margin-top: 10px; color: #1e293b;"><b>Client Message:</b><br/>{description}</td></tr>' if description else ''}
            </table>
        </div>
        
        <p style="margin-top: 20px;">Please log in to the PI Dashboard to review the participant status or reach out to them directly.</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://musbresearch.com/admin" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">VIEW PI DASHBOARD</a>
        </div>
    </div>
    """

    # Build Plain Text Summary
    text_content = f"""
URGENT: PARTICIPANT HELP REQUESTED
==================================
Study: {study_title}
Participant: {participant_name} (ID: {participant_id})
Age: {age or 'N/A'}
Gender: {gender or 'N/A'}
Contact Email: {contact_email or 'N/A'}
Requested Action: {action_title}

Description:
{description or 'No additional description provided.'}

---
Timestamp: {now().strftime('%Y-%m-%d %H:%M:%S')} UTC
View Dashboard: https://musbresearch.com/admin
"""

    params = {
        "from": "MusB Alerts <info@musbresearch.com>",
        "to": recipients,
        "subject": subject,
        "text": text_content
    }

    return safe_resend_send(params)

def send_sponsor_inquiry_email(inquiry):
    """
    Sends an email notification when a new Sponsor Inquiry (Partnership) is submitted.
    Now direct/threaded (No Celery).
    """
    resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
    
    if not resend.api_key:
        print("ERROR: Resend API key not found. Cannot send sponsor inquiry email.")
        return False
        
    # 1. ADMIN NOTIFICATION
    admin_recipient = "info@musbresearch.com"
    subject = f"New Partnership Inquiry: {inquiry.name} - {inquiry.company}"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0ea5e9;">MusB Research: New Partnership Inquiry</h2>
        <p>A new partnership inquiry has been submitted via the 'Become a Partner' form.</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <p><strong>Name:</strong> {inquiry.name}</p>
            <p><strong>Email:</strong> {inquiry.email}</p>
            <p><strong>Company:</strong> {inquiry.company}</p>
            <div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
                <p><strong>Submission Details:</strong></p>
                <pre style="white-space: pre-wrap; font-size: 13px; color: #374151; font-family: sans-serif;">{inquiry.message}</pre>
            </div>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">Submitted on {inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
    </div>
    """
    
    # 2. INQUIRER CONFIRMATION
    confirmation_subject = "Partnership Inquiry Received - MusB Research"
    confirmation_html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0ea5e9; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; font-weight: 900;">MusB Research</h1>
            <p style="color: #64748b; font-size: 12px; margin-top: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Partnering for the Future</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #f1f5f9; color: #1e293b;">
            <h2 style="font-size: 18px; font-weight: 800; margin-top: 0;">Interest Received</h2>
            <p style="font-size: 15px; line-height: 1.6;">Hello {inquiry.name},</p>
            <p style="font-size: 15px; line-height: 1.6;">Thank you for your interest in partnering with MusB Research. We have received your inquiry and our team is currently reviewing your information.</p>
            <p style="font-size: 15px; line-height: 1.6;">Someone from our partnership team will reach out to you within the next 2 business days to discuss potential collaboration opportunities.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 13px; font-weight: 701; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Review Timeline</p>
                <ul style="font-size: 14px; margin: 0; padding-left: 20px; color: #475569;">
                    <li>Initial Review: < 24 Hours</li>
                    <li>Expert Consultation: < 48 Hours</li>
                </ul>
            </div>
        </div>
        
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px; font-weight: 500;">
            This is an automated confirmation. If you have immediate questions, please contact us at info@musbresearch.com.
        </p>
    </div>
    """
    
    # Build Plain Text Summary
    text_content = f"""
NEW PARTNERSHIP INQUIRY
=======================
Name: {inquiry.name}
Email: {inquiry.email}
Company: {inquiry.company}

Inquiry Message:
{inquiry.message}

---
Submitted on {inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC
"""
    try:
        # 1. Send Admin Notification (Plain Text for reliability)
        safe_resend_send({
            "from": "MusB Partnership <info@musbresearch.com>",
            "to": [admin_recipient],
            "subject": subject,
            "text": text_content
        })

        # 2. Send Inquirer Confirmation (Branded HTML)
        safe_resend_send({
            "from": "MusB Research <info@musbresearch.com>",
            "to": [inquiry.email],
            "subject": confirmation_subject,
            "html": confirmation_html
        })
        
        return True
    except Exception as e:
        print(f"Error sending sponsor inquiry emails: {e}")
        return False
