from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from .models import User

class DualAuthBackend(ModelBackend):
    """
    Custom authentication backend that allows users to log in
    using either their email address or their User ID (username).
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None
            
        try:
            # 1. Exact email match (case-sensitive, highly indexed)
            user = User.objects.filter(email=username).first()
            
            # 2. Fallback: exact username (case-sensitive)
            if not user:
                user = User.objects.filter(username=username).first()

            # 3. Last resort: case-insensitive (slower regex check)
            if not user:
                user = User.objects.filter(
                    Q(email__iexact=username) | Q(username__iexact=username)
                ).first()
            
            if user and user.check_password(password):
                return user
        except Exception:
            return None
        return None
