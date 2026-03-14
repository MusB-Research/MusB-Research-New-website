from django.urls import path
from . import views

urlpatterns = [
    path('send-otp/', views.send_otp, name='send_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('google-login/', views.google_login, name='google_login'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('invite-team-member/', views.invite_team_member, name='invite_team_member'),
    path('setup-credentials/', views.setup_credentials, name='setup_credentials'),
]
