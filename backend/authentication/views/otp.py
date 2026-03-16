from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
import logging

from ..models import OTP
from ..utils import verify_recaptcha

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
    OTP.objects.filter(email=email).delete() 
    OTP.objects.create(email=email, code=code)

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
def send_phone_otp(request):
    phone = request.data.get('phone')
    if not phone:
        return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)

    code = OTP.generate_code()
    OTP.objects.filter(phone=phone).delete()
    OTP.objects.create(phone=phone, code=code)

    # Simulation — in production, hook up Twilio here
    logger.info(f"SMS OTP SENT to {phone}: {code}")
    print(f"SMS OTP SENT to {phone}: {code}")
    
    return Response({'message': 'SMS OTP sent successfully (Simulated)'})

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_phone_otp(request):
    phone = request.data.get('phone')
    code = request.data.get('code')

    if not phone or not code:
        return Response({'error': 'Phone and code are required'}, status=status.HTTP_400_BAD_REQUEST)

    otp = OTP.objects.filter(phone=phone, code=code).first()
    if not otp:
        return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

    if otp.is_expired():
        otp.delete()
        return Response({'error': 'Code expired'}, status=status.HTTP_400_BAD_REQUEST)

    otp.is_verified = True
    otp.save()
    return Response({'message': 'Phone verified successfully'})
