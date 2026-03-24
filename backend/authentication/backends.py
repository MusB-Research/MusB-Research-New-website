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
            # OPTIMIZATION: Try case-sensitive exact email first (index-optimized)
            user = User.objects.filter(email=username).first()
            
            # If fail, try case-insensitive email or username lookup
            if not user:
                user = User.objects.filter(
                    Q(email__iexact=username) | Q(username__iexact=username)
                ).first()
            
            if user and user.check_password(password):
                return user
        except Exception:
            return None
        return None
