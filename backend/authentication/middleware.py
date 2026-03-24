import re
from django.http import JsonResponse
from rest_framework import status
from .security import decode_access_token
import logging
import jwt

logger = logging.getLogger(__name__)

class OnboardingEnforcementMiddleware:
    """
    Middleware to enforce must_change_password and profile_completed flags.
    Blocks access to all API routes except whitelisted ones if the user hasn't
    completed onboarding.
    """
    
    # Whitelisted paths that do not require full onboarding
    WHITELISTED_PATHS = [
        re.compile(r'^/api/auth/login/?$'),
        re.compile(r'^/api/auth/register/?$'),
        re.compile(r'^/api/auth/google-login/?$'),
        re.compile(r'^/api/auth/refresh/?$'),
        re.compile(r'^/api/auth/logout/?$'),
        re.compile(r'^/api/auth/reset-forced/?$'),
        re.compile(r'^/api/auth/setup-credentials/?$'),
        re.compile(r'^/admin/'),  # Django admin
    ]

    PROFILE_WHITELIST = [
        re.compile(r'^/api/auth/complete-profile/?$'),
    ]

    PASSWORD_WHITELIST = [
        re.compile(r'^/api/auth/reset-password/?$'),
    ]

    # Dashboard whitelist (GET only for initial dashboard load)
    # These paths are allowed for authenticated users even if they haven't completed their profile.
    DASHBOARD_WHITELIST = [
        re.compile(r'^/api/auth/list-team-members/?'),
        re.compile(r'^/api/participants/?'),
        re.compile(r'^/api/studies/?'),
        re.compile(r'^/api/study-inquiries/?'),
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Options request is allowed (CORS)
        if request.method == 'OPTIONS':
            return self.get_response(request)

        # Skip enforcement for strictly whitelisted paths (login, setup, etc.)
        if any(pattern.match(path) for pattern in self.WHITELISTED_PATHS):
            return self.get_response(request)

        # Only enforce on API paths
        if not path.startswith('/api/'):
            return self.get_response(request)

        # Extract token from cookies or auth header
        token = request.COOKIES.get('access_token')
        if not token:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        # If no token, let the normal DRF authentication handle the 401/403
        if not token:
            return self.get_response(request)

        try:
            payload = decode_access_token(token)
            
            # Check for must_change_password
            must_change_password = payload.get('must_change_password', False)
            if must_change_password:
                if not any(pattern.match(path) for pattern in self.PASSWORD_WHITELIST):
                    return JsonResponse(
                        {'error': 'Password change required before proceeding.'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
            # Check for profile_completed (Skip for Super Admins)
            role = payload.get('role', '').upper()
            profile_completed = payload.get('profile_completed', True)
            
            # Allow essential dashboard data even if profile is not completed
            if request.method == 'GET' and any(pattern.match(path) for pattern in self.DASHBOARD_WHITELIST):
                return self.get_response(request)

            if not profile_completed and role != 'SUPER_ADMIN':
                if not any(pattern.match(path) for pattern in self.PROFILE_WHITELIST):
                    # For older tokens or newly-linked ones, double-check essential fields
                    return JsonResponse(
                        {'error': 'Profile completion required before proceeding.'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )

        except jwt.ExpiredSignatureError:
            # Token expired is a routine event, no need to log as full error
            logger.warning(f"Expired token in middleware for {path}")
            pass
        except Exception as e:
            logger.error(f"Middleware token extraction err: {e}")
            pass
        
        return self.get_response(request)
