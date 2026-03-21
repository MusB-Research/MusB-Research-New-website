from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import logging
import os

from ..models import User, MagicLink
from ..utils import send_resend_email, generate_token

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
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

    reset_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token={token}"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background-color: #0B101B; color: white;">
        <h2 style="color: #06b6d4;">MusB Research - Reset Your Password</h2>
        <p>You requested a password reset. Click the button below to set a new password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #06b6d4; color: #0B101B; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">If you did not request this, please ignore this email.</p>
    </div>
    """

    if send_resend_email(email, "Reset Your Password - MusB Research", html_content):
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
    user.save()
    
    from ..models import AuditLog
    AuditLog.log('PASSWORD_RESET_FORCED', user_email=user.email, request=request, detail='Mandatory password reset completed')

    return Response({'message': 'Identity secured. Password updated successfully.'})
