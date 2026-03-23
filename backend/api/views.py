from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    Study, StudyAssignment, Participant, Form, FormResponse, Task, 
    ParticipantTask, Consent, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog,
    News, Event, FacilityInquiry, Candidate, NewsletterSubscriber, 
    BookletDownloadRequest
)
from .serializers import (
    StudySerializer, StudyAssignmentSerializer, ParticipantSerializer, 
    DeIdentifiedParticipantSerializer, UserSerializer, FormSerializer, 
    FormResponseSerializer, TaskSerializer, ParticipantTaskSerializer, 
    ConsentSerializer, LeadSerializer, CommunicationLogSerializer,
    CompensationSerializer, LabResultSerializer, DataAuditLogSerializer,
    NewsSerializer, EventSerializer, FacilityInquirySerializer, CandidateSerializer,
    NewsletterSubscriberSerializer, BookletDownloadRequestSerializer
)
from authentication.models import User

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
        is_study = hasattr(serializer.Meta.model, 'approval_status')
        status_field = 'approval_status' if is_study else 'status'
        
        status_val = 'approved' if user.role in ['SUPER_ADMIN', 'ADMIN'] else 'pending'
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
            return Study.objects.filter(status__in=['RECRUITING', 'ACTIVE'], approval_status='approved').order_by('-created_at')
            
        if user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Study.objects.all().order_by('-created_at')
        
        # Sponsors, Coordinators, and PIs only see assigned studies
        return Study.objects.filter(assignments__user=user).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        approval_status = 'approved' if user.role in ['SUPER_ADMIN', 'ADMIN'] else 'pending'
        
        # If user is a sponsor, set initial status to PROPOSAL_SUBMITTED
        if user.role == 'SPONSOR':
            study = serializer.save(status='PAUSED', created_by=user, approval_status=approval_status)
            StudyAssignment.objects.create(study=study, user=user, role='SPONSOR_ADMIN')
        else:
            study = serializer.save(created_by=user, approval_status=approval_status)
            
            # Create assignments for medical team if provided
            if study.pi:
                StudyAssignment.objects.get_or_create(study=study, user=study.pi, role='PI')
            if study.coordinator:
                StudyAssignment.objects.get_or_create(study=study, user=study.coordinator, role='COORDINATOR')
            
            # Ensure the creator from the staff also has an assignment if they are PI/Coordinator
            if user.role in ['PI', 'COORDINATOR']:
                StudyAssignment.objects.get_or_create(study=study, user=user, role=user.role)

class PublicStudyViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only view for the frontend website"""
    queryset = Study.objects.all()
    serializer_class = StudySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Public only sees approved studies that are recruiting or active
        return Study.objects.filter(approval_status='approved', status__in=['RECRUITING', 'ACTIVE']).order_by('-created_at')

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

class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all()
    serializer_class = NewsSerializer
    permission_classes = [permissions.AllowAny]

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]

from rest_framework.views import APIView

class FacilityInquiryView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = FacilityInquirySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CandidateApplyView(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def apply(self, request):
        serializer = CandidateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "message": "Application submitted successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SubscribeNewsletterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        user_type = request.data.get('userType', 'BUSINESS') # frontend sends userType
        
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={'user_type': user_type.upper(), 'is_subscribed': True}
        )
        
        if not created:
            subscriber.user_type = user_type.upper()
            subscriber.is_subscribed = True
            subscriber.save()
        else:
            from api.utils.resend_utils import send_welcome_email
            send_welcome_email(email)
            
        serializer = NewsletterSubscriberSerializer(subscriber)
        return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

class BookletDownloadRequestCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = BookletDownloadRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "message": "Download request logged."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
