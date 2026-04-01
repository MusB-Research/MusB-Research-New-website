import os
import resend
from django.conf import settings
from django.utils.timezone import now
from typing import List, Optional
import threading
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

def safe_resend_send(params):
    """Wraps Resend API calls with domain verification fallbacks."""
    try:
        resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
        if not resend.api_key:
            _log_email_locally(params.get('to'), params.get('subject'), params.get('html'))
            return False
            
        try:
            resend.Emails.send(params)
            return True
        except Exception as api_err:
            err_msg = str(api_err).lower()
            if "domain is not verified" in err_msg:
                params["from"] = "onboarding@resend.dev"
                try:
                    resend.Emails.send(params)
                    return True
                except Exception as test_err:
                    _log_email_locally(params.get('to'), f"[FAILED SEND] {params.get('subject')}", params.get('html'))
                    return False
            _log_email_locally(params.get('to'), f"[API ERROR] {params.get('subject')}", params.get('html'))
            return False
    except Exception as e:
        logger.error(f"Safe send failed: {e}")
        return False

def run_in_background(func):
    """
    Decorator to run a function in a separate thread.
    Catches all exceptions to prevent any crashing.
    """
    def wrapper(*args, **kwargs):
        def task():
            try:
                func(*args, **kwargs)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Background task {func.__name__} failed: {e}")
        thread = threading.Thread(target=task, daemon=True)
        thread.start()
    return wrapper

@run_in_background
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

@run_in_background
def send_welcome_email(to_email: str):
    """
    Sends a welcome email to a new newsletter subscriber.
    """
    resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
    
    if not resend.api_key:
        print("ERROR: Resend API key not found. Cannot send welcome email.")
        return False
        
    subject = "Welcome to MusB Research Newsletter!"
    html_content = "<h2>Thank you for subscribing!</h2><p>You will now receive the latest updates, news, and notifications from MusB Research.</p><p><a href='https://musbresearch.com/'>Visit our website</a></p>"
    
    try:
        return safe_resend_send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        })
    except Exception as e:
        print(f"Error sending welcome email via Resend to {to_email}: {e}")
        return False

@run_in_background
def send_inquiry_notification(inquiry_data: dict, target_email: str):
    """
    Sends a detailed notification to MusB team when a new study inquiry is submitted.
    """
    resend.api_key = os.environ.get('RESEND_API_KEY', getattr(settings, 'RESEND_API_KEY', ''))
    
    if not resend.api_key:
        print("ERROR: Resend API key not found. Cannot send inquiry notification.")
        return False

    product = inquiry_data.get('product_name', 'Unknown Product')
    legal_name = inquiry_data.get('legal_name', 'Not Provided')
    nda = "YES (Immediate NDA Requested)" if inquiry_data.get('nda_preference') == 'YES' else "NO"
    
    subject = f"New Study Inquiry: {product} [{legal_name}]"
    
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
        # Always include info@musbresearch.com as per user requirement
        recipients = list(set([target_email, "info@musbresearch.com"]))
        
        params = {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": recipients,
            "subject": subject,
            "html": html_content
        }
        
        return safe_resend_send(params)
    except Exception as e:
        print(f"Error sending inquiry notification: {e}")
        return False

@run_in_background
def send_facility_inquiry_email(inquiry):
    """
    Sends an email notification when a new Facility Inquiry is submitted.
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
    
    try:
        # 1. Admin
        res1 = safe_resend_send({
            "from": "MusB Research System <info@musbresearch.com>",
            "to": [admin_recipient],
            "subject": subject,
            "html": html_content
        })
        
        # 2. Participant
        res2 = safe_resend_send({
            "from": "MusB Research Team <info@musbresearch.com>",
            "to": [inquiry.email],
            "subject": participant_subject,
            "html": participant_html,
            "reply_to": "info@musbresearch.com"
        })
        
        return res1 or res2
    except Exception as e:
        print(f"Error sending facility inquiry email: {e}")
        return False

@run_in_background
def send_help_request_notification(study_title, participant_name, participant_id, action_title, pi_email, coordinator_email):
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
        
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2;">
            <p><strong>Study:</strong> {study_title}</p>
            <p><strong>Participant:</strong> {participant_name} (ID: {participant_id})</p>
            <p><strong>Requested Action:</strong> <span style="color: #dc2626; font-weight: bold;">{action_title}</span></p>
            <p><strong>Timestamp:</strong> {now().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
        </div>
        
        <p style="margin-top: 20px;">Please log in to the PI Dashboard to review the participant status or reach out to them directly.</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://musbresearch.com/admin" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">VIEW PI DASHBOARD</a>
        </div>
    </div>
    """

    params = {
        "from": "MusB Research Alerts <info@musbresearch.com>",
        "to": recipients,
        "subject": subject,
        "html": html_content
    }

    return safe_resend_send(params)
