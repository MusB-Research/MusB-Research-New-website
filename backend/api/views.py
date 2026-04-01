from rest_framework import viewsets, permissions, status, parsers, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    Study, StudyAssignment, Participant, Form, FormResponse, Task, 
    ParticipantTask, Consent, ConsentTemplate, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog, InterventionArm,
    News, Event, FacilityInquiry, Candidate, NewsletterSubscriber, 
    BookletDownloadRequest, Partnership, Publication, EducationMaterial,
    StudyInquiry, ClinicalConversation, ClinicalMessage, Kit,
    DosingLog, AEReport
)
from .serializers import (
    StudySerializer, StudyAssignmentSerializer, ParticipantSerializer, 
    DeIdentifiedParticipantSerializer, UserSerializer, FormSerializer, 
    FormResponseSerializer, TaskSerializer, ParticipantTaskSerializer, 
    ConsentSerializer, ConsentTemplateSerializer, LeadSerializer, CommunicationLogSerializer,
    CompensationSerializer, LabResultSerializer, DataAuditLogSerializer,
    NewsSerializer, EventSerializer, FacilityInquirySerializer, CandidateSerializer,
    NewsletterSubscriberSerializer, BookletDownloadRequestSerializer,
    PartnershipSerializer, PublicationSerializer, EducationMaterialSerializer,
    StudyInquirySerializer, InterventionArmSerializer,
    ClinicalConversationSerializer, ClinicalMessageSerializer,
    KitSerializer, DosingLogSerializer, AEReportSerializer
)
from authentication.models import User, AuditLog
from django.db.models import Q
from django.utils.timezone import now
import pytz
from datetime import datetime

class IsAdminOrCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role.upper() in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']

class WorkflowContentMixin:
    """Mixin to handle role-based workflow logic for content creation and status."""
    
    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('workflow_status')
        is_study = hasattr(self.get_serializer_class().Meta.model, 'approval_status')
        status_field = 'approval_status' if is_study else 'status'

        if not user.is_authenticated:
            return self.queryset.filter(**{status_field: 'approved'})
            
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            qs = self.queryset.all()
            if status_filter:
                qs = qs.filter(**{status_field: status_filter})
            return qs

        return self.queryset.filter(Q(**{status_field: 'approved'}) | Q(created_by=user))

    def perform_create(self, serializer):
        user = self.request.user
        model_class = serializer.Meta.model
        is_study = hasattr(model_class, 'approval_status')
        status_field = 'approval_status' if is_study else 'status'
        status_val = 'approved' if user.role.upper() in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR'] else 'pending'
        serializer.save(created_by=user, **{status_field: status_val})

    def perform_update(self, serializer):
        user = self.request.user
        is_study = hasattr(serializer.Meta.model, 'approval_status')
        status_field = 'approval_status' if is_study else 'status'
        if user.role.upper() not in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR']:
            serializer.save(**{status_field: 'pending'})
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role.upper() not in ['SUPER_ADMIN', 'ADMIN']:
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
        if request.user.role.upper() not in ['SUPER_ADMIN', 'ADMIN']:
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

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        # Try finding by protocol_id first
        obj = queryset.filter(protocol_id=lookup_value).first()
        if obj:
            self.check_object_permissions(self.request, obj)
            return obj
            
        # Try finding by hex ID (pk) if the value looks like a MongoDB ObjectId
        import bson
        if bson.ObjectId.is_valid(lookup_value):
            obj = queryset.filter(pk=lookup_value).first()
            if obj:
                self.check_object_permissions(self.request, obj)
                return obj
        
        # Fallback to standard behavior if neither found
        from django.http import Http404
        raise Http404("Study not found with provided ID or Protocol ID.")

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Study.objects.filter(status__in=['RECRUITING', 'ACTIVE'], approval_status='approved').order_by('-created_at')
        
        # Super Admins see all
        if (user.role or '').strip().upper() == 'SUPER_ADMIN':
            return Study.objects.all().order_by('-created_at')
            
        # Admins, PIs, Coordinators, Sponsors see studies they are assigned to
        return Study.objects.filter(
            Q(assignments__user=user) | Q(pi=user) | Q(coordinator=user) | Q(sponsor=user) | Q(created_by=user),
            approval_status='approved'
        ).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        pi_ids = serializer.validated_data.pop('pi_ids', [])
        coord_ids = serializer.validated_data.pop('coordinator_ids', [])
        approval_status = 'approved' if user.role.upper() in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR'] else 'pending'
        
        if user.role.upper() == 'SPONSOR':
            study = serializer.save(status='PAUSED', created_by=user, approval_status=approval_status)
            StudyAssignment.objects.get_or_create(study=study, user=user, role='SPONSOR_ADMIN')
        else:
            study = serializer.save(created_by=user, approval_status=approval_status)
            
        self._sync_assignments(study, pi_ids, coord_ids)
        AuditLog.log('UPDATE_STUDY', user_email=user.email, request=self.request, detail=f"Created study {study.title}")
        if user.role.upper() in ['PI', 'COORDINATOR']:
            StudyAssignment.objects.get_or_create(study=study, user=user, role=user.role)

    def perform_update(self, serializer):
        user = self.request.user
        pi_ids = serializer.validated_data.pop('pi_ids', None)
        coord_ids = serializer.validated_data.pop('coordinator_ids', None)
        extra_fields = {}
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR']:
            extra_fields['approval_status'] = 'approved'
        study = serializer.save(**extra_fields)
        self._sync_assignments(study, pi_ids, coord_ids)
        AuditLog.log('UPDATE_STUDY', user_email=user.email, request=self.request, detail=f"Modified study {study.title}")

    def _sync_assignments(self, study, pi_ids, coord_ids):
        if pi_ids is not None:
            study.assignments.filter(role='PI').exclude(user__in=pi_ids).delete()
            for pi_user in pi_ids:
                StudyAssignment.objects.get_or_create(study=study, user=pi_user, role='PI')
        if coord_ids is not None:
            study.assignments.filter(role='COORDINATOR').exclude(user__in=coord_ids).delete()
            for coord_user in coord_ids:
                StudyAssignment.objects.get_or_create(study=study, user=coord_user, role='COORDINATOR')
        if pi_ids: study.pi = pi_ids[0]
        if coord_ids: study.coordinator = coord_ids[0]
        if study.sponsor:
            StudyAssignment.objects.get_or_create(study=study, user=study.sponsor, role='SPONSOR_ADMIN')
        study.save()

class PublicStudyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Study.objects.all()
    serializer_class = StudySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'protocol_id'

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs[self.lookup_field]
        
        # 1. Try finding by protocol_id
        obj = queryset.filter(protocol_id=lookup_value).first()
        if obj: return obj
            
        # 2. Try finding by hex ID (pk) if the value looks like a MongoDB ObjectId
        import bson
        if bson.ObjectId.is_valid(lookup_value):
            obj = queryset.filter(pk=lookup_value).first()
            if obj: return obj
        
        from django.http import Http404
        raise Http404("Study not found.")

    def get_queryset(self):
        user = self.request.user
        # Admins/Super Admins see everything (needed for building screeners before launch)
        if user.is_authenticated and (user.role or '').strip().upper() in ['ADMIN', 'SUPER_ADMIN']:
            return Study.objects.all().order_by('-created_at')
        return Study.objects.filter(approval_status='approved', status__in=['RECRUITING', 'ACTIVE']).order_by('-created_at')

class SponsorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role='SPONSOR')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    @action(detail=True, methods=['get'])
    def team(self, request, pk=None):
        sponsor = self.get_object()
        team_members = User.objects.filter(role='SPONSOR') 
        serializer = UserSerializer(team_members, many=True)
        return Response(serializer.data)

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    def get_serializer_class(self):
        if self.request.user.role.upper() == 'SPONSOR':
            return DeIdentifiedParticipantSerializer
        return ParticipantSerializer
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Participant.objects.none()
        if user.role.upper() == 'SUPER_ADMIN': return Participant.objects.all()
        return Participant.objects.filter(study__assignments__user=user)

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAdminOrCoordinator]
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Lead.objects.none()
        if user.role.upper() == 'SUPER_ADMIN': return Lead.objects.all()
        return Lead.objects.filter(study__assignments__user=user)

