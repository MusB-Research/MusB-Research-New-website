from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    Study, StudyAssignment, Participant, Form, FormResponse, Task, 
    ParticipantTask, Consent, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog, News, Event
)
from .serializers import (
    StudySerializer, StudyAssignmentSerializer, ParticipantSerializer, 
    DeIdentifiedParticipantSerializer, UserSerializer, FormSerializer, 
    FormResponseSerializer, TaskSerializer, ParticipantTaskSerializer, 
    ConsentSerializer, LeadSerializer, CommunicationLogSerializer,
    CompensationSerializer, LabResultSerializer, DataAuditLogSerializer,
    NewsSerializer, EventSerializer
)
from authentication.models import User, AuditLog

from django.db.models import Q

class IsAdminOrCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']

class WorkflowContentMixin:
    """Mixin to handle role-based workflow logic for content creation and status."""
    
    def get_queryset(self):
        user = self.request.user
        # Allow filtering by status via query params if admin
        status_filter = self.request.query_params.get('workflow_status')
        
        # Determine which status field to use
        is_study = hasattr(self.get_serializer_class().Meta.model, 'approval_status')
        status_field = 'approval_status' if is_study else 'status'

        if not user.is_authenticated:
            # Public only sees approved content
            return self.queryset.filter(**{status_field: 'approved'})
            
        if user.role in ['SUPER_ADMIN', 'ADMIN']:
            qs = self.queryset.all()
            if status_filter:
                qs = qs.filter(**{status_field: status_filter})
            return qs

        # Other authenticated users see approved + their own pending/rejected
        from django.db.models import Q
        return self.queryset.filter(Q(**{status_field: 'approved'}) | Q(created_by=user))

    def perform_create(self, serializer):
        user = self.request.user
        model_class = serializer.Meta.model
        is_study = hasattr(model_class, 'approval_status')
        status_field = 'approval_status' if is_study else 'status'
        
        # Determine status based on role
        status_val = 'approved' if user.role in ['SUPER_ADMIN', 'ADMIN'] else 'pending'
        
        # Save with user and status
        serializer.save(created_by=user, **{status_field: status_val})

    def perform_update(self, serializer):
        user = self.request.user
        is_study = hasattr(serializer.Meta.model, 'approval_status')
        status_field = 'approval_status' if is_study else 'status'

        if user.role not in ['SUPER_ADMIN', 'ADMIN']:
            serializer.save(**{status_field: 'pending'})
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object()
        if hasattr(obj, 'approval_status'):
            obj.approval_status = 'approved'
        else:
            obj.status = 'approved'
        obj.save()
        return Response({'status': 'content approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object()
        if hasattr(obj, 'approval_status'):
            obj.approval_status = 'rejected'
        else:
            obj.status = 'rejected'
        obj.save()
        return Response({'status': 'content rejected'})

class StudyViewSet(WorkflowContentMixin, viewsets.ModelViewSet):
    queryset = Study.objects.all()
    serializer_class = StudySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'protocol_id'

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Study.objects.filter(status__in=['RECRUITING', 'UPCOMING'], approval_status='approved')
            
        if user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Study.objects.all()
        
        # Sponsors, Coordinators, and PIs only see assigned studies
        from django.db.models import Q
        return Study.objects.filter(
            Q(assignments__user=user) | 
            Q(pi=user) | 
            Q(coordinator=user) | 
            Q(sponsor=user)
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        pi_ids = serializer.validated_data.pop('pi_ids', [])
        coord_ids = serializer.validated_data.pop('coordinator_ids', [])
        
        # PIs and Coordinators are trusted internal staff; auto-approve their studies
        approval_status = 'approved' if user.role in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR'] else 'pending'
        
        if user.role == 'SPONSOR':
            study = serializer.save(status='PAUSED', created_by=user, approval_status=approval_status)
            StudyAssignment.objects.get_or_create(study=study, user=user, role='SPONSOR_ADMIN')
        else:
            study = serializer.save(created_by=user, approval_status=approval_status)
            
        self._sync_assignments(study, pi_ids, coord_ids)
        
        # Log the activity
        AuditLog.log('UPDATE_STUDY', user_email=user.email, request=self.request, detail=f"Created study {study.title}")
        
        # Ensure creator has assignment
        if user.role in ['PI', 'COORDINATOR']:
            StudyAssignment.objects.get_or_create(study=study, user=user, role=user.role)

    def perform_update(self, serializer):
        user = self.request.user
        pi_ids = serializer.validated_data.pop('pi_ids', [])
        coord_ids = serializer.validated_data.pop('coordinator_ids', [])
        
        # If internal staff is updating, ensure it's approved (especially if it was pending)
        extra_fields = {}
        if user.role in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR']:
            extra_fields['approval_status'] = 'approved'

        study = serializer.save(**extra_fields)
        
        self._sync_assignments(study, pi_ids, coord_ids)

        # Log the activity
        AuditLog.log('UPDATE_STUDY', user_email=user.email, request=self.request, detail=f"Modified study {study.title}")

    def _sync_assignments(self, study, pi_ids, coord_ids):
        # Sync PIs
        if pi_ids is not None:
            # Remove PIs not in the list
            study.assignments.filter(role='PI').exclude(user__in=pi_ids).delete()
            # Add new ones
            for pi_user in pi_ids:
                StudyAssignment.objects.get_or_create(study=study, user=pi_user, role='PI')
        
        # Sync Coordinators
        if coord_ids is not None:
            study.assignments.filter(role='COORDINATOR').exclude(user__in=coord_ids).delete()
            for coord_user in coord_ids:
                StudyAssignment.objects.get_or_create(study=study, user=coord_user, role='COORDINATOR')

        # Sync Legacy Single Fields for backward compatibility
        if pi_ids:
            study.pi = pi_ids[0]
        if coord_ids:
            study.coordinator = coord_ids[0]
        
        # Sync Sponsor if updated
        if study.sponsor:
            StudyAssignment.objects.get_or_create(study=study, user=study.sponsor, role='SPONSOR_ADMIN')
            
        study.save()

class PublicStudyViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only view for the frontend website"""
    queryset = Study.objects.all()
    serializer_class = StudySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Public only sees approved studies that are recruiting or upcoming
        return Study.objects.filter(approval_status='approved', status__in=['RECRUITING', 'UPCOMING'])

class SponsorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role='SPONSOR')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def team(self, request, pk=None):
        sponsor = self.get_object()
        # In a real app, 'teams' might be the same company users
        # For simplicity, we filter by company/country or a specific team model
        # Let's assume sponsors share a "company" or specific filter
        team_members = User.objects.filter(role='SPONSOR') # Placeholder for team logic
        serializer = UserSerializer(team_members, many=True)
        return Response(serializer.data)


class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.role == 'SPONSOR':
            return DeIdentifiedParticipantSerializer
        return ParticipantSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Participant.objects.all()
        # Sponsors, PIs, and Coordinators only see their study's participants
        return Participant.objects.filter(study__assignments__user=user)

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAdminOrCoordinator]

    def get_queryset(self):
        if self.request.user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Lead.objects.all()
        return Lead.objects.filter(study__assignments__user=self.request.user)

class CommunicationLogViewSet(viewsets.ModelViewSet):
    queryset = CommunicationLog.objects.all()
    serializer_class = CommunicationLogSerializer
    permission_classes = [IsAdminOrCoordinator]

class CompensationViewSet(viewsets.ModelViewSet):
    queryset = Compensation.objects.all()
    serializer_class = CompensationSerializer
    permission_classes = [IsAdminOrCoordinator]

class LabResultViewSet(viewsets.ModelViewSet):
    queryset = LabResult.objects.all()
    serializer_class = LabResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPER_ADMIN']:
            return LabResult.objects.all()
        if user.role == 'SPONSOR':
            # Sponsors see all labs for their studies but de-identified (handled by Participant filter)
            return LabResult.objects.filter(participant__study__assignments__user=user)
        return LabResult.objects.filter(participant__study__assignments__user=user)

class DataAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DataAuditLog.objects.all()
    serializer_class = DataAuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only SuperAdmin can see global audit, PIs see their study audit
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            return DataAuditLog.objects.all()
        # Placeholder for study-specific filtering
        return DataAuditLog.objects.none()

class ConsentViewSet(viewsets.ModelViewSet):
    queryset = Consent.objects.all()
    serializer_class = ConsentSerializer
    permission_classes = [permissions.AllowAny]

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Form.objects.all()
        study_id = self.request.query_params.get('study_id')
        if study_id:
            queryset = queryset.filter(study_id=study_id)
        return queryset

    def perform_create(self, serializer):
        form = serializer.save()
        AuditLog.log('UPDATE_STUDY', user_email=self.request.user.email, request=self.request, detail=f"Pushed screener for study ID {form.study_id}")

    def perform_update(self, serializer):
        form = serializer.save()
        AuditLog.log('UPDATE_STUDY', user_email=self.request.user.email, request=self.request, detail=f"Updated screener for study ID {form.study_id}")

class FormResponseViewSet(viewsets.ModelViewSet):
    queryset = FormResponse.objects.all()
    serializer_class = FormResponseSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        study_id = self.request.query_params.get('study_id')
        if study_id:
            return Task.objects.filter(study_id=study_id)
        return Task.objects.all()

class ParticipantTaskViewSet(viewsets.ModelViewSet):
    queryset = ParticipantTask.objects.all()
    serializer_class = ParticipantTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ParticipantTask.objects.none()
        if user.role in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']:
            return ParticipantTask.objects.all()
        return ParticipantTask.objects.filter(participant__user=user)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'create', 'retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrCoordinator()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPER_ADMIN']:
            return User.objects.all()
        return User.objects.filter(id=user.id)




class NewsViewSet(WorkflowContentMixin, viewsets.ModelViewSet):
    queryset = News.objects.all().order_by('-created_at')
    serializer_class = NewsSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def success_stories(self, request):
        qs = self.queryset.filter(status='approved', is_success_story=True)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

class EventViewSet(WorkflowContentMixin, viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-event_date')
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
