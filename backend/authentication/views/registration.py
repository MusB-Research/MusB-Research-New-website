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
from typing import List

from ..models import User, OTP, Invitation, RefreshToken, AuditLog
from ..utils import send_resend_email, handle_credential_upload
from ..security import generate_access_token, generate_refresh_token, hash_token, REFRESH_TOKEN_LIFETIME, decrypt_data
from .auth import _set_auth_cookies

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
@permission_classes([IsAuthenticated])
def invite_team_member(request):
    """Invite for specific roles like Sponsor Manager, PI, Coordinator etc."""
    admin = request.user
    target_email = request.data.get('email')
    role = request.data.get('role', 'sponsor')
    # Prevent IntegrityError by ensuring organization is never None
    organization = request.data.get('organization') or admin.organization or getattr(admin, 'affiliation', None) or 'MusB'
    
    if not target_email:
        return Response({'error': 'Target email is required'}, status=status.HTTP_400_BAD_REQUEST)

    # CHECK IF ALREADY INVITED (PENDING) - IF SO, REDIRECT TO RESEND LOGIC
    existing_invite = Invitation.objects.filter(email=target_email, is_accepted=False).first()
    if existing_invite:
        # Update existing invite instead of creating new one (acts as a resend)
        existing_invite.token = str(uuid.uuid4())
        existing_invite.expires_at = now() + timedelta(days=7)
        existing_invite.role = role
        existing_invite.organization = organization
        existing_invite.save()
        
        setup_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/setup-credentials?token={existing_invite.token}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background-color: #0B101B; color: white;">
            <h2 style="color: #f59e0b;">MusB Research - Team Invitation (Updated)</h2>
            <p>You have been re-invited to join <strong>{organization}</strong> as a <strong>{role}</strong> on the MusB Research Platform.</p>
            <p>Click the button below to set up your secure login credentials and access your dashboard.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{setup_link}" style="background-color: #f59e0b; color: #0B101B; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">Set Up Credentials</a>
            </div>
            <p style="color: #64748b; font-size: 11px;">This invitation expires on {existing_invite.expires_at.strftime('%Y-%m-%d')}.</p>
        </div>
        """
        if send_resend_email(target_email, f"Invitation to join {organization} - MusB Research", html_content):
            return Response({'message': 'Existing invitation updated and resent successfully', 'token': existing_invite.token})
        return Response({'message': 'Invitation updated but email failed', 'setup_link': setup_link})

    token = str(uuid.uuid4())
    expires_at = now() + timedelta(days=7)
    
    scope = request.data.get('scope', 'ALL')
    study_ids = request.data.get('study_ids', [])
    
    invitation = Invitation.objects.create(
        email=target_email,
        role=role,
        invited_by=admin,
        organization=organization,
        token=token,
        scope=scope,
        study_ids=study_ids,
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
        parent_sponsor=invitation.invited_by,
        assigned_studies=invitation.study_ids
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
    
    required_fields = [
        'first_name', 'last_name', 'gender', 'full_address', 
        'city', 'state', 'zip_code', 'country', 
        'place_of_origin', 'mobile_number'
    ]
    
    missing: List[str] = []
    for field in required_fields:
        val = data.get(field)
        if hasattr(user, field) and getattr(user, field):
            pass # skip if already in user object
        elif field == 'mobile_number' and user.phone_number:
            pass
        elif not val or not str(val).strip():
            missing.append(field)
            
    if missing:
        return Response({'error': f'Missing required fields: {", ".join(missing)}'}, status=status.HTTP_400_BAD_REQUEST)

    # Professional Role Documents (PI, Coordinator)
    role_check = (user.role or '').upper()
    if role_check in ['PI', 'COORDINATOR']:
        doc_fields = {
            'medical_licence': 'Medical Licence',
            'insurance_certificate': 'Insurance Certificate',
            'cv_document': 'CV Document'
        }
        for field_name, label in doc_fields.items():
            file_obj = request.FILES.get(field_name)
            if not file_obj and not getattr(user, field_name):
                return Response({'error': f'{label} is required for professional roles'}, status=status.HTTP_400_BAD_REQUEST)
            if file_obj:
                saved_path = handle_credential_upload(user, file_obj, field_name)
                if saved_path:
                    setattr(user, field_name, saved_path)
                else:
                    return Response({'error': f'Invalid file format for {label}. Please upload PDF, JPG, or PNG.'}, status=status.HTTP_400_BAD_REQUEST)

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
    user.zip_code = data.get('zip_code', user.zip_code)
    user.country = data.get('country', user.country)
    user.place_of_origin = data.get('place_of_origin', user.place_of_origin)
    user.phone_number = data.get('mobile_number', user.phone_number)
    
    # Make sure we explicitly set profile_completed to True
    user.profile_completed = True
    
    # First save the fields that need encryption
    try:
        user.save()
    except Exception as e:
        logger.error(f"Failed to encrypt and save profile data: {e}")
        
    # Then explicitly enforce profile_completed=True just in case
    User.objects.filter(pk=user.pk).update(profile_completed=True)
    
    # Issue Full JWT Token
    access_token = generate_access_token(user)
    refresh_token, ref_jti = generate_refresh_token(user)

    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
    ip_address = ip.split(',')[0].strip() if ip and ',' in ip else ip

    # Invalidate old refresh tokens
    RefreshToken.objects.filter(user=user, is_revoked=False).update(is_revoked=True)

    RefreshToken.objects.create(
        user=user,
        token_hash=hash_token(refresh_token),
        jti=ref_jti,
        expires_at=now() + REFRESH_TOKEN_LIFETIME,
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:512],
        ip_address=ip_address,
    )

    response = Response({
        'message': 'Profile synchronized and secured.',
        'access': access_token,
        'user': {
            'email':        user.email,
            'affiliation':  getattr(user, 'affiliation', 'musb'),
            'status':       getattr(user, 'status', 'active'),
            'picture':      user.profile_picture or '',
            'must_reset':   user.must_change_password,
            'profile_incomplete': False,
            'mobile_number': user.decrypted_phone or '',
            'full_address': decrypt_data(user.full_address) if user.full_address else '',
            'city': decrypt_data(user.city) if user.city else '',
            'state': decrypt_data(user.state) if user.state else '',
            'zip_code': user.zip_code or '',
            'country': user.country or '',
            'place_of_origin': decrypt_data(user.place_of_origin) if user.place_of_origin else '',
            'timezone': user.timezone or 'UTC',
            'medical_licence': user.medical_licence,
            'insurance_certificate': user.insurance_certificate,
            'cv_document': user.cv_document,
        }
    })
    return _set_auth_cookies(response, access_token, refresh_token)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_team_members(request):
    """Retrieve all users and pending invites for the sponsor's organization."""
    admin = request.user
    # Use SAME fallback logic as invite_team_member
    org = admin.organization or getattr(admin, 'affiliation', None) or 'MusB'
    
    if not org:
        return Response([], status=200)

    # Get registered team members
    users = User.objects.filter(organization=org).exclude(id=admin.id)
    
    # Get pending invitations
    invites = Invitation.objects.filter(organization=org, is_accepted=False)

    members = []
    
    # Add active users
    for u in users:
        members.append({
            'name': f"{decrypt_data(u.first_name)} {decrypt_data(u.last_name)}".strip() if (u.first_name or u.last_name) else u.email.split('@')[0],
            'email': u.email,
            'role': u.role or 'Sponsor Member',
            'status': 'ACTIVE',
            'id': str(u.id)
        })
        
    # Add pending invites
    for i in invites:
        members.append({
            'name': 'Awaiting Activation',
            'email': i.email,
            'role': i.role,
            'status': 'PENDING',
            'id': f"inv-{i.id}"
        })
        
    return Response(members)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_invitation(request, invitation_id):
    """Resend a pending invitation."""
    admin = request.user
    org = admin.organization or getattr(admin, 'affiliation', None) or 'MusB'
    
    if invitation_id.startswith('inv-'):
        invitation_id = invitation_id[4:]
        
    invitation = Invitation.objects.filter(id=invitation_id, organization=org, is_accepted=False).first()
    if not invitation:
        return Response({'error': 'Invitation not found or already accepted'}, status=status.HTTP_404_NOT_FOUND)
        
    invitation.token = str(uuid.uuid4())
    invitation.expires_at = now() + timedelta(days=7)
    invitation.save()
    
    setup_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/setup-credentials?token={invitation.token}"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background-color: #0B101B; color: white;">
        <h2 style="color: #f59e0b;">MusB Research - Team Invitation (Resent)</h2>
        <p>This is a reminder that you have been invited to join <strong>{org}</strong> as a <strong>{invitation.role}</strong> on the MusB Research Platform.</p>
        <p>Click the button below to set up your secure login credentials and access your dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{setup_link}" style="background-color: #f59e0b; color: #0B101B; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">Set Up Credentials</a>
        </div>
        <p style="color: #64748b; font-size: 11px;">This invitation expires on {invitation.expires_at.strftime('%Y-%m-%d')}.</p>
    </div>
    """
    
    if send_resend_email(invitation.email, f"Invitation (Resent) to join {org} - MusB Research", html_content):
        return Response({'message': 'Invitation resent successfully'})
    else:
        return Response({'error': 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