class CommunicationLogViewSet(viewsets.ModelViewSet):
    queryset = CommunicationLog.objects.all()
    serializer_class = CommunicationLogSerializer
    permission_classes = [IsAdminOrCoordinator]
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return CommunicationLog.objects.none()
        return CommunicationLog.objects.filter(participant__study__assignments__user=user)

class CompensationViewSet(viewsets.ModelViewSet):
    queryset = Compensation.objects.all()
    serializer_class = CompensationSerializer
    permission_classes = [IsAdminOrCoordinator]
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Compensation.objects.none()
        return Compensation.objects.filter(participant__study__assignments__user=user)

class LabResultViewSet(viewsets.ModelViewSet):
    queryset = LabResult.objects.all()
    serializer_class = LabResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        return LabResult.objects.filter(participant__study__assignments__user=user)

class DataAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DataAuditLog.objects.all()
    serializer_class = DataAuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN': return DataAuditLog.objects.all()
        return DataAuditLog.objects.none()


class ConsentTemplateViewSet(viewsets.ModelViewSet):
    queryset = ConsentTemplate.objects.all()
    serializer_class = ConsentTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_queryset(self):
        study_id = self.request.query_params.get('study_id')
        if study_id:
            return self.queryset.filter(study_id=study_id)
        return self.queryset.all()

