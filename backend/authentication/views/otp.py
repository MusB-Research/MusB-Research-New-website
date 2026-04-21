from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.timezone import now, timedelta
from rest_framework.throttling import AnonRateThrottle
import logging

from ..models import OTP, User
from ..utils import (
    verify_recaptcha, hash_otp, send_mail_premium
)


logger = logging.getLogger(__name__)

class OTPRequestThrottle(AnonRateThrottle):
    rate = '3/5min'
    scope = 'otp_request'

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([OTPRequestThrottle])
def send_otp(request):
    """
    Production-ready OTP Request.
    Generates a 6-digit numeric OTP, hashes it, and sends via Gmail SMTP.
    """
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Invalidate any existing OTPs for this email
    OTP.objects.filter(email=email).delete()

    # Generate NEW OTP
    code = OTP.generate_code()
    code_hash = hash_otp(code)
    expires_at = now() + timedelta(minutes=5)

    OTP.objects.create(
        email=email,
        code_hash=code_hash,
        expires_at=expires_at
    )

    # Deliver via Premium Gmail SMTP
    success = send_mail_premium(
        to_email=email,
        subject='Verification Code - MusB Research',
        title='Clinical ID Verification',
        body=f'Your secure verification code is below. For your protection, this code will expire in <strong>5 minutes</strong>.<br><br><div style="text-align: center; margin: 32px 0;"><span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #0f172a; background: #f8fafc; padding: 16px 32px; border-radius: 12px; border: 1px solid #e2e8f0;">{code}</span></div>'
    )

    if success:
        return Response({'message': 'OTP sent successfully'})
    else:
        return Response({'error': 'Failed to deliver OTP. Please check your email address.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Production-ready OTP Verification.
    Verifies hashed token, checks expiry, and limits attempts.
    """
    email = request.data.get('email', '').strip().lower()
    otp_input = request.data.get('otp', '').strip()

    if not email or not otp_input:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Get the latest verification record that hasn't been verified yet
    otp_record = OTP.objects.filter(email=email, is_verified=False).order_by('-created_at').first()

    if not otp_record:
        return Response({'error': 'No active verification request found. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

    # Security check 1: Expiry (5 minutes)
    if otp_record.is_expired():
        otp_record.delete()
        return Response({'error': 'Verification code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    # Security check 2: Brute Force Protection (max 5 attempts)
    if otp_record.attempts >= 5:
        otp_record.delete()
        return Response({'error': 'Too many failed attempts. Security lock engaged. Please request a new code.'}, status=status.HTTP_403_FORBIDDEN)

    # Security check 3: Secure Hash Comparison
    if hash_otp(otp_input) == otp_record.code_hash:
        otp_record.is_verified = True
        otp_record.save()
        
        # Log successful verification
        from ..models import AuditLog
        AuditLog.log('OTP_VERIFIED', user_email=email, request=request)
        
        # Action: Authenticate User if they exist (Requirement 3)
        user = User.objects.filter(email=email).first()
        if user:
            from ..security import (
                generate_access_token, generate_refresh_token, 
                hash_token, REFRESH_TOKEN_LIFETIME
            )
            from .auth import _set_auth_cookies, get_user_data_dict
            from ..models import RefreshToken
            
            try:
                access_token           = generate_access_token(user)
                refresh_token, ref_jti = generate_refresh_token(user)
                
                # Persistent Storage
                ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
                RefreshToken.objects.create(
                    user=user,
                    token_hash=hash_token(refresh_token),
                    jti=ref_jti,
                    expires_at=now() + REFRESH_TOKEN_LIFETIME,
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:512],
                    ip_address=ip.split(',')[0].strip() if ip and ',' in ip else ip,
                )
                
                response = Response({
                    'message': 'Identity verified and logged in successfully', 
                    'verified': True,
                    'access': access_token,
                    'refresh': refresh_token,
                    'user': get_user_data_dict(user)
                })
                return _set_auth_cookies(response, access_token, refresh_token)
                
            except Exception as e:
                logger.error(f"OTP Login Token Generation Failed: {e}")
                return Response({'error': 'Verification successful but token generation failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'message': 'Identity verified successfully', 
            'email': email,
            'verified': True
        })
    else:
        # Penalize failed attempt
        otp_record.increment_attempts()
        remaining = 5 - otp_record.attempts
        
        # Log failed attempt
        from ..models import AuditLog
        AuditLog.log('OTP_FAILED', user_email=email, request=request, detail=f'Failed attempt {otp_record.attempts}/5')
        
        if remaining <= 0:
            otp_record.delete()
            return Response({'error': 'Too many failed attempts. This code is now invalid.'}, status=status.HTTP_403_FORBIDDEN)
            
        return Response({
            'error': f'Invalid code.',
            'attempts_remaining': remaining
        }, status=status.HTTP_400_BAD_REQUEST)


