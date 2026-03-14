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
    
    # Regional & Global Config
    timezone = models.CharField(max_length=50, default='UTC')
    country = models.CharField(max_length=100, blank=True, null=True)
    
    # GDPR & Privacy Compliance
    has_consented_to_data_use = models.BooleanField(default=False)
    withdrawal_requested = models.BooleanField(default=False)
    data_deletion_requested = models.BooleanField(default=False)
    withdrawal_date = models.DateTimeField(null=True, blank=True)

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
    email = models.EmailField()
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
