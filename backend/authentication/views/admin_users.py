from django.db import models, transaction
from django.db.models import Q
from bson import ObjectId
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status, permissions, parsers
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils.timezone import now
from django.utils.crypto import get_random_string
from django.conf import settings
import random
import string
import secrets
import logging
from ..models import User, AuditLog, MagicLink
from ..utils import send_mail_premium, generate_token
from api.views import IsAdminOrCoordinator

def to_bool(val):
    """Converts truthy strings/values to boolean."""
    if isinstance(val, bool): return val
    if isinstance(val, str):
        return val.lower() in ('true', '1', 'yes', 'on')
    return bool(val)

logger = logging.getLogger(__name__)

ALLOWED_ROLES = ['super_admin', 'admin', 'sponsor', 'coordinator', 'pi', 'team_member', 'PARTICIPANT']

def check_permission(creator, target_role):
    """Enforce RBAC rules for user creation (Section 1.4)"""
    c_role = (creator.role or '').lower()
    c_aff  = (creator.affiliation or '').lower()
    t_role = (target_role or '').lower()

    # Super Admin bypass — always allowed regardless of status
    if c_role == "super_admin":
        return True

    # All other roles must be ACTIVE
    if (creator.status or '').upper() != "ACTIVE":
        return False

    if c_role == "admin":
        return t_role in ["admin", "sponsor", "coordinator", "pi", "participant"]
    
    if c_role == "coordinator" and c_aff == "musb":
        return t_role in ["sponsor", "pi", "coordinator", "participant"]
    
    if c_role == "pi" and c_aff == "musb":
        return t_role in ["sponsor", "coordinator", "participant"]
    
    if c_role == "pi" and c_aff == "onsite":
        return t_role in ["team_member", "participant"]

    if c_role == "sponsor":
        return t_role in ["pi", "coordinator", "sponsor", "team_member"]

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
@parser_classes([MultiPartParser, FormParser])
def admin_create_user(request):
    """
    Enhanced Super Admin onboarding flow.
    Role-specific credentials delivery and mandatory reset flags.
    """
    try:
        admin_user = request.user
        if not admin_user or not admin_user.is_authenticated or (getattr(admin_user, 'role', '') or '').upper() not in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR', 'SPONSOR']:
            return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)

        # 1. Extraction
        email       = (request.data.get('email') or '').strip().lower()
        first_name  = (request.data.get('first_name') or '').strip()
        middle_name = (request.data.get('middle_name') or '').strip() or None
        last_name   = (request.data.get('last_name') or '').strip()
        role_input  = (request.data.get('role') or '').strip()
        lat         = request.data.get('lat')
        lng         = request.data.get('lng')
        
        # Safely convert lat/lng to float
        try:
            lat = float(lat) if lat and str(lat).strip() else None
        except (ValueError, TypeError):
            lat = None
        try:
            lng = float(lng) if lng and str(lng).strip() else None
        except (ValueError, TypeError):
            lng = None
            
        is_mellow   = to_bool(request.data.get('is_mellow_member', False))
        org         = (request.data.get('organization') or '').strip() or None
        bio         = (request.data.get('bio') or '').strip() or None
        pronouns    = (request.data.get('pronouns') or '').strip() or None
        linkedin_url = (request.data.get('linkedin_url') or '').strip() or None
        institute_url = (request.data.get('institute_url') or '').strip() or None
        qualifications = (request.data.get('qualifications') or '').strip() or None
        profile_image = request.FILES.get('profile_image')
        cv_file     = request.FILES.get('cv_file')
        
        logger.info(f"Onboarding request for {email} (Role: {role_input}) by {admin_user.email}")

        # 2. Validation
        if not all([email, first_name, last_name, role_input]):
            missing = [f for f in ['email', 'first_name', 'last_name', 'role'] if not (request.data.get(f) or '').strip()]
            err_msg = f"Missing mandatory fields: {', '.join(missing)}"
            logger.warning(f"Validation failed for user creation by {admin_user.email}. {err_msg}")
            return Response({'error': 'First Name, Last Name, Email, and Role are mandatory.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find matching role in choices regardless of case
        role = None
        role_choices_keys = [r[0].lower() for r in User.ROLE_CHOICES]
        if role_input.lower() in role_choices_keys:
            role = [r[0] for r in User.ROLE_CHOICES if r[0].lower() == role_input.lower()][0]
        
        if not role:
            logger.warning(f"Invalid role requested: {role_input} by {admin_user.email}")
            return Response({'error': f'Invalid role. Allowed: {", ".join([r[1] for r in User.ROLE_CHOICES])}'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. RBAC Permission Check
        if not check_permission(admin_user, role):
            return Response({'error': 'You do not have permission to create this type of account.'}, status=status.HTTP_403_FORBIDDEN)

        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            # If user is already registered, check if we can just re-invite them
            if (existing_user.status or '').upper() == 'PENDING':
                return Response({
                    'message': 'This user already has a pending invitation. You can resend their credentials from the dashboard.',
                    'username': existing_user.username,
                    'user_id': str(existing_user.id),
                    'id': str(existing_user.id),
                    'email': existing_user.email,
                    'status': 'PENDING'
                }, status=status.HTTP_200_OK)

            return Response({
                'error': 'This email is already registered on the platform.',
                'existing_user': {
                    'name': f"{existing_user.first_name} {existing_user.last_name}",
                    'email': existing_user.email,
                    'invited_by': existing_user.invited_by.full_name if existing_user.invited_by else "System/Super Admin",
                    'invited_in_study': existing_user.invited_in_study or "General Platform",
                    'status': existing_user.status
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 4. Affiliation logic
        affiliation = 'MUSB' # Default
        status_val = 'PENDING' # Default for invited users
        
        if (getattr(admin_user, 'role', '') or '').upper() == 'PI' and (getattr(admin_user, 'affiliation', '') or '').upper() == 'ONSITE':
            affiliation = 'ONSITE'
        elif to_bool(request.data.get('is_onsite_hire')):
             affiliation = 'ONSITE'

        # 5. Generation
        username = generate_unique_username(first_name, last_name)
        temp_password = generate_secure_password(14)
        study_id = request.data.get('study_id')
        if study_id and not str(study_id).strip():
            study_id = None
        
        logger.info(f"Starting atomic transaction for user creation: {email}")
        with transaction.atomic():
            # Create Magic Link for Seamless First Login
            invite_token = generate_token()
            MagicLink.objects.create(email=email, token=invite_token)
            logger.info(f"Magic link created for {email}")
            
            # Resolve admin user to ensure it's not a lazy object
            if hasattr(admin_user, '_wrapped'):
                admin_user = admin_user._wrapped
            
            # Atomic Creation
            logger.info(f"Executing create_user for {email}")
            new_user = User.objects.create_user(
                email=email,
                password=temp_password,
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                full_name=f"{first_name} {last_name}".strip(),
                role=role,
                affiliation=affiliation,
                status=status_val,
                username=username,
                must_change_password=True,
                profile_completed=False,
                created_by=admin_user,
                invited_by=admin_user,
                invited_in_study=study_id,
                is_active=True,
                # Consortium Data
                lat=lat,
                lng=lng,
                is_mellow_member=is_mellow,
                organization=org,
                bio=bio,
                pronouns=pronouns,
                linkedin_url=linkedin_url,
                institute_url=institute_url,
                qualifications=qualifications,
                profile_image=profile_image,
                cv_file=cv_file,
                zip_code=request.data.get('zip_code') or None,
                city=request.data.get('city') or None,
                state=request.data.get('state') or None,
                country=request.data.get('country') or None
            )
            logger.info(f"User object created in DB: {new_user.email} (ID: {new_user.id})")
            
            # Approval Request for Onsite Team Members
            if status_val == 'PENDING' and affiliation == 'ONSITE':
                from ..models import ApprovalRequest
                ApprovalRequest.objects.create(
                    requested_by=admin_user,
                    target_user=new_user,
                    status='pending'
                )

        # Determine correct login URL based on role
        frontend_base = getattr(settings, 'FRONTEND_URL', 'https://musbhealth.com')
        if role.lower() == 'super_admin':
            login_url = f"{frontend_base.rstrip('/')}/mainframe/restricted-auth?token={invite_token}"
        else:
            login_url = f"{frontend_base.rstrip('/')}/auth/accept-invitation?token={invite_token}"

        # 6. TRIGGER NOTIFICATIONS
        logger.info(f"Triggering notifications for {email}")
        try:
            from django.apps import apps
            Notification = apps.get_model('api', 'Notification')
            Study = apps.get_model('api', 'Study')
            
            # Notify Super Admins
            super_admins = User.objects.filter(role='SUPER_ADMIN', is_active=True)
            admin_name = getattr(admin_user, 'full_name', None) or getattr(admin_user, 'email', 'An administrator')
            for sa in super_admins:
                Notification.objects.create(
                    user=sa,
                    title="New Personnel Invitation",
                    message=f"{admin_name} has invited {first_name} {last_name} as a {role}.",
                    type='INFO',
                    link='/dashboard/super-admin/all-users'
                )

            # If study context provided, notify PIs and Coordinators of that study
            if study_id:
                target_study = None
                try:
                    target_study = Study.objects.filter(Q(protocol_id=study_id) | Q(id=study_id)).first()
                except Exception as study_err:
                    logger.warning(f"Study lookup failed for ID {study_id}: {study_err}")
                
                if target_study:
                    recipients = set()
                    if target_study.pi: recipients.add(target_study.pi)
                    if target_study.coordinator: recipients.add(target_study.coordinator)
                    
                    if hasattr(target_study, 'assigned_pis'):
                        for p in target_study.assigned_pis.all(): recipients.add(p)
                    if hasattr(target_study, 'assigned_coordinators'):
                        for c in target_study.assigned_coordinators.all(): recipients.add(c)
                    
                    for r in recipients:
                        if r.id != admin_user.id:
                            Notification.objects.create(
                                user=r,
                                title="Study Team Update",
                                message=f"{first_name} {last_name} has been invited to join study {target_study.protocol_id}.",
                                type='SUCCESS',
                                link=f'/dashboard/pi/team'
                            )
        except Exception as notify_err:
            logger.error(f"Notification trigger failed: {str(notify_err)}")

        # 7. Email Delivery Logic
        logger.info(f"Preparing email for {email} (Role: {role})")
        subject_map = {
            'pi': 'Your PI Coordinator Account Has Been Created',
            'coordinator': 'Your PI Coordinator Account Has Been Created',
            'sponsor': 'Welcome — Your Sponsor Account Is Ready',
            'super_admin': 'Super Admin Access Granted — Action Required',
            'admin': 'Admin Account Access Granted — Action Required',
        }
        
        subject = subject_map.get(role.lower(), 'Account Created — MusB Research')
        
        body_content = f"""
        Hello <strong>{first_name}</strong>,<br><br>
        You have been invited by {admin_user.full_name} to join the MusB Research platform as a <strong>{role.upper()}</strong>. 
        Your professional account has been provisioned with the following secure credentials:<br><br>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: monospace;">
            <strong>Username:</strong> {username}<br>
            <strong>Temp Password:</strong> {temp_password}
        </div>
        <br>Log in to the secure terminal and complete your profile setup. You will be required to set a permanent password upon your first entry.
        """
        
        email_sent = send_mail_premium(
            to_email=email,
            subject=subject,
            title='Onboarding Documentation',
            body=body_content,
            button_text='Access Secure Terminal',
            button_url=login_url,
            qr_url=login_url,
            role=role.upper()
        )
        
        if email_sent:
            new_user.temp_password_sent = True
            new_user.save(update_fields=['temp_password_sent'])
            logger.info(f"Onboarding email sent to {email}")
        else:
            logger.warning(f"Email delivery failed for {email} (User ID: {new_user.id})")
            
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
            'user_id': str(new_user.id),
            'id': str(new_user.id),
            'email': new_user.email,
            'first_name': new_user.first_name,
            'last_name': new_user.last_name,
            'role': new_user.role,
            'status': (new_user.status or 'PENDING').upper(),
            'invitation_status': 'Accepted' if (new_user.status or '').upper() == 'ACTIVE' else 'Pending',
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.exception(f"admin_create_user critical failure: {str(e)}")
        
        # PROD DIAGNOSTIC: Ensure CORS is handled even on crash so user can see details
        res = Response({
            'error': f'Finalization failed: {str(e)}',
            'details': error_trace,
            'hint': 'Check if all required fields are provided and server storage is writable.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        res["Access-Control-Allow-Origin"] = "*"
        return res

@api_view(['POST'])
def admin_resend_credentials(request, user_id):
    """Endpoint to manual trigger credential resend/regeneration."""
    admin_user = request.user
    if not admin_user or not admin_user.is_authenticated or (getattr(admin_user, 'role', '') or '').upper() not in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR']:
        return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        target_user = User.objects.get(id=user_id)
        
        # Only allow resend if they haven't changed password yet
        if not target_user.must_change_password:
            return Response({'error': 'User has already secured their account. Password cannot be reset this way.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Permission Restriction: PI/Coordinator can ONLY resend for Sponsors
        if (getattr(admin_user, 'role', '') or '').upper() in ['PI', 'COORDINATOR'] and (getattr(target_user, 'role', '') or '').lower() != 'sponsor':
            return Response({'error': 'You only have the authority to manage Sponsor credentials.'}, status=status.HTTP_403_FORBIDDEN)
            
        new_temp_password = generate_secure_password(14)
        target_user.set_password(new_temp_password)
        target_user.save()
        
        # Reuse email logic
        subject = "Updated Credentials — MusB Research"
        # Determine correct login URL based on role (Section 2.1)
        frontend_base = getattr(settings, 'FRONTEND_URL', 'https://musbhealth.com')
        
        if target_user.role.lower() == 'super_admin':
            login_url = f"{frontend_base.rstrip('/')}/mainframe/restricted-auth"
        else:
            login_url = f"{frontend_base.rstrip('/')}/signin"
        
        from ..utils import send_mail_premium
        email_sent = send_mail_premium(
            to_email=target_user.email,
            subject=subject,
            title='Identity Credentials Reissued',
            body=f"Hello <strong>{target_user.first_name}</strong>,<br><br>An administrator has re-issued your temporary access credentials for the <strong>{target_user.role.upper()}</strong> platform.<br><br><div style='background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: monospace;'><strong>Username:</strong> {target_user.username}<br><strong>New Temp Password:</strong> {new_temp_password}</div><br>Please log in immediately to secure your account.",
            button_text='Access Secure Terminal',
            button_url=login_url,
            qr_url=login_url,
            role=target_user.role.upper()
        )
        
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
        res = Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        res["Access-Control-Allow-Origin"] = "*"
        return res

@api_view(['GET'])
def admin_get_audit_logs(request):
    """Retrieves all platform audit logs for Super Admin dashboard."""
    admin_user = request.user
    if not admin_user or not admin_user.is_authenticated or (getattr(admin_user, 'role', '') or '').upper() not in ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'PI']:
        return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)

    # Cache for 60 seconds — audit logs are append-only so brief caching is safe
    from django.core.cache import cache
    cache_key = f'audit_logs_{admin_user.role}'
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    logs = AuditLog.objects.all().order_by('-timestamp')[:100]
    data = []

    for log in logs:
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

    cache.set(cache_key, data, timeout=60)
    return Response(data)

@api_view(['GET'])
def get_pending_approvals(request):
    """List team member requests for Super Admin with status filtering"""
    if request.user.role.lower() != 'super_admin':
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
    if request.user.role.lower() != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    from ..models import ApprovalRequest
    try:
        app_req = ApprovalRequest.objects.get(id=request_id)
        if action == 'approve':
            app_req.status = 'approved'
            app_req.target_user.status = 'ACTIVE'
        else:
            app_req.status = 'rejected'
            app_req.target_user.status = 'REJECTED'
            
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
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminOrCoordinator])
def admin_get_analytics_stats(request):
    """
    Super Admin / Admin aggregated analytics.
    Returns:
    - User segmentation (Role, Country, Status)
    - Study segmentation
    - Activity trends from AuditLog
    """
    from ..models import User, AuditLog
    from api.models import Study, Participant
    from django.db.models import Count
    
    # 1. User Summary
    total_users = User.objects.count()
    users_by_role = list(User.objects.values('role').annotate(count=Count('role')))
    
    # 2. Location Distribution (from User.country)
    # Filter out empty strings/None
    locations = list(User.objects.exclude(country__in=[None, '']).values('country').annotate(count=Count('country')).order_by('-count')[:8])
    
    # 3. Content Stats
    total_studies = Study.objects.count()
    total_participants = Participant.objects.count()
    
    # 4. Recent Activity (Audit Logs)
    # We use these to simulate "Traffic Trends" / "News"
    recent_audit = list(AuditLog.objects.order_by('-timestamp').values('action', 'timestamp')[:50])

    # 5. Study Distribution by status
    studies_by_status = list(Study.objects.values('status').annotate(count=Count('status')))

    return Response({
        'summary': {
            'total_users': total_users,
            'total_studies': total_studies,
            'total_participants': total_participants,
            'online_now': int(total_users * 0.1) + 1, # Placeholder for REAL real-time
        },
        'user_distribution': users_by_role,
        'location_distribution': locations,
        'recent_activity': recent_audit,
        'study_distribution': studies_by_status
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminOrCoordinator])
def admin_list_users(request):
    """
    List users by role for administrative assignment (e.g., Launch Study flow).
    Supports limit and offset for performance.
    """
    role = request.query_params.get('role', '').upper()
    try:
        limit = int(request.query_params.get('limit', 100))
        limit = max(1, min(limit, 1000))
    except (ValueError, TypeError):
        limit = 100

    # Base queryset: Exclude participants from professional team views by default
    # We now INCLUDE pending/unactivated users so they can be assigned to studies immediately after invitation
    users = User.objects.select_related('invited_by').exclude(
        role__in=['PARTICIPANT', 'participant', 'Participant']
    )

    if role:
        users = users.filter(
            Q(role=role.upper()) | 
            Q(role=role.lower()) | 
            Q(role=role.capitalize())
        )
    
    # Apply limit
    users = users.order_by('-date_joined')[:limit]
    
    # Efficient serialization
    data = [{
        'id': str(u.id),
        'first_name': u.first_name,
        'last_name': u.last_name,
        'email': u.email,
        'role': u.role,
        'full_name': u.full_name or f"{u.first_name} {u.last_name}".strip() or u.email,
        'status': (u.status or 'PENDING').upper(),
        'invitation_status': 'Accepted' if (u.status or '').upper() == 'ACTIVE' else 'Pending',
        'date': u.date_joined.strftime('%Y-%m-%d') if u.date_joined else '',
        'invited_by': u.invited_by.full_name if u.invited_by else 'Super Admin',
        'study': u.invited_in_study or 'N/A'
    } for u in users]
    
    return Response(data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_mellow_investigators(request):
    """
    Public view to fetch investigators for the Mellow Consortium map.
    Returns only users flagged with is_mellow_member=True.
    """
    investigators = User.objects.filter(
        is_mellow_member=True, 
        role='PI', 
        is_active=True,
        lat__isnull=False,
        lng__isnull=False
    )
    
    # One pin per investigator - no grouping
    # If two share exact coordinates, offset slightly so pins don't stack
    seen_coords = {}
    sites = []
    
    for u in investigators:
        org_name = u.organization or "Independent Researcher"
        u_lat = float(u.lat or 0.0)
        u_lng = float(u.lng or 0.0)
        
        # Offset duplicate coordinates so pins are visually distinct
        coord_key = f"{u_lat}|{u_lng}"
        if coord_key in seen_coords:
            count = seen_coords[coord_key]
            u_lat += count * 0.5
            u_lng += count * 0.5
            seen_coords[coord_key] = count + 1
        else:
            seen_coords[coord_key] = 1
        
        inv_data = {
            'id': str(u.id),
            'name': u.full_name or f"{u.first_name} {u.last_name}",
            'email': u.email,
            'bio': u.bio or "Clinical Investigator specializing in multi-center research protocols.",
            'profile_picture': u.profile_image.url if u.profile_image else (u.profile_picture or None),
            'qualifications': u.qualifications or "MD, PhD",
            'pronouns': u.pronouns or None,
            'linkedin': u.linkedin_url or None,
            'website': u.institute_url or None,
            'cv_url': u.cv_file.url if u.cv_file else None,
            'is_active': u.is_active
        }
        
        sites.append({
            'id': f"site-{u.id}",
            'name': org_name,
            'country': u.country or "Global",
            'lat': u_lat,
            'lng': u_lng,
            'institutions': [{
                'id': f"inst-{u.id}",
                'name': org_name,
                'investigators': [inv_data]
            }]
        })

    return Response(sites)
