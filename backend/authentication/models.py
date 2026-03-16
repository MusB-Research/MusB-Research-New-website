from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.timezone import now
import random
import datetime
from .security import encrypt_data, decrypt_data

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('PARTICIPANT', 'Participant'),
        ('PI', 'Principal Investigator'),
        ('COORDINATOR', 'Coordinator'),
        ('SPONSOR', 'Sponsor Admin'),
        ('SPONSOR_MANAGER', 'Study Manager'),
        ('SPONSOR_VIEWER', 'Sponsor Viewer'),
        ('ADMIN', 'Admin'),
        ('SUPER_ADMIN', 'Super Admin'),
    ]
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    organization = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='PARTICIPANT')
    
    # Hierarchy
    parent_sponsor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='team_members')
    
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.URLField(max_length=1024, blank=True, null=True)
    
    # Regional & Global Config
    timezone = models.CharField(max_length=50, default='UTC')
    country = models.CharField(max_length=100, blank=True, null=True)
    
    # GDPR & Privacy Compliance
    has_consented_to_data_use = models.BooleanField(default=False)
    withdrawal_requested = models.BooleanField(default=False)
    data_deletion_requested = models.BooleanField(default=False)
    withdrawal_date = models.DateTimeField(null=True, blank=True)

    # Fix #5 — explicit default prevents is_active=None for new users
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def save(self, *args, **kwargs):
        # Encrypt name if not already encrypted
        if self.full_name and not self.full_name.startswith('gAAAA'):
            self.full_name = encrypt_data(self.full_name)
        
        # Encrypt organization if not already encrypted
        if self.organization and not self.organization.startswith('gAAAA'):
            self.organization = encrypt_data(self.organization)

        # Encrypt phone if not already encrypted
        if self.phone_number and not self.phone_number.startswith('gAAAA'):
            self.phone_number = encrypt_data(self.phone_number)

        # Fix #5 — normalize None → True for legacy accounts on every save
        if self.is_active is None:
            self.is_active = True
            
        super().save(*args, **kwargs)

    @property
    def decrypted_name(self):
        return decrypt_data(self.full_name)

    @property
    def decrypted_organization(self):
        return decrypt_data(self.organization)

    @property
    def decrypted_phone(self):
        return decrypt_data(self.phone_number)

    def __str__(self):
        return self.email


# ─────────────────────────────────────────────────────────
# Fix #2 — Refresh Token Rotation (stored hash in DB)
# ─────────────────────────────────────────────────────────
class RefreshToken(models.Model):
    """Stores the SHA-256 hash of issued refresh tokens for rotation tracking."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refresh_tokens')
    token_hash = models.CharField(max_length=64, unique=True)  # SHA-256 hex digest
    jti = models.CharField(max_length=64, unique=True)         # JWT ID claim
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    is_revoked = models.BooleanField(default=False)
    user_agent = models.CharField(max_length=512, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def is_expired(self):
        return now() > self.expires_at

    def is_valid(self):
        return not self.is_used and not self.is_revoked and not self.is_expired()

    def __str__(self):
        return f"RefreshToken({self.user.email}, jti={self.jti[:8]}...)"


# ─────────────────────────────────────────────────────────
# Fix #4 — Token Blacklist (revoked JTIs for logout)
# ─────────────────────────────────────────────────────────
class TokenBlacklist(models.Model):
    """Revoked JWT JTIs — checked on every authenticated request."""
    jti = models.CharField(max_length=64, unique=True)
    revoked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()   # So we can clean up expired entries
    reason = models.CharField(max_length=50, default='logout')  # logout | password_change | admin_revoke

    @classmethod
    def is_blacklisted(cls, jti: str) -> bool:
        return cls.objects.filter(jti=jti).exists()

    def __str__(self):
        return f"Blacklisted JTI {self.jti[:8]}... ({self.reason})"


# ─────────────────────────────────────────────────────────
# Fix #6 — Audit Log
# ─────────────────────────────────────────────────────────
class AuditLog(models.Model):
    """Immutable audit trail for all auth and role events."""
    ACTION_CHOICES = [
        ('LOGIN_SUCCESS',    'Login Success'),
        ('LOGIN_FAILED',     'Login Failed'),
        ('LOGOUT',           'Logout'),
        ('TOKEN_REFRESHED',  'Token Refreshed'),
        ('TOKEN_REVOKED',    'Token Revoked'),
        ('PASSWORD_CHANGED', 'Password Changed'),
        ('PASSWORD_RESET',   'Password Reset'),
        ('ROLE_CHANGED',     'Role Changed'),
        ('ACCOUNT_CREATED',  'Account Created'),
        ('ACCOUNT_DISABLED', 'Account Disabled'),
        ('GOOGLE_LOGIN',     'Google Login'),
        ('RATE_LIMITED',     'Rate Limited'),
    ]
    user_email = models.EmailField(null=True, blank=True)   # nullable for failed unknown logins
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True, null=True)
    detail = models.CharField(max_length=500, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    @classmethod
    def log(cls, action: str, user_email: str = None, request=None, detail: str = None):
        """Convenience factory — call from anywhere without try/except."""
        try:
            ip = None
            ua = None
            if request:
                ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
                if ip and ',' in ip:
                    ip = ip.split(',')[0].strip()
                ua = request.META.get('HTTP_USER_AGENT', '')[:512]
            cls.objects.create(
                user_email=user_email,
                action=action,
                ip_address=ip,
                user_agent=ua,
                detail=detail,
            )
        except Exception:
            pass  # Audit log must never crash the main flow

    def __str__(self):
        return f"[{self.timestamp}] {self.action} — {self.user_email}"


# ─────────────────────────────────────────────────────────
# Existing Models (unchanged)
# ─────────────────────────────────────────────────────────
class Invitation(models.Model):
    email = models.EmailField()
    role = models.CharField(max_length=30, choices=User.ROLE_CHOICES)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    organization = models.CharField(max_length=255)
    token = models.CharField(max_length=100, unique=True)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return now() > self.expires_at

    def __str__(self):
        return f"Invite for {self.email} to join {self.organization}"

class OTP(models.Model):
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_expired(self):
        # OTP valid for 10 minutes
        return now() > self.created_at + datetime.timedelta(minutes=10)

    @staticmethod
    def generate_code():
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

class MagicLink(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        # Magic link valid for 1 hour
        return now() > self.created_at + datetime.timedelta(hours=1)
