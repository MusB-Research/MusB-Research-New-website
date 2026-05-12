from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.core.mail import send_mail
from django.conf import settings
import logging
import smtplib
import ssl

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_smtp_connection(request):
    """
    Secure admin-only endpoint to verify SMTP configuration and delivery.
    """
    target_email = request.data.get('email')
    if not target_email:
        return Response({'error': 'Recipient email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Check current email backend
        backend = settings.EMAIL_BACKEND
        host = getattr(settings, 'EMAIL_HOST', 'N/A')
        user = getattr(settings, 'EMAIL_HOST_USER', 'N/A')
        
        logger.info(f"[SMTP-TEST] Attempting to send test email to {target_email} via {host}")
        
        subject = ' MusB Research SMTP Test'
        import datetime
        message = (
            f"This is a test email from the MusB Research Platform.\n\n"
            f"Configuration Details:\n"
            f"- Backend: {backend}\n"
            f"- Host: {host}\n"
            f"- User: {user}\n"
            f"- Timestamp: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            f"If you received this, your Gmail SMTP production setup is WORKING."
        )
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[target_email],
            fail_silently=False,
        )
        
        return Response({
            'message': 'Test email sent successfully',
            'details': {
                'backend': backend,
                'host': host,
                'user': user,
                'recipient': target_email
            }
        })
        
@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_smtp_raw(request):
    """
    Standalone SMTP diagnostic test with maximum verbosity (debuglevel 1).
    Bypasses Django's email abstraction.
    """
    target_email = request.data.get('email')
    if not target_email:
        return Response({'error': 'Recipient email is required'}, status=status.HTTP_400_BAD_REQUEST)

    smtp_host = getattr(settings, 'EMAIL_HOST', 'smtp.gmail.com')
    smtp_port = getattr(settings, 'EMAIL_PORT', 587)
    smtp_user = getattr(settings, 'EMAIL_HOST_USER', '')
    smtp_pass = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    use_tls = getattr(settings, 'EMAIL_USE_TLS', True)

    logs = []
    def log_append(msg):
        logger.info(f"[SMTP-RAW] {msg}")
        logs.append(msg)

    log_append("Starting Raw SMTP Diagnostic")
    
    try:
        context = ssl.create_default_context()
        log_append(f"Connecting to {smtp_host}:{smtp_port}...")
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
        server.set_debuglevel(1)
        
        if use_tls:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            log_append("TLS Handshake complete")
        
        log_append(f"Logging in as {smtp_user}...")
        server.login(smtp_user, smtp_pass)
        log_append("Login SUCCESS")
        
        subject = "MusB Production Raw SMTP Test"
        body = "If you see this, raw smtplib is working."
        msg = f"Subject: {subject}\n\n{body}"
        
        server.sendmail(smtp_user, [target_email], msg)
        log_append("Email sent successfully")
        server.quit()
        
        return Response({
            'status': 'success',
            'logs': logs
        })
    except Exception as e:
        log_append(f"FAILED: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e),
            'logs': logs
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
