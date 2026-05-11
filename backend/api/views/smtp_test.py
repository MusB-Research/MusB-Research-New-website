from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.core.mail import send_mail
from django.conf import settings
import logging

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
        message = (
            f"This is a test email from the MusB Research Platform.\n\n"
            f"Configuration Details:\n"
            f"- Backend: {backend}\n"
            f"- Host: {host}\n"
            f"- User: {user}\n"
            f"- Timestamp: {logging.time.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
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
        
    except Exception as e:
        logger.error(f"[SMTP-TEST] Failed to send test email: {str(e)}", exc_info=True)
        return Response({
            'error': 'SMTP connection failed',
            'details': str(e),
            'backend': settings.EMAIL_BACKEND
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
