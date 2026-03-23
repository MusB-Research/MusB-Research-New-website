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
