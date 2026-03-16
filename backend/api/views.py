from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    Study, StudyAssignment, Participant, Form, FormResponse, Task, 
    ParticipantTask, Consent, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog
)
from .serializers import (
    StudySerializer, StudyAssignmentSerializer, ParticipantSerializer, 
    DeIdentifiedParticipantSerializer, UserSerializer, FormSerializer, 
    FormResponseSerializer, TaskSerializer, ParticipantTaskSerializer, 
    ConsentSerializer, LeadSerializer, CommunicationLogSerializer,
    CompensationSerializer, LabResultSerializer, DataAuditLogSerializer
)
from authentication.models import User

from django.db.models import Q

class IsAdminOrCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']

class StudyViewSet(viewsets.ModelViewSet):
    queryset = Study.objects.all()
    serializer_class = StudySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'protocol_id'

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Study.objects.filter(status__in=['RECRUITING', 'ACTIVE'])
            
        if user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Study.objects.all()
        
        # Sponsors, Coordinators, and PIs only see assigned studies
        return Study.objects.filter(assignments__user=user)

    def perform_create(self, serializer):
        user = self.request.user
        # If user is a sponsor, set initial status to PROPOSAL_SUBMITTED
        if user.role == 'SPONSOR':
            study = serializer.save(status='PROPOSAL_SUBMITTED')
            StudyAssignment.objects.create(study=study, user=user, role='SPONSOR_ADMIN')
        else:
            study = serializer.save()
            role = 'PI' if user.role == 'PI' else 'COORDINATOR' if user.role == 'COORDINATOR' else 'PI'
            StudyAssignment.objects.create(study=study, user=user, role=role)

class PublicStudyViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only view for the frontend website"""
    queryset = Study.objects.filter(status='RECRUITING') # Only show recruiting studies or all? Let's show all and filter on frontend or allow query params. Actually, let's just return all for now or order by created.
    # We will just return all and let the frontend filter.
    queryset = Study.objects.all()
    serializer_class = StudySerializer
    permission_classes = [permissions.AllowAny]

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
