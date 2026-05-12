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
    rate = '3/minute'
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
    expires_at = now() + timedelta(minutes=10)

    OTP.objects.create(
        email=email,
        code_hash=code_hash,
        expires_at=expires_at
    )

    # Deliver via MusB branded Gmail SMTP (no Resend)
    # try:
    #     from api.utils.email_utils import send_musb_system_email
    #     success = send_musb_system_email(
    #         user_email=email,
    #         user_name=email.split('@')[0].replace('.', ' ').replace('_', ' ').title(),
    #         mode='VERIFY',
    #         secret_data=code,
    #     )
    # except Exception:
    #     # Fallback to legacy premium mailer
    #     success = send_mail_premium(
    #         to_email=email,
    #         subject='Verification Code - MusB Research',
    #         title='Clinical ID Verification',
    #         body=f'Your secure verification code is <strong>{code}</strong>. It expires in 10 minutes.',
    #     )

    # NEW — returns instantly, email sends in background
    try:
        from api.tasks import send_email_task
        send_email_task.delay(
            user_email=email,
            user_name=email.split('@')[0].replace('.', ' ').replace('_', ' ').title(),
            mode='VERIFY',
            secret_data=code,
        )
        success = True  # task queued successfully
    except Exception:
        success = send_mail_premium(
            to_email=email,
            subject='Verification Code - MusB Research',
            title='Clinical ID Verification',
            body=f'Your secure verification code is <strong>{code}</strong>. It expires in 10 minutes.',
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

@api_view(['POST'])
@permission_classes([AllowAny])
def send_phone_otp(request):
    """
    Phone-based OTP Request (Simulated).
    Generates a 6-digit numeric OTP and stores it securely.
    """
    phone = request.data.get('phone', '').strip()
    if not phone:
        return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)

    code = OTP.generate_code()
    
    # Invalidate previous unverified requests for this phone
    OTP.objects.filter(phone=phone, is_verified=False).delete()

    # Create secure hashed record
    from ..utils import hash_otp
    OTP.objects.create(
        phone=phone,
        code_hash=hash_otp(code),
        expires_at=now() + timedelta(minutes=10)
    )

    # ─────────────────────────────────────────────────────────
    # SMS Dispatch Simulation
    # ─────────────────────────────────────────────────────────
    logger.info(f"SMS OTP SENT to {phone}: {code}")
    print(f"SMS OTP SENT to {phone}: {code}") 
    
    return Response({
        'message': 'SMS OTP sent successfully (Simulated)',
        'phone': phone
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_phone_otp(request):
    """Verifies the 6-digit SMS code."""
    phone = request.data.get('phone', '').strip()
    otp_input = request.data.get('code', '').strip()

    if not phone or not otp_input:
        return Response({'error': 'Phone and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Get latest record
    otp_record = OTP.objects.filter(phone=phone, is_verified=False).order_by('-created_at').first()

    if not otp_record:
        return Response({'error': 'No active verification request found.'}, status=status.HTTP_400_BAD_REQUEST)

    if otp_record.is_expired():
        otp_record.delete()
        return Response({'error': 'Code has expired.'}, status=status.HTTP_400_BAD_REQUEST)

    if otp_record.attempts >= 5:
        otp_record.delete()
        return Response({'error': 'Too many failed attempts.'}, status=status.HTTP_403_FORBIDDEN)

    from ..utils import hash_otp
    if hash_otp(otp_input) == otp_record.code_hash:
        otp_record.is_verified = True
        otp_record.save()
        
        # Log success
        from ..models import AuditLog
        AuditLog.log('PHONE_VERIFIED', user_email=phone, request=request)
        
        return Response({
            'message': 'Phone verified successfully', 
            'verified': True
        })
    else:
        otp_record.increment_attempts()
        return Response({
            'error': 'Invalid code.',
            'attempts_remaining': 5 - otp_record.attempts
        }, status=status.HTTP_400_BAD_REQUEST)
