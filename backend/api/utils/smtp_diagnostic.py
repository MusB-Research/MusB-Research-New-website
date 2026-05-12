import smtplib
import ssl
import logging
import os
from django.conf import settings

logger = logging.getLogger(__name__)

def diagnostic_smtp_test(recipient_email):
    """
    Standalone SMTP diagnostic test with maximum verbosity.
    Bypasses Django's email abstraction to test the raw smtplib connection.
    """
    smtp_host = getattr(settings, 'EMAIL_HOST', 'smtp.gmail.com')
    smtp_port = getattr(settings, 'EMAIL_PORT', 587)
    smtp_user = getattr(settings, 'EMAIL_HOST_USER', '')
    smtp_pass = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    use_tls = getattr(settings, 'EMAIL_USE_TLS', True)

    logger.info("Starting Standalone SMTP Diagnostic Test")
    logger.info(f"Host: {smtp_host}")
    logger.info(f"Port: {smtp_port}")
    logger.info(f"User: {smtp_user}")
    logger.info(f"TLS Enabled: {use_tls}")
    
    # Check if password exists (don't log it)
    if not smtp_pass:
        logger.error("CRITICAL: EMAIL_HOST_PASSWORD is empty!")
        return False
    else:
        logger.info("EMAIL_HOST_PASSWORD is set (length: %d)", len(smtp_pass))

    try:
        # Create a secure SSL context
        context = ssl.create_default_context()
        
        logger.info(f"Attempting to connect to {smtp_host}:{smtp_port}...")
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=30)
        
        # ENABLE DEBUG LEVEL 1
        server.set_debuglevel(1)
        
        if use_tls:
            logger.info("Sending EHLO...")
            server.ehlo()
            logger.info("Starting TLS...")
            server.starttls(context=context)
            logger.info("Sending EHLO again after TLS...")
            server.ehlo()
        
        logger.info(f"Attempting login for {smtp_user}...")
        server.login(smtp_user, smtp_pass)
        logger.info("Login successful!")
        
        # Send a simple test email
        subject = "MusB Production SMTP Diagnostic"
        body = "<h1>SMTP Diagnostic Success</h1><p>If you see this, raw SMTP is working in production.</p>"
        
        from_email = f"MusB Research <{smtp_user}>"
        msg = f"From: {from_email}\nTo: {recipient_email}\nSubject: {subject}\nContent-Type: text/html\n\n{body}"
        
        logger.info(f"Sending test email to {recipient_email}...")
        server.sendmail(smtp_user, [recipient_email], msg)
        logger.info("Test email sent successfully!")
        
        server.quit()
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {e.smtp_code} - {e.smtp_error}")
        logger.error("HINT: This usually means the App Password is wrong or Google is blocking the login.")
        return False
    except smtplib.SMTPConnectError as e:
        logger.error(f"SMTP Connection Error: {e.smtp_code} - {e.smtp_error}")
        return False
    except Exception as e:
        logger.exception(f"Unexpected SMTP Diagnostic Error: {str(e)}")
        return False
