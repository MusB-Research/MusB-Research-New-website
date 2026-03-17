from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.contrib.auth import authenticate
from django.utils.timezone import now
import logging
import requests
import datetime

from ..models import User, RefreshToken, TokenBlacklist, AuditLog
from ..security import (
    generate_access_token, generate_refresh_token,
    decode_access_token, decode_refresh_token,
    REFRESH_TOKEN_LIFETIME, hash_token,
)

logger = logging.getLogger(__name__)

# ── Cookie configuration ──────────────────────────────────
COOKIE_OPTS = {
    'httponly':  True,
    'samesite':  'Lax',
    'secure':    not settings.DEBUG,   # True in production (HTTPS only)
    'path':      '/',
}

def _set_auth_cookies(response, access_token: str, refresh_token: str):
    """Attach HttpOnly cookies for both tokens."""
    response.set_cookie('access_token',  access_token,  max_age=8*3600,              **COOKIE_OPTS)
    response.set_cookie('refresh_token', refresh_token, max_age=30*24*3600, **COOKIE_OPTS)
    return response

def _clear_auth_cookies(response):
    """Wipe both auth cookies on logout."""
    response.delete_cookie('access_token',  path='/')
    response.delete_cookie('refresh_token', path='/')
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Unified login for all roles (Superadmin, Admin, PI, Coordinator, Participant, Sponsor)"""
    from django_ratelimit.core import is_ratelimited
    limited = is_ratelimited(
        request,
        group='login',
        key='ip',
        rate='5/m',
        method='POST',
        increment=True,
    )
    if limited:
        AuditLog.log('RATE_LIMITED', request=request, detail='Login rate limit hit')
        return Response({'error': 'Too many login attempts. Please wait 1 minute.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    email    = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = authenticate(request=request, email=email, password=password)
    except Exception as e:
        logger.error(f'Login authenticate() crashed: {e}')
        try:
            from ..models import User as UserModel
            db_user = UserModel.objects.filter(email=email).first()
            user = db_user if (db_user and db_user.password and db_user.check_password(password)) else None
        except Exception as e2:
            logger.error(f'Login fallback also failed: {e2}')
            AuditLog.log('LOGIN_FAILED', user_email=email, request=request, detail='Auth service error')
            return Response({'error': 'Authentication service error.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if not user:
        AuditLog.log('LOGIN_FAILED', user_email=email, request=request, detail='Invalid credentials')
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    if user.is_active is False:
        AuditLog.log('LOGIN_FAILED', user_email=email, request=request, detail='Account deactivated')
        return Response({'error': 'Account deactivated. Contact support.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        access_token           = generate_access_token(user)
        refresh_token, ref_jti = generate_refresh_token(user)
    except Exception as e:
        logger.error(f'JWT signing failed: {e}')
        return Response({'error': 'Token generation failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
    RefreshToken.objects.create(
        user=user,
        token_hash=hash_token(refresh_token),
        jti=ref_jti,
        expires_at=now() + REFRESH_TOKEN_LIFETIME,
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:512],
        ip_address=ip.split(',')[0].strip() if ip and ',' in ip else ip,
    )

    user.last_login = now()
    user.save(update_fields=['last_login'])

    AuditLog.log('LOGIN_SUCCESS', user_email=user.email, request=request)

    response = Response({
        'message': 'Login successful',
        'access': access_token,  # Also returned in body for Authorization header fallback
        'user': {
            'email':        user.email,
            'full_name':    user.decrypted_name,
            'organization': user.decrypted_organization,
            'role':         user.role,
            'picture':      user.profile_picture or '',
        }
    })
    return _set_auth_cookies(response, access_token, refresh_token)

@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    token = request.COOKIES.get('access_token') or request.data.get('token')
    if token:
        try:
            payload = decode_access_token(token)
            jti = payload.get('jti')
            exp = payload.get('exp')
            if jti:
                TokenBlacklist.objects.get_or_create(
                    jti=jti,
                    defaults={
                        'expires_at': datetime.datetime.fromtimestamp(exp, tz=datetime.timezone.utc),
                        'reason': 'logout',
                    }
                )
            
            email = payload.get('email', '')
            user_obj = User.objects.filter(email=email).first()
            if user_obj:
                RefreshToken.objects.filter(user=user_obj, is_revoked=False).update(is_revoked=True)
                AuditLog.log('LOGOUT', user_email=email, request=request)
        except Exception as e:
            logger.warning(f'Logout token decode failed: {e}')

    response = Response({'message': 'Logged out successfully'})
    return _clear_auth_cookies(response)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    old_refresh = request.COOKIES.get('refresh_token') or request.data.get('refresh')
    if not old_refresh:
        return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payload = decode_refresh_token(old_refresh)
    except Exception as e:
        return Response({'error': f'Invalid refresh token: {e}'}, status=status.HTTP_401_UNAUTHORIZED)

    if payload.get('type') != 'refresh':
        return Response({'error': 'Wrong token type'}, status=status.HTTP_401_UNAUTHORIZED)

    stored = RefreshToken.objects.filter(jti=payload['jti']).first()
    if not stored or not stored.is_valid():
        return Response({'error': 'Refresh token has been used or revoked.'}, status=status.HTTP_401_UNAUTHORIZED)

    stored.is_used = True
    stored.save(update_fields=['is_used'])

    user = stored.user
    if user.is_active is False:
        return Response({'error': 'Account deactivated.'}, status=status.HTTP_403_FORBIDDEN)

    new_access = generate_access_token(user)
    new_refresh, new_jti = generate_refresh_token(user)

    RefreshToken.objects.create(
        user=user,
        token_hash=hash_token(new_refresh),
        jti=new_jti,
        expires_at=now() + REFRESH_TOKEN_LIFETIME,
        user_agent=stored.user_agent,
        ip_address=stored.ip_address,
    )

    AuditLog.log('TOKEN_REFRESHED', user_email=user.email, request=request)

    response = Response({
        'message': 'Token refreshed',
        'access': new_access,  # Also returned in body for Authorization header fallback
        'user': {'email': user.email, 'role': user.role},
    })
    return _set_auth_cookies(response, new_access, new_refresh)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_token(request):
    token = request.COOKIES.get('access_token') or request.data.get('token') or request.headers.get('Authorization', '').removeprefix('Bearer ').strip()
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        payload = decode_access_token(token)
        if TokenBlacklist.is_blacklisted(payload.get('jti', '')):
            return Response({'valid': False, 'error': 'Token has been revoked'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'valid': True, 'payload': payload})
    except Exception as e:
        return Response({'valid': False, 'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    credential = request.data.get('credential')
    if not credential:
        return Response({'error': 'Credential is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={credential}')
        id_info = response.json()
        
        if response.status_code != 200 or 'error' in id_info:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)

        email = id_info.get('email')
        full_name = id_info.get('name', 'Google User')
        picture = id_info.get('picture', '')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'full_name': full_name, 'role': 'PARTICIPANT', 'profile_picture': picture}
        )
        
        needs_save = False
        if not user.full_name or user.full_name == 'Google User' or '@' in user.full_name:
            user.full_name = full_name
            needs_save = True
            
        if picture and not user.profile_picture:
            user.profile_picture = picture
            needs_save = True
            
        if needs_save:
            user.save()

        access_token           = generate_access_token(user)
        refresh_token, ref_jti = generate_refresh_token(user)

        # Store refresh token
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        RefreshToken.objects.create(
            user=user,
            token_hash=hash_token(refresh_token),
            jti=ref_jti,
            expires_at=now() + REFRESH_TOKEN_LIFETIME,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:512],
            ip_address=ip.split(',')[0].strip() if ip and ',' in ip else ip,
        )

        user.last_login = now()
        user.save(update_fields=['last_login'])

        AuditLog.log('GOOGLE_LOGIN', user_email=user.email, request=request)

        response = Response({
            'message': 'Login successful',
            'user': {
                'email':        user.email,
                'full_name':    user.decrypted_name,
                'organization': user.decrypted_organization,
                'role':         user.role,
                'picture':      user.profile_picture or '',
            }
        })
        return _set_auth_cookies(response, access_token, refresh_token)
    except Exception as e:
        logger.error(f"Google login error: {e}")
        return Response({'error': 'Google authentication failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
