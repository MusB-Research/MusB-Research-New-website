import logging
from rest_framework import authentication, exceptions
from .security import decode_access_token
from .models import User, TokenBlacklist

logger = logging.getLogger(__name__)


class CookieJWTAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for Django REST Framework that reads
    the 'access_token' from HttpOnly cookies.
    """
    def authenticate(self, request):
        # 1. Get token from cookie
        access_token = request.COOKIES.get('access_token')

        # 2. Fallback to Authorization header
        auth_header = request.headers.get('Authorization')
        if not access_token and auth_header and auth_header.startswith('Bearer '):
            access_token = auth_header.split(' ')[1]

        if not access_token:
            return None

        try:
            # 3. Decode and verify token
            payload = decode_access_token(access_token)

            # 4. Check if token is blacklisted
            if TokenBlacklist.is_blacklisted(payload.get('jti', '')):
                logger.debug("Token blacklisted for %s", payload.get('email'))
                raise exceptions.AuthenticationFailed('Token has been revoked')

            # 5. Fetch user
            user = User.objects.filter(email=payload['email']).first()
            if not user:
                logger.debug("User not found: %s", payload['email'])
                raise exceptions.AuthenticationFailed('User not found')

            if not user.is_active:
                logger.debug("User deactivated: %s", user.email)
                raise exceptions.AuthenticationFailed('User account is deactivated')

            logger.debug("Auth success for %s (role: %s)", user.email, user.role)
            return (user, None)

        except Exception as e:
            logger.debug("Auth error: %s", str(e))
            # Re-raise authentication failed exceptions
            if isinstance(e, exceptions.AuthenticationFailed):
                raise e
            # Ignore other decoding errors (they result in 401 anyway)
            return None
