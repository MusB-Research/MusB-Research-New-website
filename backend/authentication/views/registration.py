from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.timezone import now
import logging
import os
import uuid
from datetime import timedelta

from ..models import User, OTP, Invitation
from ..utils import send_resend_email

logger = logging.getLogger(__name__)

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

    otp = OTP.objects.filter(email=email, is_verified=True).first()
    if not otp:
        return Response({'error': 'Email not verified'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

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
        has_consented_to_data_use=True 
    )
    otp.delete() 
    
    return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def invite_team_member(request):
    """Invite for specific roles like Sponsor Manager, PI, Coordinator etc."""
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
    
    invitation = Invitation.objects.create(
        email=target_email,
        role=role,
        invited_by=admin,
        organization=organization,
        token=token,
        expires_at=expires_at
    )
    
    setup_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/setup-credentials?token={token}"
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_profile(request):
    """Finalizes user profile setup for first-time or Google users."""
    user = request.user
    data = request.data
    
    # Core Identity Update
    if not user.first_name:
        user.first_name = data.get('first_name', '')
    if not user.last_name:
        user.last_name = data.get('last_name', '')
    user.middle_name = data.get('middle_name', user.middle_name)
    
    # Extended Demographics
    user.gender = data.get('gender', user.gender)
    user.full_address = data.get('full_address', user.full_address)
    user.city = data.get('city', user.city)
    user.state = data.get('state', user.state)
    user.place_of_origin = data.get('place_of_origin', user.place_of_origin)
    
    user.profile_completed = True
    user.save()
    
    return Response({
        'message': 'Profile synchronized and secured.',
        'user': {
            'full_name': user.decrypted_name,
            'profile_completed': True
        }
    })
