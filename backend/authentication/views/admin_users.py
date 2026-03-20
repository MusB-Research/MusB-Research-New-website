from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now
from django.utils.crypto import get_random_string
from django.conf import settings
import random
import string
import secrets
import logging
from ..models import User, AuditLog
from ..utils import send_resend_email

logger = logging.getLogger(__name__)

ALLOWED_ROLES = ['super_admin', 'admin', 'sponsor', 'coordinator', 'pi', 'team_member', 'PARTICIPANT']

def check_permission(creator, target_role):
    """Enforce RBAC rules for user creation (Section 1.4)"""
    if creator.status != "active":
        return False

    c_role = creator.role.lower()
    c_aff  = creator.affiliation.lower()
    t_role = target_role.lower()

    if c_role == "super_admin":
        return t_role in ["admin", "sponsor", "coordinator", "pi"]
    
    if c_role == "admin":
        return t_role in ["sponsor", "coordinator", "pi"]
    
    if c_role == "coordinator" and c_aff == "musb":
        return t_role in ["sponsor", "pi"]
    
    if c_role == "pi" and c_aff == "musb":
        return t_role in ["sponsor", "coordinator"]
    
    if c_role == "pi" and c_aff == "onsite":
        return t_role == "team_member"

    return False

def generate_secure_password(length=12):
    """Generates a cryptographically random temporary password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_unique_username(first_name, last_name):
    """Generates a username: first.last.4digits"""
    base = f"{first_name.lower().strip()}.{last_name.lower().strip()}"
    # Replace spaces/special chars if any
    base = "".join(c if c.isalnum() or c == "." else "" for c in base)
    
    for _ in range(10): # Try a few times
        rand_suffix = str(random.randint(1000, 9999))
        candidate = f"{base}.{rand_suffix}"
        if not User.objects.filter(username=candidate).exists():
            return candidate
    return f"{base}.{get_random_string(6)}"

@api_view(['POST'])
def admin_create_user(request):
    """
    Enhanced Super Admin onboarding flow.
    Role-specific credentials delivery and mandatory reset flags.
    """
    admin_user = request.user
    if not admin_user or not admin_user.is_authenticated or admin_user.role not in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR']:
        return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)

    # 1. Extraction
    email       = request.data.get('email', '').strip().lower()
    first_name  = request.data.get('first_name', '').strip()
    middle_name = request.data.get('middle_name', '').strip() or None
    last_name   = request.data.get('last_name', '').strip()
    role        = request.data.get('role', '').strip().upper()
    
    # 2. Validation
    if not all([email, first_name, last_name, role]):
        return Response({'error': 'First Name, Last Name, Email, and Role are mandatory.'}, status=status.HTTP_400_BAD_REQUEST)
    
    role = role.lower()
    if role not in [r[0] for r in User.ROLE_CHOICES]:
        return Response({'error': f'Invalid role. Allowed: {", ".join([r[1] for r in User.ROLE_CHOICES])}'}, status=status.HTTP_400_BAD_REQUEST)

    # 3. RBAC Permission Check
    if not check_permission(admin_user, role):
        return Response({'error': 'You do not have permission to create this type of account.'}, status=status.HTTP_403_FORBIDDEN)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_409_CONFLICT)

    # 3. Generation
    username = generate_unique_username(first_name, last_name)
    temp_password = generate_secure_password(14)
    
    # 4. Atomic Creation
    try:
        # Rule 1.1: HOW AFFILIATION IS DETERMINED
        affiliation = 'musb' # Default
        status_val = 'active' # Default
        
        # Onsite PI adds team members -> inherit onsite, set pending
        if admin_user.role == 'pi' and admin_user.affiliation == 'onsite':
            affiliation = 'onsite'
            status_val = 'pending'
            
        # Explicit override for onsite PIs if flag provided (e.g., from study assignment flow)
        elif request.data.get('is_onsite_hire'):
             affiliation = 'onsite'
             # If created by Super Admin/Admin, maybe it doesn't need approval? 
             # Rule: "Onsite PI team member requests ALWAYS go through Super Admin approval"
             # Rule 6 suggests only TM created by Onsite PI needs approval.
             if role == 'team_member':
                 status_val = 'pending'

        new_user = User.objects.create_user(
            email=email,
            password=temp_password,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            role=role,
            affiliation=affiliation,
            status=status_val,
            username=username,
            must_change_password=True,
            profile_completed=False,
            created_by=admin_user
        )
        
        # 4.1 Approval Request for Onsite Team Members
        if status_val == 'pending':
            from ..models import ApprovalRequest
            ApprovalRequest.objects.create(
                requested_by=admin_user,
                target_user=new_user,
                status='pending'
            )
        
        # 5. Email Delivery Logic
        subject_map = {
            'PI': 'Your PI Coordinator Account Has Been Created',
            'COORDINATOR': 'Your PI Coordinator Account Has Been Created',
            'SPONSOR': 'Welcome — Your Sponsor Account Is Ready',
            'SUPER_ADMIN': 'Super Admin Access Granted — Action Required',
        }
        
        subject = subject_map.get(role, 'Account Created — MusB Research')
        login_url = f"{settings.CORS_ALLOWED_ORIGINS[0]}/signin" if settings.CORS_ALLOWED_ORIGINS else "https://musbhealth.com/signin"
        
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Welcome to MusB Research</h2>
            <p>Hello <strong>{first_name} {last_name}</strong>,</p>
            <p>Your professional account has been provisioned on the MusB Research Platform.</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Credentials</p>
                <p style="font-size: 18px; margin: 10px 0;"><strong>Username:</strong> {username}</p>
                <p style="font-size: 18px; margin: 10px 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #eee; padding: 2px 6px;">{temp_password}</span></p>
            </div>
            
            <p style="color: #ef4444; font-weight: bold;">SECURITY NOTICE:</p>
            <ul>
                <li>This password is temporary. You <strong>must</strong> reset it immediately on your first login.</li>
                <li>This temporary access expires in 48 hours.</li>
                <li>Do not share these credentials with anyone.</li>
            </ul>
            
            <a href="{login_url}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Access Secure Terminal</a>
            
            <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">If you did not expect this email, please ignore or contact support.</p>
        </div>
        """
        
        email_sent = send_resend_email(email, subject, html_content)
        
        if email_sent:
            new_user.temp_password_sent = True
            new_user.save(update_fields=['temp_password_sent'])
            logger.info(f"Onboarding email sent to {email}")
        else:
            logger.warning(f"Email delivery failed for {email} (User ID: {new_user.id})")
            # We keep the account as per rule 1 (rollback is secondary option), 
            # so the admin can "Resend" from dashboard.
            
        AuditLog.log(
            action='ACCOUNT_CREATED',
            user_email=admin_user.email,
            request=request,
            detail=f'Created {role} account for {email}. Email sent: {email_sent}'
        )
        
        return Response({
            'message': 'User created successfully.',
            'username': username,
            'email_sent': email_sent,
            'user_id': str(new_user.id)
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Failed to onboarding user {email}: {str(e)}")
        return Response({'error': f'Finalization failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def admin_resend_credentials(request, user_id):
    """Endpoint to manual trigger credential resend/regeneration."""
    admin_user = request.user
    if not admin_user or not admin_user.is_authenticated or admin_user.role not in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR']:
        return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        target_user = User.objects.get(id=user_id)
        
        # Only allow resend if they haven't changed password yet
        if not target_user.must_change_password:
            return Response({'error': 'User has already secured their account. Password cannot be reset this way.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Permission Restriction: PI/Coordinator can ONLY resend for Sponsors
        if admin_user.role in ['PI', 'COORDINATOR'] and target_user.role != 'SPONSOR':
            return Response({'error': 'You only have the authority to manage Sponsor credentials.'}, status=status.HTTP_403_FORBIDDEN)
            
        new_temp_password = generate_secure_password(14)
        target_user.set_password(new_temp_password)
        target_user.save()
        
        # Reuse email logic
        subject = "Updated Credentials — MusB Research"
        login_url = f"{settings.CORS_ALLOWED_ORIGINS[0]}/signin" if settings.CORS_ALLOWED_ORIGINS else "https://musbhealth.com/signin"
        
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #4f46e5; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Access Reset - MusB Research</h2>
            <p>Hello <strong>{target_user.first_name}</strong>,</p>
            <p>An administrator has re-issued your temporary credentials.</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 18px; margin: 10px 0;"><strong>Username:</strong> {target_user.username}</p>
                <p style="font-size: 18px; margin: 10px 0;"><strong>New Temporary Password:</strong> <span style="font-family: monospace; background: #eee; padding: 2px 6px;">{new_temp_password}</span></p>
            </div>
            
            <a href="{login_url}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Terminal</a>
        </div>
        """
        
        email_sent = send_resend_email(target_user.email, subject, html_content)
        
        AuditLog.log(
            action='CREDENTIALS_REISSUED',
            user_email=admin_user.email,
            request=request,
            detail=f'Reissued credentials for {target_user.email}'
        )
        
        return Response({
            'message': 'Credentials reissued and dispatched.',
            'email_sent': email_sent
        })
        
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def admin_get_audit_logs(request):
    """Retrieves all platform audit logs for Super Admin dashboard."""
    admin_user = request.user
    if not admin_user or not admin_user.is_authenticated or admin_user.role not in ['SUPER_ADMIN', 'ADMIN']:
        return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)

    logs = AuditLog.objects.all()[:100] # Limit to 100 for dashboard performance
    data = []
    
    # Map backend AuditLog model to frontend Activity interface
    for log in logs:
        # Determine category based on action
        category = 'System:Auth'
        if 'ROLE' in log.action or 'ACCOUNT' in log.action:
            category = 'User:Mgmt'
        elif 'CONFIG' in log.action or 'STUDY' in log.action:
            category = 'Project:Data'
            
        data.append({
            'id': f'log-{log.id}',
            'timestamp': log.timestamp.strftime('%d/%m/%Y %H:%M:%S'),
            'type': log.action,
            'category': category,
            'user': log.user_email or 'Anonymous',
            'details': log.detail or 'Platform operation successful',
            'ip': log.ip_address or 'Unknown',
            'severity': 'danger' if 'FAILED' in log.action or 'LIMITED' in log.action else 
                        ('warning' if 'RESET' in log.action or 'REISSUED' in log.action else 'info')
        })
    return Response(data)

@api_view(['GET'])
def get_pending_approvals(request):
    """List team member requests for Super Admin with status filtering"""
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    status_filter = request.query_params.get('status', 'pending').lower()
    
    from ..models import ApprovalRequest
    requests = ApprovalRequest.objects.filter(status=status_filter).select_related('target_user', 'requested_by')
    
    data = []
    for req in requests:
        data.append({
            'id': str(req.id),
            'target_name': req.target_user.decrypted_name,
            'target_email': req.target_user.email,
            'requested_by': req.requested_by.decrypted_name or req.requested_by.email,
            'created_at': req.created_at,
            'reviewed_by': req.reviewed_by.email if req.reviewed_by else None,
            'reviewed_at': req.reviewed_at,
            'status': req.status,
            'studies': [s.protocol_id for s in req.target_user.pi_studies.all()] # Adjusting to target user's relation
        })
    return Response(data)

@api_view(['POST'])
def process_approval(request, request_id, action):
    """Approve or Reject a pending team member"""
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    from ..models import ApprovalRequest
    try:
        app_req = ApprovalRequest.objects.get(id=request_id)
        if action == 'approve':
            app_req.status = 'approved'
            app_req.target_user.status = 'active'
        else:
            app_req.status = 'rejected'
            app_req.target_user.status = 'rejected'
            
        app_req.target_user.save()
        app_req.reviewed_by = request.user
        app_req.reviewed_at = now()
        app_req.save()
        
        AuditLog.log(
            action='ACCOUNT_UPDATED',
            user_email=request.user.email,
            request=request,
            detail=f'{"Approved" if action == "approve" else "Rejected"} team member {app_req.target_user.email}'
        )
        
        return Response({'message': f'User {action}d successfully'})
    except ApprovalRequest.DoesNotExist:
        return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)
