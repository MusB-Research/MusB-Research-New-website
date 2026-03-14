from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate, login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, OTP, MagicLink
import logging
import requests


from .utils import verify_recaptcha, send_resend_email, generate_token
from .security import decrypt_data, encrypt_data

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    captcha_token = request.data.get('captcha')
    if not verify_recaptcha(captcha_token):
        return Response({'error': 'Human verification failed'}, status=status.HTTP_400_BAD_REQUEST)
    
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    code = OTP.generate_code()
    OTP.objects.filter(email=email).delete() # Remove old OTPs
    OTP.objects.create(email=email, code=code)

    # In Debug mode, print to console via EMAIL_BACKEND
    try:
        send_mail(
            'MusB Research - Verification Code',
            f'Your verification code is: {code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return Response({'message': 'OTP sent successfully'})
    except Exception as e:
        logger.error(f'Failed to send email: {e}')
        return Response({'error': 'Failed to send OTP'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    code = request.data.get('code')

    if not email or not code:
        return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)

    otp = OTP.objects.filter(email=email, code=code).first()
    if not otp:
        return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

    if otp.is_expired():
        otp.delete()
        return Response({'error': 'Code expired'}, status=status.HTTP_400_BAD_REQUEST)

    otp.is_verified = True
    otp.save()
    return Response({'message': 'Code verified successfully'})

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    email = request.data.get('email')
    full_name = request.data.get('full_name')
    password = request.data.get('password')
    timezone = request.data.get('timezone', 'UTC')
    country = request.data.get('country')
    organization = request.data.get('organization')
    phone_number = request.data.get('phone_number')

    if not all([email, full_name, password]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check OTP verification
    otp = OTP.objects.filter(email=email, is_verified=True).first()
    if not otp:
        return Response({'error': 'Email not verified'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate password
    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        email=email, 
        full_name=full_name, 
        organization=organization,
        password=password,
        timezone=timezone,
        country=country,
        phone_number=phone_number,
        has_consented_to_data_use=True # Assumed if completing registration flow
    )
    otp.delete() # Cleanup
    
    return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(email=email, password=password)
    if user:
        # In a real app we'd use JWT or sessions. 
        # For this demo, let's just return success
        return Response({
            'message': 'Login successful',
            'user': {
                'email': user.email,
                'full_name': user.decrypted_name,
                'organization': user.decrypted_organization,
                'role': user.role
            }
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    credential = request.data.get('credential')
    if not credential:
        return Response({'error': 'Credential is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify token with Google
    try:
        response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={credential}')
        id_info = response.json()
        
        if response.status_code != 200 or 'error' in id_info:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)

        email = id_info.get('email')
        full_name = id_info.get('name', 'Google User')

        # Check if user exists, if not create
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'full_name': full_name, 'role': 'PARTICIPANT'}
        )
        
        # If user existed but name is generic/missing, update with Google name
        if not created and (not user.full_name or user.full_name == 'Google User' or '@' in user.full_name):
            user.full_name = full_name
            user.save()

        return Response({
            'message': 'Login successful',
            'access': 'google-verified-token', # Placeholder
            'user': {
                'email': user.email,
                'full_name': user.decrypted_name,
                'organization': user.decrypted_organization,
                'role': user.role
            }
        })
    except Exception as e:
        logger.error(f"Google login error: {e}")
        return Response({'error': 'Google authentication failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if not user:
        # For security, don't reveal if user exists. 
        # But for this demo/request, we'll return success to avoid confusion
        return Response({'message': 'If an account exists, a reset link has been sent'})

    token = generate_token()
    MagicLink.objects.filter(email=email).delete()
    MagicLink.objects.create(email=email, token=token)

    # In a real app, this would be the frontend URL
    reset_link = f"{settings.CORS_ALLOWED_ORIGINS[0]}/reset-password?token={token}"
    
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

    # Validate password
    try:
        validate_password(new_password)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    magic_link.is_used = True
    magic_link.save()

    return Response({'message': 'Password reset successful'})

import uuid
from datetime import timedelta
from django.utils.timezone import now

@api_view(['POST'])
@permission_classes([AllowAny])
def invite_team_member(request):
    invited_by_email = request.data.get('admin_email')
    target_email = request.data.get('email')
    role = request.data.get('role', 'SPONSOR_MANAGER')
    organization = request.data.get('organization')
    
    if not all([target_email, organization]):
        return Response({'error': 'Email and organization are required'}, status=status.HTTP_400_BAD_REQUEST)

    admin = User.objects.filter(email=invited_by_email).first()
    if not admin:
         return Response({'error': 'Admin user not found'}, status=status.HTTP_404_NOT_FOUND)

    token = str(uuid.uuid4())
    expires_at = now() + timedelta(days=7)
    
    from .models import Invitation
    invitation = Invitation.objects.create(
        email=target_email,
        role=role,
        invited_by=admin,
        organization=organization,
        token=token,
        expires_at=expires_at
    )
    
    # Send Invitation Email
    setup_link = f"{settings.CORS_ALLOWED_ORIGINS[0]}/setup-credentials?token={token}"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background-color: #0B101B; color: white;">
        <h2 style="color: #f59e0b;">MusB Research - Team Invitation</h2>
        <p>You have been invited to join <strong>{organization}</strong> as a <strong>{role}</strong> on the MusB Research Platform.</p>
        <p>Click the button below to set up your secure login credentials and access your dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{setup_link}" style="background-color: #f59e0b; color: #0B101B; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">Set Up Credentials</a>
        </div>
        <p style="color: #64748b; font-size: 11px;">This invitation expires on {expires_at.strftime('%Y-%m-%d')}.</p>
    </div>
    """
    
    if send_resend_email(target_email, f"Invitation to join {organization} - MusB Research", html_content):
        return Response({'message': 'Invitation sent successfully', 'token': token})
    else:
        logger.warning(f"Failed to send invitation email to {target_email}. Link: {setup_link}")
        return Response({'message': 'Invitation recorded but email failed to send', 'setup_link': setup_link}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def setup_credentials(request):
    token = request.data.get('token')
    password = request.data.get('password')
    full_name = request.data.get('full_name')
    
    if not all([token, password, full_name]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    from .models import Invitation
    invitation = Invitation.objects.filter(token=token, is_accepted=False).first()
    if not invitation:
        return Response({'error': 'Invalid or already used invitation'}, status=status.HTTP_400_BAD_REQUEST)
        
    if invitation.is_expired():
        return Response({'error': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
        
    user = User.objects.create_user(
        email=invitation.email,
        full_name=full_name,
        password=password,
        organization=invitation.organization,
        role=invitation.role,
        parent_sponsor=invitation.invited_by
    )
    
    invitation.is_accepted = True
    invitation.save()
    
    return Response({'message': 'Account set up successfully. You can now log in.'}, status=status.HTTP_201_CREATED)
