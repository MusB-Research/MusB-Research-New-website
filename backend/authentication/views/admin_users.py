from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..models import User, AuditLog
import logging

logger = logging.getLogger(__name__)

ALLOWED_ROLES = ['PARTICIPANT', 'PI', 'COORDINATOR', 'SPONSOR', 'SPONSOR_MANAGER', 'SPONSOR_VIEWER', 'ADMIN', 'SUPER_ADMIN']


@api_view(['POST'])
def admin_create_user(request):
    """
    Super Admin only endpoint to directly create a user with a hashed password
    in the database. No email verification required — user can login immediately.
    """
    # ── 1. Authenticate via cookie or bearer token ──────────────────────────
    requesting_user = request.user
    if not requesting_user or not requesting_user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    # ── 2. Restrict to SUPER_ADMIN and ADMIN only ──────────────────────────
    if requesting_user.role not in ['SUPER_ADMIN', 'ADMIN']:
        return Response({'error': 'Only Super Admins can create users directly.'}, status=status.HTTP_403_FORBIDDEN)

    # ── 3. Validate required fields ────────────────────────────────────────
    email    = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '').strip()
    full_name = request.data.get('full_name', '').strip()
    role     = request.data.get('role', 'PARTICIPANT').strip()

    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not password:
        return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not full_name:
        return Response({'error': 'Full name is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if role not in ALLOWED_ROLES:
        return Response({'error': f'Invalid role. Choose from: {", ".join(ALLOWED_ROLES)}'}, status=status.HTTP_400_BAD_REQUEST)

    # ── 4. Check email uniqueness ──────────────────────────────────────────
    if User.objects.filter(email=email).exists():
        return Response({'error': f'A user with email "{email}" already exists.'}, status=status.HTTP_409_CONFLICT)

    # ── 5. Create user directly in DB with hashed password ────────────────
    try:
        new_user = User.objects.create_user(
            email=email,
            password=password,      # create_user() calls set_password() → properly hashed
            full_name=full_name,
            role=role,
            is_active=True,          # Active immediately — no verification needed
        )
        logger.info(f'Admin ({requesting_user.email}) created user: {new_user.email} ({new_user.role})')
        AuditLog.log(
            action='USER_CREATED',
            user_email=requesting_user.email,
            request=request,
            detail=f'Created user {new_user.email} with role {new_user.role}'
        )
    except Exception as e:
        logger.error(f'Error creating user: {e}')
        return Response({'error': f'Failed to create user: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── 6. Return success ──────────────────────────────────────────────────
    return Response({
        'message': f'User "{email}" created successfully. They can now log in immediately with the provided credentials.',
        'user': {
            'id': str(new_user.id),
            'email': new_user.email,
            'full_name': new_user.decrypted_name,
            'role': new_user.role,
            'is_active': new_user.is_active,
        }
    }, status=status.HTTP_201_CREATED)