class ConsentViewSet(viewsets.ModelViewSet):
    queryset = Consent.objects.all()
    serializer_class = ConsentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_queryset(self):
        queryset = self.queryset.all()
        study_id = self.request.query_params.get('study_id')
        participant_id = self.request.query_params.get('participant_id')
        if study_id: queryset = queryset.filter(study_id=study_id)
        if participant_id: queryset = queryset.filter(participant_id=participant_id)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify(self, request, pk=None):
        """Seal & Verify action for PI or CC"""
        consent = self.get_object()
        user = request.user
        role = user.role.upper()
        
        if role not in ['PI', 'COORDINATOR', 'ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Only PI or CC can verify consents.'}, status=status.HTTP_403_FORBIDDEN)
            
        now_time = now()
        if role == 'PI' or role in ['ADMIN', 'SUPER_ADMIN']:
            consent.pi_verified = True
            consent.pi_verified_at = now_time
            consent.pi_user = user
            action_label = "PI_VERIFIED"
        else:
            consent.cc_verified = True
            consent.cc_verified_at = now_time
            consent.cc_user = user
            action_label = "CC_VERIFIED"
            
        consent.audit_trail.append({
            "action": action_label,
            "timestamp": now_time.isoformat(),
            "user": user.email
        })
        consent.save()
        
        AuditLog.log('VERIFY_CONSENT', user_email=user.email, request=request, detail=f"Verified consent for {consent.full_name} in study {consent.study.protocol_id}")
        
        return Response(ConsentSerializer(consent).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Mark as invalid"""
        consent = self.get_object()
        consent.is_valid = False
        consent.audit_trail.append({
            "action": "REJECTED",
            "timestamp": now().isoformat(),
            "user": request.user.email,
            "reason": request.data.get('reason', 'Administrative rejection')
        })
        consent.save()
        return Response({'status': 'consent invalidated'})

class DosingLogViewSet(viewsets.ModelViewSet):
    serializer_class = DosingLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN']:
            return DosingLog.objects.all()
        # Participants see their own logs
        if user.role.upper() == 'PARTICIPANT':
            return DosingLog.objects.filter(participant__user=user)
        # Coordinators/PIs see logs for their assigned studies
        return DosingLog.objects.filter(participant__study__assignments__user=user)

    def perform_create(self, serializer):
        participant = Participant.objects.filter(user=self.request.user).first()
        if not participant:
            raise serializers.ValidationError({"participant": "User does not have an active participant record."})
        
        # Check for existing log for this participant and date to avoid 400 error
        date = serializer.validated_data.get('date')
        if date:
            existing = DosingLog.objects.filter(participant=participant, date=date).first()
            if existing:
                # Update existing instance instead of creating new one
                serializer.instance = existing
                serializer.save(participant=participant)
                return

        serializer.save(participant=participant)


class AEReportViewSet(viewsets.ModelViewSet):
    serializer_class = AEReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN']:
            return AEReport.objects.all()
        if user.role.upper() == 'PARTICIPANT':
            return AEReport.objects.filter(participant__user=user)
        return AEReport.objects.filter(participant__study__assignments__user=user)

    def perform_create(self, serializer):
        participant = Participant.objects.filter(user=self.request.user).first()
        if not participant:
            raise serializers.ValidationError({"participant": "User does not have an active participant record."})
        serializer.save(participant=participant)

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    def get_queryset(self):
        queryset = Form.objects.all()
        study_id = self.request.query_params.get('study_id')
        if study_id: queryset = queryset.filter(study_id=study_id)
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
        if self.action == 'create': return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        study_id = self.request.query_params.get('study_id')
        if study_id: return Task.objects.filter(study_id=study_id)
        return Task.objects.all()

class ParticipantTaskViewSet(viewsets.ModelViewSet):
    queryset = ParticipantTask.objects.all()
    serializer_class = ParticipantTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return ParticipantTask.objects.none()
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']: return ParticipantTask.objects.all()
        return ParticipantTask.objects.filter(participant__user=user)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_permissions(self):
        if self.action in ['list', 'create', 'retrieve', 'update', 'partial_update', 'destroy']: return [IsAdminOrCoordinator()]
        return super().get_permissions()
    def get_queryset(self):
        user = self.request.user
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN']: return User.objects.all()
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
        user_type = request.data.get('userType', 'BUSINESS')
        if not email: return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        subscriber, created = NewsletterSubscriber.objects.get_or_create(email=email, defaults={'user_type': user_type.upper(), 'is_subscribed': True})
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

class PartnershipViewSet(WorkflowContentMixin, viewsets.ModelViewSet):
    queryset = Partnership.objects.all().order_by('-created_at')
    serializer_class = PartnershipSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

class PublicationViewSet(WorkflowContentMixin, viewsets.ModelViewSet):
    queryset = Publication.objects.all().order_by('-publication_date')
    serializer_class = PublicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class EducationMaterialViewSet(WorkflowContentMixin, viewsets.ModelViewSet):
    queryset = EducationMaterial.objects.all().order_by('-created_at')
    serializer_class = EducationMaterialSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

class StudyInquiryViewSet(viewsets.ModelViewSet):
    queryset = StudyInquiry.objects.all().order_by('-created_at')
    serializer_class = StudyInquirySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return StudyInquiry.objects.none()
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            return StudyInquiry.objects.all().order_by('-created_at')
        return StudyInquiry.objects.filter(sponsor_user=user).order_by('-created_at')

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)

        user = self.request.user
        inquiry = serializer.save(sponsor_user=user)
        target = "info@musbresearch.com"
        if inquiry.nda_preference == 'YES':
            inquiry.status = 'NDA_REQUESTED'
        else:
            inquiry.status = 'QUALIFIED'
        
        needs = inquiry.needs or []
        intended_target = "sales@musbresearch.com"
        if "Biorepository" in needs: intended_target = "biorepository@musbresearch.com"
        elif "Biomarker / Lab Support" in needs: intended_target = "lab@musbresearch.com"
        
        inquiry.routing_target = intended_target
        inquiry.save()
        
        # SEND EMAIL NOTIFICATION VIA RESEND
        try:
            from .utils.resend_utils import send_inquiry_notification
            notification_data = {
                'product_name': inquiry.product_name,
                'category': inquiry.get_category_display(),
                'development_stage': inquiry.get_development_stage_display(),
                'primary_focus': inquiry.primary_focus,
                'timeline': inquiry.get_timeline_display(),
                'nda_preference': inquiry.nda_preference,
                'legal_name': inquiry.legal_name,
                'signatory_name': inquiry.signatory_name,
                'signatory_title': inquiry.signatory_title,
                'street_address': inquiry.street_address,
                'city': inquiry.city,
                'state': inquiry.state,
                'zip_code': inquiry.zip_code,
                'country': inquiry.country,
                'needs': inquiry.needs,
                'project_description': inquiry.project_description,
                'sponsor_email': user.email,
                'contact_email': inquiry.contact_email,
                'contact_person_name': inquiry.contact_person_name,
                'contact_person_designation': inquiry.contact_person_designation,
                'contact_mobile': inquiry.contact_mobile,
                'has_operational_address': inquiry.has_operational_address,
                'op_street_address': inquiry.op_street_address,
                'op_city': inquiry.op_city,
                'op_state': inquiry.op_state,
                'op_zip_code': inquiry.op_zip_code,
                'op_country': inquiry.op_country,
                'target_population': inquiry.target_population,
                'budget_range': inquiry.get_budget_range_display() if inquiry.budget_range else 'Not Specified',
                'services_needed': inquiry.services_needed,
                'study_type_needed': inquiry.study_type_needed,
                'discovery_call_date': str(inquiry.discovery_call_date) if inquiry.discovery_call_date else None,
                'discovery_call_time': str(inquiry.discovery_call_time) if inquiry.discovery_call_time else None,
                'discovery_call_timezone': inquiry.discovery_call_timezone,
                'est_discovery_call': None
            }

            # Convert to EST if all parts are present
            if inquiry.discovery_call_date and inquiry.discovery_call_time and inquiry.discovery_call_timezone:
                try:
                    local_tz = pytz.timezone(inquiry.discovery_call_timezone)
                    local_dt = local_tz.localize(datetime.combine(inquiry.discovery_call_date, inquiry.discovery_call_time))
                    est_tz = pytz.timezone('US/Eastern')
                    est_dt = local_dt.astimezone(est_tz)
                    notification_data['est_discovery_call'] = est_dt.strftime('%Y-%m-%d %I:%M %p EST')
                except Exception as tz_err:
                    logger.warning(f"Timezone conversion failed: {tz_err}")

            send_inquiry_notification(notification_data, target)

        except Exception as e:
            logger.error(f"Failed to send inquiry notification: {e}")

        try:
            AuditLog.log('STUDY_INQUIRY', user_email=user.email, request=self.request, detail=f"Inquiry for {inquiry.product_name} created. Routed to {target}")
        except Exception as audit_err:
            logger.warning(f"AuditLog failed (non-critical): {audit_err}")

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def engage(self, request, pk=None):
        """
        Engage a lead: 
        1. Marks inquiry as QUALIFIED
        2. Auto-creates a study approved by Super Admin
        3. Assigns the inquiry sponsor as the Study sponsor
        """
        import logging
        logger = logging.getLogger(__name__)
        
        if request.user.role.upper() not in ['SUPER_ADMIN', 'ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            inquiry = self.get_object()
            inquiry.status = 'QUALIFIED'
            inquiry.save()

            if inquiry.sponsor_user:
                # Use a safer protocol ID generation
                iq_id_str = str(inquiry.id)
                pid_suffix = iq_id_str[-4:] if iq_id_str else "0000"
                prod_name = str(inquiry.product_name)
                safe_name = "".join(filter(str.isalnum, prod_name))[:3].upper()
                protocol_suggested = f"MUSB-{safe_name}-{pid_suffix}"
                
                existing_study = Study.objects.filter(protocol_id=protocol_suggested).first()
                
                if not existing_study:
                    study = Study.objects.create(
                        title=f"Clinical Evaluation of {inquiry.product_name}",
                        full_title=inquiry.project_description or f"A comprehensive study for {inquiry.product_name}",
                        description=inquiry.project_description,
                        sponsor_name=inquiry.legal_name or inquiry.product_name,
                        sponsor=inquiry.sponsor_user,
                        status='DRAFT',
                        approval_status='approved',
                        protocol_id=protocol_suggested,
                        primary_indication=inquiry.primary_focus,
                        condition=inquiry.primary_focus,
                        created_by=request.user
                    )
                    
                    StudyAssignment.objects.get_or_create(
                        study=study, 
                        user=inquiry.sponsor_user, 
                        role='SPONSOR_ADMIN'
                    )
                    
                    AuditLog.log('UPDATE_STUDY', user_email=request.user.email, request=request, detail=f"Auto-created study {study.title}")
                    return Response({
                        'status': 'Engagement initialized. Study auto-created.', 
                        'id': study.protocol_id
                    }, status=status.HTTP_201_CREATED)
                
            return Response({'status': 'Lead engaged', 'message': 'Inquiry status updated to Qualified.'})
        except Exception as e:
            import traceback
            err_msg = traceback.format_exc()
            with open("api_debug.log", "a") as f:
                f.write(f"\n--- ERROR AT ENGAGE {now()} ---\n{err_msg}\n")
            return Response({
                'error': 'Internal server error during lead engagement.', 
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Allows super admin to reject an inquiry lead."""
        if request.user.role.upper() not in ['SUPER_ADMIN', 'ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        inquiry = self.get_object()
        inquiry.status = 'REJECTED'
        inquiry.save()
        AuditLog.log('STUDY_INQUIRY', user_email=request.user.email, request=request, detail=f"Inquiry for {inquiry.product_name} REJECTED by admin.")
        return Response({'status': 'Inquiry rejected successfully'}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """Restricts deletion to Super Admin only."""
        user_role = (request.user.role or '').upper()
        
        if user_role != 'SUPER_ADMIN':
            return Response({'error': f'Only Super Admin can delete inquiries. Your role: {user_role}'}, status=status.HTTP_403_FORBIDDEN)
            
        AuditLog.log('DELETE_RECORD', user_email=request.user.email, request=request, detail=f"Study inquiry record deleted.")
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject_all_delete(self, request):
        """Allows super admin to reject and delete all inquiries."""
        if request.user.role.upper() not in ['SUPER_ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            inquiries = self.get_queryset()
            count = inquiries.count()
            
            for inquiry in inquiries:
                inquiry.delete()
            
            try:
                AuditLog.log('DELETE_RECORD', user_email=request.user.email, request=request, detail=f"All {count} study inquiries rejected and deleted by admin.")
            except Exception as e:
                pass
                
            return Response({'status': f'All {count} inquiries rejected and deleted successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            error_details = str(e) + " " + traceback.format_exc()
            return Response({'error': 'Server crashed while deleting.', 'detail': error_details}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class InterventionArmViewSet(viewsets.ModelViewSet):
    queryset = InterventionArm.objects.all()
    serializer_class = InterventionArmSerializer
    permission_classes = [permissions.IsAuthenticated]

class KitViewSet(viewsets.ModelViewSet):
    queryset = Kit.objects.all()
    serializer_class = KitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Kit.objects.none()
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']:
            return Kit.objects.all().order_by('-assignment_date')
        # Participants only see their own kits
        return Kit.objects.filter(participant__user=user).order_by('-assignment_date')

    @action(detail=True, methods=['post'])
    def confirm_receipt(self, request, pk=None):
        kit = self.get_object()
        kit.status = 'DELIVERED'
        kit.received_date = now()
        kit.save()
        return Response({'status': 'DELIVERED'})

    @action(detail=True, methods=['post'])
    def initialize_collection(self, request, pk=None):
        kit = self.get_object()
        kit.status = 'COLLECTING'
        kit.collection_date = now()
        kit.save()
        return Response({'status': 'COLLECTING'})

    @action(detail=True, methods=['post'])
    def complete_collection(self, request, pk=None):
        kit = self.get_object()
        kit.status = 'COLLECTED'
        kit.save()
        return Response({'status': 'COLLECTED'})

    @action(detail=True, methods=['post'])
    def ship_return(self, request, pk=None):
        kit = self.get_object()
        kit.status = 'RETURN_SHIPPED'
        kit.shipping_date = now()
        kit.save()
        return Response({'status': 'RETURN_SHIPPED'})

    @action(detail=True, methods=['post'])
    def report_issue(self, request, pk=None):
        kit = self.get_object()
        reason = request.data.get('reason', 'Generic Issue')
        kit.status = 'DAMAGED'
        kit.symptom_note = f"ISSUE REPORTED: {reason}"
        kit.save()
        return Response({'status': 'DAMAGED', 'message': 'Issue reported and status updated.'})

class ClinicalConversationViewSet(viewsets.ModelViewSet):
    queryset = ClinicalConversation.objects.all()
    serializer_class = ClinicalConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ClinicalConversation.objects.none()
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            return ClinicalConversation.objects.all().order_by('-last_updated')
        # PIs and Coordinators see conversations related to their assigned studies
        return ClinicalConversation.objects.filter(study__assignments__user=user).order_by('-last_updated')

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        conv = self.get_object()
        text = request.data.get('text')
        tag = request.data.get('tag', 'GENERAL').upper()
        # attachment = request.FILES.get('attachment')
        
        msg = ClinicalMessage.objects.create(
            conversation=conv,
            sender=request.user,
            text=text,
            tag=tag,
            is_from_pi=(request.user.role.upper() == 'PI')
        )
        
        conv.last_message_preview = text[:100] if text else "Attachment"
        # If coordinator sends, maybe it moves to OPEN. If PI sends, maybe it stays OPEN or moves to ACTION_REQUIRED?
        # Logic from screenshot: Red dot for action required.
        conv.save()
        
        return Response(ClinicalMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def toggle_flag(self, request, pk=None):
        conv = self.get_object()
        conv.is_flagged = not conv.is_flagged
        conv.save()
        return Response({'is_flagged': conv.is_flagged})

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        conv = self.get_object()
        conv.status = 'RESOLVED'
        conv.save()
        return Response({'status': 'RESOLVED'})

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        conv = self.get_object()
        status_val = request.data.get('status')
        if status_val:
            conv.status = status_val.upper().replace(' ', '_')
            conv.save()
        return Response({'status': conv.status})

class ParticipantHelpRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        study_id = request.data.get('study_id')
        action_title = request.data.get('action_title')
        
        user = request.user
        
        # 0. RESOLVE STUDY IF MISSING (Fallback for frontend issues)
        if not study_id:
            try:
                participant = Participant.objects.filter(user=user).first()
                if participant and participant.study:
                    study_id = str(participant.study.id)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to auto-resolve study: {e}")

        # If study_id is still missing, we send to a default admin email
        if not study_id:
            if not action_title:
                return Response({'error': 'Action title is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            from .utils.resend_utils import send_help_request_notification
            send_help_request_notification(
                study_title="UNASSIGNED STUDY",
                participant_name=user.decrypted_name,
                participant_id=f"REF_{str(user.id)[-6:]}",
                action_title=action_title,
                pi_email="info@musbresearch.com",
                coordinator_email=None
            )
            return Response({'status': 'sent', 'message': 'Help request routed to general support.'})

        if not action_title:
            return Response({'error': 'Action title is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Handle MongoDB ObjectId compatibility
            study = Study.objects.get(id=study_id)
            
            # Find or create participant record for this user/study
            participant = Participant.objects.filter(user=user, study=study).first()
            participant_sid = participant.participant_sid if participant else "SELF_IDENTIFIED_USER"

            # 1. SEND EMAIL NOTIFICATION
            pi_email = study.pi.email if study.pi else None
            coordinator_email = study.coordinator.email if study.coordinator else None
            
            from .utils.resend_utils import send_help_request_notification
            send_help_request_notification(
                study_title=study.title,
                participant_name=user.decrypted_name,
                participant_id=participant_sid,
                action_title=action_title,
                pi_email=pi_email,
                coordinator_email=coordinator_email
            )
            
            # 2. CREATE CLINICAL CONVERSATION/MESSAGE (if participant exists)
            if participant:
                conv, created = ClinicalConversation.objects.get_or_create(
                    participant=participant,
                    study=study,
                    defaults={'status': 'ACTION_REQUIRED', 'last_message_preview': action_title}
                )
                if not created:
                    conv.status = 'ACTION_REQUIRED'
                    conv.last_message_preview = action_title
                    conv.save()
                
                ClinicalMessage.objects.create(
                    conversation=conv,
                    sender=user,
                    text=f"SYSTEM ALERT: Participant triggered help request - {action_title}"
                )
            
            try:
                AuditLog.log('HELP_REQUEST', user_email=user.email, request=request, detail=f"Help request triggered for study {study.title}: {action_title}")
            except:
                pass
            
            return Response({'status': 'sent', 'message': 'Help request routed successfully.'})
            
        except Study.DoesNotExist:
            return Response({'error': 'Study not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Help request failed: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
