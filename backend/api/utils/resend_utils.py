import os
import resend
from django.conf import settings
from typing import List, Optional

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

    # For privacy, send as bcc so recipients don't see each other
    # Resend supports up to 50 recipients per API call in BCC/To, but for mass mailing we can use Batch API
    # Or simple loop for small list
    # Here using BCC to send a single email to many people efficiently
    
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
                
            email_response = resend.Emails.send(params)
            print(f"Sent newsletter chunk: {email_response}")
            success_count += len(chunk)
        except Exception as e:
            print(f"Error sending newsletter via Resend: {e}")
            
    return success_count > 0

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
        email_response = resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        })
        print(f"Sent welcome email to {to_email}: {email_response}")
        return True
    except Exception as e:
        print(f"Error sending welcome email via Resend to {to_email}: {e}")
        return False

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
        
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": recipients,
            "subject": subject,
            "html": html_content
        })
        return True
    except Exception as e:
        print(f"Error sending inquiry notification to {target_email}: {e}")
        return False
