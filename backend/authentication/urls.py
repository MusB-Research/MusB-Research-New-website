from django.urls import path
from .views import auth, otp, registration, password, admin_users

urlpatterns = [
    # OTP
    path('send-otp/', otp.send_otp, name='send_otp'),
    path('verify-otp/', otp.verify_otp, name='verify_otp'),
    path('send-phone-otp/', otp.send_phone_otp, name='send_phone_otp'),
    path('verify-phone-otp/', otp.verify_phone_otp, name='verify_phone_otp'),
    
    # Auth
    path('login/', auth.login_view, name='login'),
    path('logout/', auth.logout_view, name='logout'),
    path('refresh/', auth.refresh_token_view, name='refresh'),
    path('verify/', auth.verify_token, name='verify_token'),
    path('google-login/', auth.google_login, name='google_login'),
    
    # Registration & Invitations
    path('register/', registration.register, name='register'),
    path('invite-team-member/', registration.invite_team_member, name='invite_team_member'),
    path('setup-credentials/', registration.setup_credentials, name='setup_credentials'),
    path('complete-profile/', registration.complete_profile, name='complete_profile'),
    
    # Password Management
    path('forgot-password/', password.forgot_password, name='forgot_password'),
    path('reset-password/', password.reset_password, name='reset_password'),
    path('reset-forced/', password.reset_forced, name='reset_forced'),

    # Super Admin Direct User Creation (no email verification required)
    path('admin/create-user/', admin_users.admin_create_user, name='admin_create_user'),
    path('admin/resend-credentials/<str:user_id>/', admin_users.admin_resend_credentials, name='admin_resend_credentials'),
    path('admin/audit-logs/', admin_users.admin_get_audit_logs, name='admin_audit_logs'),
]

