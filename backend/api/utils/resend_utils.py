import os
import resend
from django.conf import settings
from typing import List

def send_newsletter_update(subject: str, html_content: str, text_content: str = None):
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
    
    success_count = 0
    
    for chunk in chunks:
        try:
            params = {
                "from": "MusB Research <noreply@musbresearch.com>", # Update 'noreply@musbresearch.com' to verified domain
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
            "from": "MusB Research <noreply@musbresearch.com>",
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
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">New Study Inquiry Received</h2>
        
        <p>A new clinical study inquiry has been submitted via the Sponsor Dashboard.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
            <h3 style="margin-top: 0; color: #334155;">Project Identification</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; width: 140px;"><b>Product Name:</b></td><td>{product}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><b>Category:</b></td><td>{inquiry_data.get('category')}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><b>Health Focus:</b></td><td>{inquiry_data.get('primary_focus')}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><b>Development:</b></td><td>{inquiry_data.get('development_stage')}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><b>Timeline:</b></td><td>{inquiry_data.get('timeline')}</td></tr>
            </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
            <h3 style="margin-top: 0; color: #334155;">NDA & Legal Status</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; width: 140px;"><b>NDA Preferred:</b></td><td><span style="color: {'#e11d48' if nda.startswith('YES') else '#059669'}; font-weight: bold;">{nda}</span></td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><b>Legal Entity:</b></td><td>{legal_name}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><b>Signatory:</b></td><td>{inquiry_data.get('signatory_name')} ({inquiry_data.get('signatory_title')})</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;"><b>Address:</b></td><td>{inquiry_data.get('street_address')}<br/>{inquiry_data.get('city')}, {inquiry_data.get('state')} {inquiry_data.get('zip_code')}<br/>{inquiry_data.get('country')}</td></tr>
            </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
            <h3 style="margin-top: 0; color: #334155;">Requirements</h3>
            <p><b>Needs:</b> {", ".join(inquiry_data.get('needs', []))}</p>
            <p><b>Description:</b> {inquiry_data.get('project_description', 'No additional description provided.')}</p>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
            This inquiry was automatically routed to <b>{target_email}</b> based on the sponsor selection.<br/>
            Sponsor User: {inquiry_data.get('sponsor_email', 'Unknown')}
        </p>
    </div>
    """
    
    try:
        resend.Emails.send({
            "from": "MusB Research System <noreply@musbresearch.com>",
            "to": [target_email],
            "subject": subject,
            "html": html_content
        })
        return True
    except Exception as e:
        print(f"Error sending inquiry notification to {target_email}: {e}")
        return False
