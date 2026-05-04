from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import logging
import os

from ..models import User, MagicLink
from ..utils import generate_token

logger = logging.getLogger(__name__)

class PasswordResetThrottle(AnonRateThrottle):
    scope = 'password_reset'

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({'message': 'If an account exists, a reset link has been sent'})

    token = generate_token()
    MagicLink.objects.filter(email=email).delete()
    MagicLink.objects.create(email=email, token=token)

    from django.conf import settings
    reset_link = f"{getattr(settings, 'FRONTEND_URL', 'https://musbhealth.com').rstrip('/')}/reset-password?token={token}"
    
    from ..utils import send_mail_premium
    success = send_mail_premium(
        to_email=email,
        subject='Reset Your Password - MusB Research',
        title='Identity Recovery',
        body=f"Hello,<br><br>We received a request to reset your MusB Research password. For your security, you can either click the button below or scan the QR code with your mobile device to set a new password.<br><br>This recovery link is temporary and will <strong>expire in 10 minutes</strong>.",
        button_text='Reset Password',
        button_url=reset_link,
        qr_url=reset_link
    )

    if success:
        return Response({'message': 'Reset link sent successfully'})
    else:
        return Response({'error': 'Failed to send reset link'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get('token')
    new_password = request.data.get('password')

    if not token or not new_password:
        return Response({'error': 'Token and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    magic_link = MagicLink.objects.filter(token=token, is_used=False).first()
    if not magic_link:
        return Response({'error': 'Invalid or used token'}, status=status.HTTP_400_BAD_REQUEST)

    if magic_link.is_expired():
        return Response({'error': 'Reset link has expired'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=magic_link.email).first()
    if not user:
        return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(new_password)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.status = 'ACTIVE'
    user.save()

    magic_link.is_used = True
    magic_link.save()

    return Response({'message': 'Password reset successful'})

from django.views.decorators.csrf import csrf_exempt
from ..authenticate import CookieJWTAuthentication

@csrf_exempt
@api_view(['POST'])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def reset_forced(request):
    """Handles first-time login password change requirement."""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('password')

    if not old_password or not new_password:
        return Response({'error': 'Original and new password required'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(old_password):
         return Response({'error': 'Current security key is invalid'}, status=status.HTTP_400_BAD_REQUEST)

    if old_password == new_password:
        return Response({'error': 'New password must be different from current one'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.must_change_password = False
    user.status = 'ACTIVE'
    user.save()
    
    from ..models import AuditLog
    AuditLog.log('PASSWORD_RESET_FORCED', user_email=user.email, request=request, detail='Mandatory password reset completed')

    return Response({'message': 'Identity secured. Password updated successfully.'})
