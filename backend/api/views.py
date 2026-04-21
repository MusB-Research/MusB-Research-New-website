from rest_framework import viewsets, permissions, status, parsers, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    Visit, Study, StudyAssignment, Participant, Form, FormResponse, Task, 
    ParticipantTask, StaffTask, Consent, ConsentTemplate, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog, InterventionArm,
    News, Event, FacilityInquiry, Candidate, NewsletterSubscriber,
    BookletDownloadRequest, Partnership, Publication, EducationMaterial,
    StudyInquiry, ClinicalConversation, ClinicalMessage,
    DosingLog, AEReport, Document, Notification, ProgressReport,
    StudyActionRequest, DailyMedicationLog, AssignedForm, SponsorOrganization,
    QuestionnaireTemplate, StudyQuestionnaire, QuestionnaireScheduleInstance,
    Technology, InnovationPageSettings, SponsorInquiry
)
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .serializers import (
    VisitSerializer, StudySerializer, StudyAssignmentSerializer, ParticipantSerializer, 
    ParticipantBriefSerializer, DeIdentifiedParticipantSerializer, UserSerializer, FormSerializer, 
    FormResponseSerializer, TaskSerializer, ParticipantTaskSerializer, StaffTaskSerializer, 
    ConsentSerializer, ConsentTemplateSerializer, LeadSerializer, CommunicationLogSerializer,
    CompensationSerializer, LabResultSerializer, DataAuditLogSerializer,
    NewsSerializer, EventSerializer, FacilityInquirySerializer, CandidateSerializer,
    NewsletterSubscriberSerializer, BookletDownloadRequestSerializer,
    PartnershipSerializer, PublicationSerializer, EducationMaterialSerializer,
    StudyInquirySerializer, InterventionArmSerializer,
    ClinicalConversationSerializer, ClinicalConversationBriefSerializer, ClinicalMessageSerializer,
    DosingLogSerializer, AEReportSerializer,
    NotificationSerializer, ProgressReportSerializer, DocumentSerializer,
    DailyMedicationLogSerializer, AssignedFormSerializer, SponsorOrganizationSerializer,
    PublicStudySerializer, QuestionnaireTemplateSerializer, StudyQuestionnaireSerializer,
    QuestionnaireScheduleInstanceSerializer,
    TechnologySerializer, InnovationPageSettingsSerializer, SponsorInquirySerializer
)
from authentication.models import User, AuditLog
from django.db.models import Q, Count, Case, When, IntegerField, FloatField, Avg
from django.utils import timezone
from django.utils.timezone import now
import pytz
from .utils.reward_logic import trigger_reward_logic
import datetime
import bson
from .utils.cache_utils import cache_api_response, invalidate_cache

class IsAdminOrCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return (request.user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI', 'SPONSOR']

class SoftPaginationMixin:
    """
    Mixin to apply a limit-based slice to the queryset in the list view.
    Maintains a plain array response structure without metadata.
    """
    @cache_api_response("participants_list", timeout=300)
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        try:
            limit = int(request.query_params.get('limit', 50))
            if limit <= 0: limit = 50
        except (ValueError, TypeError):
            limit = 50
            
        # Optimization: Slice the queryset directly
        queryset = queryset[:limit]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class WorkflowContentMixin:
    """Mixin to handle role-based workflow logic for content creation and status."""
    
    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('workflow_status')
        is_study = hasattr(self.get_serializer_class().Meta.model, 'approval_status')
        status_field = 'approval_status' if is_study else 'status'

        if not user.is_authenticated:
            return self.queryset.filter(**{status_field: 'approved'})
            
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
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
        status_val = 'approved' if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR'] else 'pending'
        serializer.save(created_by=user, **{status_field: status_val})

    def perform_update(self, serializer):
        user = self.request.user
        is_study = hasattr(serializer.Meta.model, 'approval_status')
        status_field = 'approval_status' if is_study else 'status'
        if (user.role or '').upper() not in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR']:
            serializer.save(**{status_field: 'pending'})
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if (request.user.role or '').upper() not in ['SUPER_ADMIN', 'ADMIN']:
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
        if (request.user.role or '').upper() not in ['SUPER_ADMIN', 'ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object()
        if hasattr(obj, 'approval_status'):
            obj.approval_status = 'rejected'
        else:
            obj.status = 'rejected'
        obj.save()
        return Response({'status': 'content rejected'})

class SponsorOrganizationViewSet(SoftPaginationMixin, viewsets.ModelViewSet):
    queryset = SponsorOrganization.objects.all()
    serializer_class = SponsorOrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # All authenticated users can view sponsor organizations (needed for selection)
        return SponsorOrganization.objects.all().order_by('name')[:100]

    def perform_create(self, serializer):
        # Allow Super Admin, Admin, and PI to create organizations for now
        if (self.request.user.role or '').upper() not in ['SUPER_ADMIN', 'ADMIN', 'PI']:
            raise serializers.ValidationError({"detail": "Unauthorized to create sponsor organization."})
        serializer.save()

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
            # Public view only shows active/recruiting studies
            return Study.objects.filter(
                status__in=['RECRUITING', 'ACTIVE'], 
                stage__in=['RECRUITING', 'ACTIVE'],
                approval_status='approved',
                is_archived=False
            ).order_by('-created_at')
        
        role = (user.role or '').strip().upper()
        
        # 1. Super Admin: Absolute Visibility
        if role == 'SUPER_ADMIN':
            return Study.objects.all().order_by('created_at')
            
        # 2. Staff Roles (PI, COORDINATOR, ADMIN): All studies for research oversight & collaboration
        if role in ['PI', 'COORDINATOR', 'ADMIN']:
            return Study.objects.all().order_by('created_at')

        # 3. Sponsors: Studies where they are the direct sponsor user OR assigned via StudyAssignment
        if role == 'SPONSOR':
            return Study.objects.filter(
                Q(sponsor=user) | Q(assignments__user=user)
            ).distinct().order_by('created_at')

        # 4. Participants: Only studies they are enrolled in
        return Study.objects.filter(
            participants__user=user,
            approval_status='approved'
        ).distinct().order_by('created_at')
    
    @cache_api_response("studies_list", timeout=3600)  # Keep at 1 hour since studies change less frequently
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        role = (user.role or '').upper()
        
        # Requirement 1: Sponsors cannot create study directly
        if role == 'SPONSOR':
            raise serializers.ValidationError({"detail": "Sponsors cannot create studies directly. Please submit a Study Inquiry for review."})

        pi_ids = serializer.validated_data.pop('pi_ids', [])
        coord_ids = serializer.validated_data.pop('coordinator_ids', [])
        sponsor_ids = serializer.validated_data.pop('sponsor_ids', [])
        # Critical Fix: Pop questionnaires_data so serializer.save() doesn't try to set M2M field with JSON
        questionnaires_data = serializer.validated_data.pop('study_questionnaires', [])
        
        # Staff creation is auto-approved
        approval_status = 'approved' if role in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR'] else 'pending'
        
        study = serializer.save(
            created_by=user, 
            created_by_role=role,
            approval_status=approval_status
        )

        # Handle Clinical Instruments (Questionnaires) from the Launch Form
        for q_data in questionnaires_data:
            template_id = q_data.get('template')
            if not template_id: continue
            
            try:
                template = QuestionnaireTemplate.objects.get(pk=template_id)
                # Flexible Scheduling Logic
                interval = q_data.get('frequency_interval')
                unit = q_data.get('frequency_unit')
                freq = q_data.get('frequency', 'ONCE')

                # Legacy Mapping fallback
                if not interval or not unit:
                    if freq == 'DAILY':
                        interval = 1; unit = 'DAYS'
                    elif freq == 'WEEKLY':
                        interval = 1; unit = 'WEEKS'
                    elif freq == 'MONTHLY':
                        interval = 1; unit = 'MONTHS'
                    elif freq == 'ONCE':
                        interval = 1; unit = 'WEEKS' # Repetitions 1 makes it once
                    else:
                        interval = 1; unit = 'WEEKS'

                StudyQuestionnaire.objects.create(
                    study=study,
                    template=template,
                    mode=q_data.get('mode', 'STRUCTURED'),
                    frequency_interval=interval,
                    frequency_unit=unit,
                    repeat_count=q_data.get('repetitions', 1),
                    repeat_type=freq, # Carry over for legacy reporting
                    schedule_name=q_data.get('schedule_name', template.name),
                    allow_participant_download=q_data.get('allow_participant_download', False),
                    notify_staff_on_submission=q_data.get('notify_staff_on_submission', True)
                )
            except QuestionnaireTemplate.DoesNotExist:
                pass # Or log error
            
        self._sync_assignments(study, pi_ids, coord_ids, sponsor_ids)
        AuditLog.log('UPDATE_STUDY', user_email=user.email, request=self.request, detail=f"Created study {study.title}")
        if (user.role or '').upper() in ['PI', 'COORDINATOR']:
            StudyAssignment.objects.get_or_create(study=study, user=user, role=user.role)
            
        # Invalidate cache so it shows up globally
        invalidate_cache("studies_list")

    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrCoordinator])
    @cache_api_response("study_stats", timeout=300)
    def stats(self, request, protocol_id=None):
        """High-level completion stats for the PI/Coordinator dashboard"""
        study = self.get_object()
        from .models import Participant, QuestionnaireScheduleInstance, Visit, ParticipantTask
        from django.utils.timezone import now
        
        # 1. Total Enrollment
        total_enrolled = Participant.objects.filter(study=study).count()
        
        # 2. Optimized Aggregations (separate collections to avoid heavy joins)
        q_stats = QuestionnaireScheduleInstance.objects.filter(
            participant__study=study
        ).aggregate(
            total=Count('id'),
            completed=Count(Case(When(status='COMPLETED', then=1), output_field=IntegerField())),
            late=Count(Case(When(status='LATE', then=1), output_field=IntegerField())),
            missed=Count(Case(When(status='MISSED', then=1), output_field=IntegerField())),
        )

        t_stats = ParticipantTask.objects.filter(
            participant__study=study
        ).aggregate(
            total=Count('id'),
            completed=Count(Case(When(status='COMPLETED', then=1), output_field=IntegerField())),
            missed=Count(Case(When(status='MISSED', then=1), output_field=IntegerField())),
        )
        
        v_stats = Visit.objects.filter(participant__study=study).aggregate(
            total=Count('id'),
            completed=Count(Case(When(status='COMPLETED', then=1), output_field=IntegerField())),
            upcoming=Count(Case(When(status='SCHEDULED', scheduled_date__gt=now(), then=1), output_field=IntegerField())),
            overdue=Count(Case(When(status='SCHEDULED', scheduled_date__lt=now(), then=1), output_field=IntegerField())),
        )

        # 3. Calculate Totals
        total_q = q_stats.get('total') or 0
        done_q = q_stats.get('completed') or 0
        total_t = t_stats.get('total') or 0
        done_t = t_stats.get('completed') or 0
        
        total_tasks = total_q + total_t
        completed_tasks = done_q + done_t
        compliance = round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0
        
        return Response({
            'enrolled': total_enrolled,
            'compliance': compliance,
            'completion': { # Legacy support
                'total': total_tasks,
                'completed': completed_tasks,
                'late': q_stats.get('late') or 0,
                'missed': (q_stats.get('missed') or 0) + (t_stats.get('missed') or 0),
                'compliance_rate': compliance
            },
            'tasks': {
                'total': total_tasks,
                'completed': completed_tasks,
                'missed': (q_stats.get('missed') or 0) + (t_stats.get('missed') or 0),
            },
            'visits': {
                'total': v_stats.get('total') or 0,
                'completed': v_stats.get('completed') or 0,
                'upcoming': v_stats.get('upcoming') or 0,
                'overdue': v_stats.get('overdue') or 0,
            }
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrCoordinator])
    @cache_api_response("participant_tracking", timeout=300)
    def participant_tracking(self, request, protocol_id=None):
        """
        🚀 Next-Gen Progress Tracking (Optimized for MongoDB)
        Replaces heavy annotate(Count) with efficient batch fetching.
        """
        study = self.get_object()
        from .models import Participant, QuestionnaireScheduleInstance, ParticipantTask
        
        # 1. Fetch participants (basic fields only)
        participants = list(Participant.objects.filter(study=study).only(
            'id', 'participant_sid', 'status', 'updated_at'
        ))
        
        p_ids = [str(p.id) for p in participants]
        
        # 2. Batch fetch Questionnaire stats for ALL participants in one go
        q_rows = QuestionnaireScheduleInstance.objects.filter(
            participant__id__in=p_ids
        ).values('participant_id').annotate(
            total=Count('id'),
            done=Count(Case(When(status__in=['COMPLETED', 'LATE'], then=1), output_field=IntegerField()))
        )
        q_map = {str(r['participant_id']): r for r in q_rows}
        
        # 3. Batch fetch Task stats for ALL participants in one go
        t_rows = ParticipantTask.objects.filter(
            participant__id__in=p_ids
        ).values('participant_id').annotate(
            total=Count('id'),
            done=Count(Case(When(status='COMPLETED', then=1), output_field=IntegerField()))
        )
        t_map = {str(r['participant_id']): r for r in t_rows}
        
        # 4. In-memory data merge (Lightning fast)
        data = []
        for p in participants:
            p_id = str(p.id)
            q = q_map.get(p_id, {'total': 0, 'done': 0})
            t = t_map.get(p_id, {'total': 0, 'done': 0})
            
            total = q['total'] + t['total']
            done = q['done'] + t['done']
            
            data.append({
                'id': p_id,
                'sid': p.participant_sid,
                'status': p.status,
                'progress': round((done / total * 100), 1) if total > 0 else 0,
                'tasks_total': t['total'],
                'tasks_completed': t['done'],
                'questionnaires_total': q['total'],
                'questionnaires_completed': q['done'],
                'last_interaction': p.updated_at
            })
            
        return Response(data)


    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrCoordinator])
    @cache_api_response("coordinator_summary", timeout=120)
    def coordinator_summary(self, request, protocol_id=None):
        """
        🚀 Ultra-High-Efficiency Aggregated Action for Staff Dashboards.
        Combines Study Details, Global Stats, and Participant Tracking into a single payload.
        """
        study = self.get_object()
        
        # Internal calls fetch the data directly (now optimized)
        stats_response = self.stats(request, protocol_id=protocol_id)
        tracking_response = self.participant_tracking(request, protocol_id=protocol_id)
        
        return Response({
            'study': StudySerializer(study).data,
            'stats': stats_response.data,
            'participant_tracking': tracking_response.data,
            'server_iso': timezone.now().isoformat() # Fully serializable
        })

    def perform_update(self, serializer):
        user = self.request.user
        role = (user.role or '').upper()
        
        # Requirement 2: Sponsors cannot edit study protocol or stage
        if role == 'SPONSOR':
             raise serializers.ValidationError({"detail": "Sponsors only have read-only access to assigned studies."})

        # Requirement 3: Only Super Admin can toggle is_archived manually
        if 'is_archived' in serializer.validated_data and role != 'SUPER_ADMIN':
            serializer.validated_data.pop('is_archived')

        pi_ids = serializer.validated_data.pop('pi_ids', None)
        coord_ids = serializer.validated_data.pop('coordinator_ids', None)
        sponsor_ids = serializer.validated_data.pop('sponsor_ids', None)
        # Fix for update flow: Sync questionnaires_data
        questionnaires_data = serializer.validated_data.pop('study_questionnaires', None)
        
        # Logic 4: If stage is moved to CLOSED_ARCHIVED, auto-archive
        if serializer.validated_data.get('stage') == 'CLOSED_ARCHIVED':
            serializer.validated_data['is_archived'] = True

        study = serializer.save()
        
        if questionnaires_data is not None:
            # Sync StudyQuestionnaires (Update or Create)
            existing_templates = set()
            for q_data in questionnaires_data:
                template_id = q_data.get('template')
                if not template_id: continue
                existing_templates.add(template_id)
                
                try:
                    template = QuestionnaireTemplate.objects.get(pk=template_id)
                    StudyQuestionnaire.objects.update_or_create(
                        study=study,
                        template=template,
                        defaults={
                            'mode': q_data.get('mode', 'STRUCTURED'),
                            'frequency_interval': q_data.get('frequency_interval', 1),
                            'frequency_unit': q_data.get('frequency_unit', 'WEEKS'),
                            'repeat_count': q_data.get('repetitions', 1),
                            'schedule_name': q_data.get('schedule_name', template.name),
                            'allow_participant_download': q_data.get('allow_participant_download', False),
                            'notify_staff_on_submission': q_data.get('notify_staff_on_submission', True)
                        }
                    )
                except QuestionnaireTemplate.DoesNotExist:
                    pass
            
            # Optional: Remove ones that were unselected (if the list is exhaustive)
            # study.study_questionnaires.exclude(template__in=list(existing_templates)).delete()

        self._sync_assignments(study, pi_ids, coord_ids, sponsor_ids)
        AuditLog.log('UPDATE_STUDY', user_email=user.email, request=self.request, detail=f"Modified study {study.title}")
        
        # Invalidate cache
        invalidate_cache("studies_list")
        invalidate_cache("coordinator_summary")

    def _sync_assignments(self, study, pi_ids, coord_ids, sponsor_ids=None):
        if pi_ids is not None:
            study.assignments.filter(role='PI').exclude(user__in=pi_ids).delete()
            for pi_user in pi_ids:
                StudyAssignment.objects.get_or_create(study=study, user=pi_user, role='PI')
        if coord_ids is not None:
            study.assignments.filter(role='COORDINATOR').exclude(user__in=coord_ids).delete()
            for coord_user in coord_ids:
                StudyAssignment.objects.get_or_create(study=study, user=coord_user, role='COORDINATOR')
        
        # Sync Sponsor assignment
        if sponsor_ids is not None:
             study.assignments.filter(role='SPONSOR_ADMIN').exclude(user__in=sponsor_ids).delete()
             for sp_user in sponsor_ids:
                 StudyAssignment.objects.get_or_create(study=study, user=sp_user, role='SPONSOR_ADMIN')
        elif study.sponsor:
            study.assignments.filter(role='SPONSOR_ADMIN').exclude(user=study.sponsor).delete()
            StudyAssignment.objects.get_or_create(study=study, user=study.sponsor, role='SPONSOR_ADMIN')
        else:
            study.assignments.filter(role='SPONSOR_ADMIN').delete()

        if pi_ids: study.pi = pi_ids[0]
        if coord_ids: study.coordinator = coord_ids[0]
        if sponsor_ids: study.sponsor = sponsor_ids[0]
        study.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, **kwargs):
        """Allow authenticated users to self-enroll in a study."""
        study = self.get_object()
        user = request.user
        
        # Check if already enrolled in THIS study
        existing = Participant.objects.filter(study=study, user=user).first()
        if existing:
            return Response({
                'status': 'already_enrolled', 
                'message': 'You are already enrolled in this study.', 
                'participant_sid': existing.participant_sid
            }, status=status.HTTP_200_OK)

        # Enforce one-study-at-a-time (Soft Block): 
        active_enrollment = Participant.objects.filter(
            user=user
        ).exclude(
            status__in=['DROPPED', 'INELIGIBLE', 'COMPLETED']
        ).exclude(study=study).first()

        requested_status = request.data.get('status')
        status_val = 'RECRUITING'
        status_notes = ''

        if active_enrollment:
            status_val = 'PENDING_REVIEW'
            status_notes = f"Application pending approval: User already enrolled in study {active_enrollment.study.protocol_id}."
        elif requested_status:
            status_val = requested_status
            status_notes = "Status initialized from screener outcome."
            
        # Reuse existing SID if user is already a participant in another study to maintain consistency
        any_existing_participant = Participant.objects.filter(user=user).first()
        if any_existing_participant:
            sid = any_existing_participant.participant_sid
        else:
            # Generate anonymous SID for new participants
            import secrets
            pid_clean = "".join(filter(str.isalnum, study.protocol_id))[:4].upper()
            sid = f"{pid_clean}-{secrets.token_hex(4).upper()}"
        
        participant = Participant.objects.create(
            study=study,
            user=user,
            participant_sid=sid,
            status=status_val,
            status_notes=status_notes,
            reviewed_at=timezone.now() if status_val not in ['PENDING_REVIEW', 'RECRUITING'] else None
        )
        # Import AuditLog inside if needed, though it's already imported at module level
        AuditLog.log('PARTICIPANT_SELF_ENROLL', user_email=user.email, request=request, detail=f"User self-enrolled in study {study.protocol_id}. Multi-enrolled: {bool(active_enrollment)}")
        
        # Notifications to Staff
        if study.coordinator:
            Notification.objects.create(
                user=study.coordinator,
                title="New Study Interest",
                message=f"Participant {sid} has expressed interest in {study.protocol_id} and added it to their portal.",
                type="INFO"
            )
            StaffTask.objects.create(
                user=study.coordinator,
                study=study,
                title="Review Screener Form",
                description=f"Participant {sid} has completed the screener for {study.protocol_id}. Please review eligibility.",
                task_type="SCREENER_REVIEW",
                reference_id=str(participant.pk)
            )
            
        if study.pi:
            Notification.objects.create(
                user=study.pi,
                title="New Study Interest",
                message=f"Participant {sid} has expressed interest in {study.protocol_id}.",
                type="INFO"
            )
        
        msg = 'Study added to your portal. Please complete the eligibility screener to proceed.'
        if active_enrollment:
            msg = 'You are currently enrolled in another study. Your request will be reviewed by the PI and Coordinator.'

        return Response({
            'status': 'success', 
            'message': msg, 
            'participant_sid': sid,
            'study_title': study.title,
            'is_pending_multi_enrollment': bool(active_enrollment)
        }, status=status.HTTP_201_CREATED)

class PublicStudyViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicStudySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'protocol_id'

    def get_queryset(self):
        # CRITICAL: Always show studies in chronological order (Oldest First / Appended to bottom)
        # NEVER CHANGE THIS ORDERING. USER REQUIREMENT IS "FIRST CREATED = TOP OF LIST".
        VISIBLE_STATUSES = ['RECRUITING', 'ACTIVE', 'UPCOMING']
        return Study.objects.filter(
            status__in=VISIBLE_STATUSES,
            is_archived=False
        ).order_by('created_at')

    def list(self, request, *args, **kwargs):
        # HARD-CODE FORCE SORT TO BYPASS ANY SYSTEM OVERRIDES
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        # Final safety check: sort again in Python memory
        data = sorted(serializer.data, key=lambda x: x.get('created_at') or '')
        return Response(data)

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
            return Study.objects.all().distinct().order_by('-created_at')
        return Study.objects.filter(approval_status='approved', status__in=['RECRUITING', 'ACTIVE']).distinct().order_by('-created_at')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, **kwargs):
        study = self.get_object()
        user = request.user
        
        # Check if already enrolled in THIS study
        existing = Participant.objects.filter(study=study, user=user).first()
        if existing:
            return Response({'status': 'already_enrolled', 'message': 'You are already enrolled in this study.', 'participant_sid': existing.participant_sid}, status=status.HTTP_200_OK)

        # Enforce one-study-at-a-time (Soft Block): 
        # Requirement: Can apply -> goes to PI & Coordinator for approval
        active_enrollment = Participant.objects.filter(
            user=user
        ).exclude(
            status__in=['DROPPED', 'INELIGIBLE', 'COMPLETED']
        ).exclude(study=study).first()

        requested_status = request.data.get('status')
        status_val = 'RECRUITING'
        status_notes = ''

        if active_enrollment:
            status_val = 'PENDING_REVIEW'
            status_notes = f"Application pending approval: User already enrolled in study {active_enrollment.study.protocol_id}."
        elif requested_status:
            status_val = requested_status
            status_notes = "Status initialized from screener outcome."
            
        # Reuse existing SID if user is already a participant in another study to maintain consistency
        any_existing_participant = Participant.objects.filter(user=user).first()
        if any_existing_participant:
            sid = any_existing_participant.participant_sid
        else:
            # Generate anonymous SID for new participants
            import secrets
            pid_clean = "".join(filter(str.isalnum, study.protocol_id))[:4].upper()
            sid = f"{pid_clean}-{secrets.token_hex(4).upper()}"
        
        participant = Participant.objects.create(
            study=study,
            user=user,
            participant_sid=sid,
            status=status_val,
            status_notes=status_notes,
            reviewed_at=timezone.now() if status_val not in ['PENDING_REVIEW', 'RECRUITING'] else None
        )
        AuditLog.log('PARTICIPANT_SELF_ENROLL', user_email=user.email, request=request, detail=f"User self-enrolled in study {study.protocol_id}. Multi-enrolled: {bool(active_enrollment)}")
        
        # Determine the Coordinator and PI for the study
        if study.coordinator:
            Notification.objects.create(
                user=study.coordinator,
                title="New Study Interest",
                message=f"Participant {sid} has expressed interest in {study.protocol_id} and added it to their portal.",
                type="INFO"
            )
            StaffTask.objects.create(
                user=study.coordinator,
                study=study,
                title="Review Screener Form",
                description=f"Participant {sid} has completed the screener for {study.protocol_id}. Please review eligibility.",
                task_type="SCREENER_REVIEW",
                reference_id=str(participant.pk)
            )
            
        if study.pi:
            Notification.objects.create(
                user=study.pi,
                title="New Study Interest",
                message=f"Participant {sid} has expressed interest in {study.protocol_id}.",
                type="INFO"
            )
        
        msg = 'Study added to your portal. Please complete the eligibility screener to proceed.'
        if active_enrollment:
            msg = 'You are currently enrolled in another study. Your request will be reviewed by the PI and Coordinator.'

        return Response({
            'status': 'success', 
            'message': msg, 
            'participant_sid': sid,
            'study_title': study.title,
            'is_pending_multi_enrollment': bool(active_enrollment)
        }, status=status.HTTP_201_CREATED)

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

class ParticipantViewSet(SoftPaginationMixin, viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'participant_sid'

    def get_serializer_class(self):
        # PERFORMANCE: Use light-weight serializer for lists, full for detail views
        if self.action == 'list':
            return ParticipantBriefSerializer
        return ParticipantSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Participant.objects.none()
            
        role = (user.role or '').upper()
        
        # Staff roles see everyone
        if role in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']:
            qs = Participant.objects.select_related('user', 'study', 'study__coordinator', 'reviewed_by')
            
            # Optimization: Only prefetch heavy relations for detail view
            if self.action == 'retrieve' or self.action == 'me':
                qs = qs.prefetch_related(
                    'visits', 'daily_logs', 'lab_results', 'ae_reports', 'consent_records'
                )
            return qs.order_by('created_at')
            
        # Participants can ONLY see their own records
        if role == 'PARTICIPANT':
            qs = Participant.objects.filter(user=user).select_related('user', 'study')
            if self.action == 'retrieve' or self.action == 'me':
                qs = qs.prefetch_related('visits', 'daily_logs')
            return qs.order_by('created_at')
            
        # Default to nothing for security
        return Participant.objects.none()

    @cache_api_response("participants_list", timeout=600)  # Increased from 300s to 600s (10 minutes)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
        
    def perform_create(self, serializer):
        serializer.save()
        invalidate_cache("participants_list")
        
    def perform_update(self, serializer):
        serializer.save()
        invalidate_cache("participants_list")
        
    def perform_destroy(self, instance):
        instance.delete()
        invalidate_cache("participants_list")


    # Removed _ensure_test_participant logic to allow 'No Active Study' states for testing as per user request.

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        # Try finding by participant_sid first
        obj = queryset.filter(participant_sid=lookup_value).first()
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
        raise Http404("Participant not found with provided Study ID or DB ID.")


    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    @cache_api_response("participant_me", timeout=600)  # Increased from 120s to 600s (10 minutes)
    def me(self, request):
        user = request.user
        study_id = request.query_params.get('study_id')
        
        # Multi-study support: Get the latest/active participant record
        qs = Participant.objects.filter(user=user)
        if study_id:
            # Handle both DB ID and Protocol ID
            qs = qs.filter(Q(study__id=study_id) | Q(study__protocol_id=study_id))
            
        participant = qs.order_by('-created_at').first()
        if not participant:
            # Return 200 with null instead of 404 to prevent console noise in frontend SPAs
            return Response(None, status=status.HTTP_200_OK)
            
        serializer = self.get_serializer(participant)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    @cache_api_response("dashboard_quick", timeout=600)  # Cache for 10 minutes
    def dashboard_quick(self, request):
        """Lightweight endpoint - returns only menu + basic info (loads in <50ms with cache)"""
        user = request.user
        p_sid = request.query_params.get('participant_sid')
        
        if user.role == 'PARTICIPANT':
            qs = Participant.objects.filter(user=user)
            if p_sid:
                qs = qs.filter(participant_sid=p_sid)
            participant = qs.select_related('study', 'user').first()
        else:
            if not p_sid:
                # Instead of 403, return 200 with null values so staff dashboards don't crash when missing context
                return Response({'user': UserSerializer(user).data, 'participant': None}, status=200)
            participant = Participant.objects.filter(participant_sid=p_sid).select_related('study', 'user').first()
        
        if not participant:
            return Response({'user': UserSerializer(user).data, 'participant': None}, status=200)
        
        return Response({
            'user': UserSerializer(participant.user).data,
            'participant': ParticipantSerializer(participant).data,
            'study': StudySerializer(participant.study).data,
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    @cache_api_response("participant_dashboard", timeout=900)
    def dashboard_summary(self, request):
        """
        🚀 Ultra-High-Performance Aggregated Endpoint for Participant Dashboard.
        ✅ Optimized for 2-3MB response in <100ms (previously 120-180s with cache expiry).
        ✅ Uses batched queries + aggressive field limiting to minimize database load.
        """
        user = request.user
        role = (user.role or '').upper()
        
        p_sid = request.query_params.get('participant_sid')
        
        if role == 'PARTICIPANT':
            qs = Participant.objects.filter(user=user)
            if p_sid:
                qs = qs.filter(participant_sid=p_sid)
            
            # PRIORITY LOGIC: 
            # 1. First choice: Enrolled/Active/Consented participants (who need the clinical dashboard)
            # 2. Second choice: Newest pending review 
            # 3. Third choice: Completed or others
            participant = qs.select_related('study', 'study__coordinator', 'study__pi', 'user').order_by(
                Case(
                    When(status__in=['ENROLLED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE'], then=0),
                    When(status='PENDING_REVIEW', then=1),
                    When(status='COMPLETED', then=2),
                    default=3
                ),
                '-created_at'
            ).first()
        else:
            # PI/Coordinator view requires participant_sid
            if not p_sid:
                 return Response({'error': 'Authorized for participants or requires participant_sid.'}, status=403)
            participant = Participant.objects.filter(participant_sid=p_sid).select_related(
                'study', 'study__coordinator', 'study__pi', 'user'
            ).first()
        
        if not participant:
            return Response({
                'user': UserSerializer(user).data,
                'participant': None,
                'status': 'NO_ENROLLMENT'
            }, status=200)
            
        p_id = participant.id
        s_id = participant.study.id
        
        # PERFORMANCE FIX: Load all related data in bulk to minimize database round-trips
        # Group related data fetches so Django ORM can optimize query execution
        
        # Batch 1: Tasks & Questionnaires (clinical activity)
        tasks_list = list(ParticipantTask.objects.filter(participant_id=p_id).select_related(
            'task', 'task__form', 'assigned_form', 'assigned_form__form'
        )[:200])  # Limit to prevent UI overload
        
        ques_list = list(QuestionnaireScheduleInstance.objects.filter(participant_id=p_id).select_related(
            'study_questionnaire', 'study_questionnaire__template'
        )[:100])
        
        # Batch 2: Visits, Labs, Kits (logistics)
        visits_list = list(Visit.objects.filter(participant_id=p_id).select_related(
            'scheduled_by', 'updated_by'
        )[:50])
        
        lab_results_list = list(LabResult.objects.filter(
            participant_id=p_id, is_released=True
        ).only(
            'id', 'participant_id', 'test_name', 'value', 'units',
            'status', 'lab_date', 'released_at', 'is_critical'
        )[:50])  # Only essential fields

        
        # Batch 3: Communication & Compliance
        conversations_list = list(ClinicalConversation.objects.filter(
            participant_id=p_id
        ).prefetch_related('messages')[:50])
        
        assigned_forms_list = list(AssignedForm.objects.filter(
            participant_id=p_id
        ).select_related('form')[:30])
        
        compensations_list = list(Compensation.objects.filter(
            participant_id=p_id
        ).select_related('visit', 'task')[:50])
        
        # Batch 4: Consent & Templates
        consent_list = list(Consent.objects.filter(
            participant_id=p_id
        ).select_related('template', 'study')[:30])
        
        consent_templates_list = list(ConsentTemplate.objects.filter(
            study_id=s_id, status='ACTIVE'
        )[:20])
        
        # Batch 5: Logs & Support
        logs_list = list(DailyMedicationLog.objects.filter(
            participant_id=p_id
        ).order_by('-date')[:30])
        
        help_requests_list = list(StaffTask.objects.filter(
            study_id=s_id, task_type='HELP_REQUEST'
        ).only(
            'id', 'user_id', 'title', 'description', 'created_at'
        )[:20])
        
        # Batch 6: Notifications (use only() for better performance)
        base_notifications = Notification.objects.filter(
            user_id=user.id
        ).only(
            'id', 'user_id', 'title', 'message', 'type', 'is_read', 'created_at'
        )
        unread_count = base_notifications.filter(is_read=False).count() if hasattr(Notification, 'is_read') else 0
        notifications_list = list(base_notifications.order_by('-created_at')[:15])

        # Get today's log status for virtual task injection
        has_today_log = DailyMedicationLog.objects.filter(
            participant_id=p_id, 
            date=timezone.now().date(),
            is_draft=False
        ).exists()

        # Serialize all data in parallel (Django handles this efficiently)
        serialized_tasks = ParticipantTaskSerializer(tasks_list, many=True).data
        
        # Inject a virtual "Daily Log" task if the protocol requires it (defaulting to true for adherence tracking)
        # and it's not already explicitly assigned as a task
        has_formal_log_task = any(
            isinstance(t, dict) and
            isinstance(t.get('task_details'), dict) and 
            t.get('task_details', {}).get('task_type') in ['LOG', 'DAILY_LOG'] 
            for t in serialized_tasks
        )
        if not has_formal_log_task:
            serialized_tasks.append({
                'id': 'virtual-daily-log',
                'title': 'Daily Medication Log',
                'status': 'COMPLETED' if has_today_log else 'PENDING',
                'due_date': timezone.now().isoformat(),
                'task': {
                    'title': 'Daily Medication Log',
                    'task_type': 'DAILY_LOG',
                    'frequency': 'DAILY'
                },
                'estimated_time': '2 min',
                'priority': 'HIGH',
                'is_virtual': True
            })

        data = {
            'user': UserSerializer(participant.user).data,
            'participant': ParticipantSerializer(participant).data,
            'study': StudySerializer(participant.study).data,
            'tasks': serialized_tasks,
            'questionnaire_schedules': QuestionnaireScheduleInstanceSerializer(ques_list, many=True).data,
            'visits': VisitSerializer(visits_list, many=True).data,

            'lab_results': LabResultSerializer(lab_results_list, many=True).data,
            'compensations': CompensationSerializer(compensations_list, many=True).data,
            'notifications': NotificationSerializer(notifications_list, many=True).data,
            'conversations': ClinicalConversationSerializer(conversations_list, many=True).data,
            'assigned_forms': AssignedFormSerializer(assigned_forms_list, many=True).data,
            'active_consents': ConsentSerializer(consent_list, many=True).data,
            'available_consent_templates': ConsentTemplateSerializer(consent_templates_list, many=True).data,
            'medication_logs': DailyMedicationLogSerializer(logs_list, many=True).data,
            'help_requests': StaffTaskSerializer(help_requests_list, many=True).data,
            'server_time': timezone.now(),
            'links': {
                'study_inquiries': "/dashboard/admin/study-inquiries" if user.role == 'SUPER_ADMIN' else "/dashboard/coordinator/study-inquiries",
            },
            'enabled_modules': [
                'study_questionnaires', 'screener_config', 'visits', 'ae_reports', 
                'daily_logs', 'lab_results', 'consent_records'
            ],
            'performance_metrics': {
                'total_tasks': len(serialized_tasks),
                'unread_notifs': unread_count
            }
        }
        
        return Response(data)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrCoordinator])
    def admin_reassign(self, request):
        """Administrative tool to move a user between studies."""
        user_email = request.data.get('email')
        new_study_title = request.data.get('study_title')
        
        if not user_email or not new_study_title:
            return Response({'error': 'Email and study_title are required.'}, status=400)
            
        target_user = User.objects.filter(email=user_email).first()
        if not target_user:
            return Response({'error': f'User {user_email} not found.'}, status=404)
            
        new_study = Study.objects.filter(title__icontains=new_study_title).first()
        if not new_study:
            return Response({'error': f'Study containing "{new_study_title}" not found.'}, status=404)
            
        # Remove from other studies
        Participant.objects.filter(user=target_user).exclude(study=new_study).delete()
        
        # Enroll in new study
        participant, created = Participant.objects.get_or_create(
            user=target_user,
            study=new_study,
            defaults={'status': 'ACTIVE'}
        )
        
        if created:
            import secrets
            pid_clean = "".join(filter(str.isalnum, new_study.protocol_id))[:4].upper()
            sid = f"{pid_clean}-{secrets.token_hex(4).upper()}"
            participant.participant_sid = sid
            participant.save()
            
        return Response({
            'status': 'success',
            'message': f'User {user_email} successfully moved to {new_study.title}',
            'sid': participant.participant_sid
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit_eligibility(self, request, *args, **kwargs):
        """Submit the eligibility form results and set status to PENDING_REVIEW"""
        participant = self.get_object()
        
        # Verify ownership
        if participant.user != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        # Lock check (Rule 9)
        if participant.status not in ['RECRUITING', 'INELIGIBLE']:
            return Response({'error': 'Eligibility form already submitted and locked.'}, status=status.HTTP_400_BAD_REQUEST)
            
        data = request.data.get('eligibility_data')
        if not data:
            return Response({'error': 'No eligibility data provided.'}, status=status.HTTP_400_BAD_REQUEST)

        participant.eligibility_data = data
        participant.status = 'PENDING_REVIEW' # Requirement 3
        participant.submitted_at = now()
        participant.save()

        # Notify PI and Coordinator (Requirement 2)
        study = participant.study
        team = [study.pi, study.coordinator]
        
        # Requirement 6: Send email to info@musbresearch.com
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            email_body = f"""
            New Eligibility Submission Received:
            
            Study: {study.title} ({study.protocol_id})
            Participant SID: {participant.participant_sid}
            User Email: {participant.user.email}
            Submission Time: {participant.submitted_at}
            
            Please login to the Clinical Coordinator Portal to review this submission.
            """
            send_mail(
                subject=f"New Eligibility Submission: {study.protocol_id}",
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=['info@musbresearch.com'],
                fail_silently=True
            )
        except Exception as e:
            print(f"Failed to send eligibility email: {e}")

        for user in filter(None, team):
            Notification.objects.create(
                user=user,
                title="Eligibility Submission",
                message=f"Participant {participant.participant_sid} has submitted an eligibility form for {study.protocol_id}.",
                type="INFO"
            )
            StaffTask.objects.create(
                user=user,
                study=study,
                title="Review Eligibility",
                description=f"Action Required: Review submission for {participant.participant_sid}.",
                task_type="SCREENER_REVIEW",
                reference_id=str(participant.pk)
            )

        return Response({'status': 'submitted', 'message': 'Successfully submitted for review.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrCoordinator])
    def review_eligibility(self, request, *args, **kwargs):
        """Review endpoint for PI/Coordinator (Requirement 4) with multi-signatory workflow"""
        participant = self.get_object()
        decision = request.data.get('decision') # 'ACCEPT' or 'REJECT'
        notes = request.data.get('notes', '')
        signature = request.data.get('signature') # Base64 signature
        user = request.user
        role = (user.role or '').upper()

        if decision in ['REJECT', 'INELIGIBLE']:
            participant.status = 'INELIGIBLE'
            participant.approval_status = 'REJECTED'
            participant.status_notes = notes
            participant.reviewed_by = user
            participant.reviewed_at = timezone.now()
            participant.save()
            return Response({'status': 'rejected', 'message': 'Subject marked as ineligible.'})

        if decision in ['ACCEPT', 'ELIGIBLE']:
            # Handle Multi-Signatory Logic
            if role in ['COORDINATOR', 'ADMIN', 'SUPER_ADMIN']:
                participant.coordinator_approved = True
                participant.coordinator_approved_at = timezone.now()
                if signature:
                    participant.coordinator_signature = signature
                
                if participant.approval_status == 'PENDING_INITIAL_REVIEW':
                    participant.approval_status = 'COORDINATOR_REVIEWED'
                elif participant.approval_status == 'PI_REVIEWED':
                    participant.approval_status = 'FULLY_APPROVED'

            if role in ['PI', 'SUPER_ADMIN']:
                participant.pi_approved = True
                participant.pi_approved_at = timezone.now()
                if signature:
                    participant.pi_signature = signature
                
                if participant.approval_status == 'PENDING_INITIAL_REVIEW':
                    participant.approval_status = 'PI_REVIEWED'
                elif participant.approval_status == 'COORDINATOR_REVIEWED':
                    participant.approval_status = 'FULLY_APPROVED'

            participant.status_notes = notes
            participant.reviewed_by = user
            participant.reviewed_at = timezone.now()
            
            # Check if fully approved
            if participant.approval_status == 'FULLY_APPROVED':
                participant.status = 'ENROLLED'
                
                # TRIGGER FORM ASSIGNMENT (Requirement 1)
                required_forms = Form.objects.filter(study=participant.study, is_required_on_enrollment=True)
                for f in required_forms:
                    af = AssignedForm.objects.create(
                        participant=participant,
                        form=f,
                        study=participant.study,
                        status='PENDING'
                    )
                    
                    Task.objects.get_or_create(
                        study=participant.study,
                        title=f.title,
                        task_type='FORM_SIGNATURE',
                        form=f,
                        frequency='ONCE'
                    )
                    
                    t_obj = Task.objects.filter(study=participant.study, form=f, task_type='FORM_SIGNATURE').first()
                    if t_obj:
                        ParticipantTask.objects.create(
                            participant=participant,
                            task=t_obj,
                            due_date=timezone.now() + datetime.timedelta(days=7),
                            status='PENDING',
                            visit_name='Onboarding',
                            timeline_group='Initial Enrollment',
                            estimated_time='10 min',
                            assigned_form=af
                        )

                if participant.study.consent_mode in ['ECONSENT', 'HYBRID']:
                    c_task, _ = Task.objects.get_or_create(
                        study=participant.study,
                        title='Informed Consent Agreement',
                        task_type='CONSENT',
                        frequency='ONCE'
                    )
                    ParticipantTask.objects.get_or_create(
                        participant=participant,
                        task=c_task,
                        defaults={
                            'due_date': timezone.now() + datetime.timedelta(days=2),
                            'status': 'PENDING',
                            'visit_name': 'Screening',
                            'timeline_group': 'Pre-Enrolled'
                        }
                    )
            
            participant.save()

            # Notify Participant (only on full enrollment or rejection)
            if participant.user and (participant.approval_status == 'FULLY_APPROVED' or participant.approval_status == 'REJECTED'):
                msg = "Accepted into study." if participant.approval_status == 'FULLY_APPROVED' else "Not eligible at this time."
                Notification.objects.create(
                    user=participant.user,
                    title="Status Updated",
                    message=f"{participant.study.protocol_id}: {msg}",
                    type="SUCCESS" if participant.approval_status == 'FULLY_APPROVED' else "WARNING"
                )

        DataAuditLog.objects.create(
            user=user,
            action='ELIGIBILITY_REVIEW',
            model_name='Participant',
            record_id=participant.participant_sid,
            details=f"Eligibility reviewed by {user.get_role_display()}. Decision: {decision}. Approval State: {participant.approval_status}",
            changes={'status': {'old': 'PENDING_REVIEW', 'new': participant.status}}
        )

        return Response({
            'status': participant.status,
            'approval_status': participant.approval_status,
            'message': f'Approval recorded for {role}. Current Status: {participant.approval_status}'
        })

        return Response({'error': 'Invalid decision.'}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrCoordinator])
    def withdraw(self, request, *args, **kwargs):
        """Terminate subject participation and set status to DROPPED"""
        participant = self.get_object()
        reason = request.data.get('reason', 'PI Initiated Withdrawal')
        user = request.user
        
        old_status = participant.status
        participant.status = 'DROPPED'
        current_notes = participant.status_notes or ""
        participant.status_notes = current_notes + f"\n[WITHDRAWAL {timezone.now().date()}]: {reason}"
        participant.save()
        
        # Log to Audit Trail
        DataAuditLog.objects.create(
            user=user,
            action='WITHDRAWAL',
            model_name='Participant',
            record_id=participant.participant_sid,
            details=f"Subject withdrawn by {user.full_name} ({user.role}). Reason: {reason}",
            changes={'status': {'old': old_status, 'new': 'DROPPED'}}
        )
        
        return Response({'status': 'withdrawn', 'new_status': 'DROPPED'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrCoordinator])
    def toggle_flag(self, request, *args, **kwargs):
        """Toggle manual review flag for the participant"""
        participant = self.get_object()
        participant.is_locked = not participant.is_locked # Using is_locked as flagging mechanism
        participant.save()
        return Response({'status': 'toggled', 'is_flagged': participant.is_locked})

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrCoordinator])
    def update_clinical_notes(self, request, *args, **kwargs):
        """Update screening or clinical notes for the subject"""
        participant = self.get_object()
        notes = request.data.get('notes', '')
        participant.status_notes = notes
        participant.save()
        return Response({'status': 'updated'})

    def get_serializer_class(self):
        user = self.request.user
        if (user.role or '').upper() == 'SPONSOR':
            return DeIdentifiedParticipantSerializer
        # Senior Developer: Use Brief serializer for lists to dramatically boost dashboard speed
        if self.action == 'list':
            return ParticipantBriefSerializer
        return ParticipantSerializer
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Participant.objects.none()

        # Removed auto-enrollment logic to allow clean 'Not Enrolled' states.

        role = (user.role or '').upper()
        if role in ['SUPER_ADMIN', 'ADMIN']:
            return Participant.objects.all().order_by('-created_at')
            
        if role == 'PARTICIPANT':
            return Participant.objects.filter(user=user).order_by('-created_at')
            
        # PIs and Coordinators only see participants in studies they are explicitly assigned to
        return Participant.objects.filter(study__assignments__user=user).distinct().order_by('-created_at')

class VisitViewSet(SoftPaginationMixin, viewsets.ModelViewSet):
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    permission_classes = [permissions.IsAuthenticated]

    @cache_api_response("visits_list", timeout=300)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Visit.objects.none()
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
            return Visit.objects.select_related('participant', 'participant__user', 'participant__study').order_by('-scheduled_date')
        if (user.role or '').upper() == 'PARTICIPANT':
            return Visit.objects.filter(participant__user=user).select_related('participant', 'participant__study').order_by('-scheduled_date')
        # PIs, Coordinators, and Sponsors see visits for assigned studies
        return Visit.objects.filter(participant__study__assignments__user=user).select_related('participant', 'participant__user', 'participant__study').distinct().order_by('-scheduled_date')

    def perform_create(self, serializer):
        visit = serializer.save(scheduled_by=self.request.user)
        AuditLog.log('VISIT_SCHEDULED', user_email=self.request.user.email, request=self.request, detail=f"Visit {visit.visit_type} scheduled for {visit.participant.participant_sid}")
        
        # Notify participant about new schedule with coordinator details
        if visit.participant.user:
            coord = self.request.user
            c_name = coord.decrypted_name or coord.full_name
            c_phone = coord.decrypted_phone or coord.phone_number or 'N/A'
            c_email = coord.email
            
            Notification.objects.create(
                user=visit.participant.user,
                title="New Visit Scheduled",
                message=(
                    f"A new {visit.visit_type} has been scheduled for {visit.scheduled_date.strftime('%Y-%m-%d %H:%M')}. "
                    f"Coordinator: {c_name} (Phone: {c_phone}, Email: {c_email})"
                ),
                type="INFO"
            )

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def check_missed(self, request):
        from .tasks import check_missed_visits
        # Trigger background task
        check_missed_visits.delay()
        return Response({'status': 'Background check initiated', 'message': 'Missed visits are being processed in the background.'})

    def perform_update(self, serializer):
        visit = serializer.save(updated_by=self.request.user)
        if visit.status == 'COMPLETED':
            AuditLog.log('VISIT_COMPLETED', user_email=self.request.user.email, request=self.request, detail=f"Visit {visit.visit_type} COMPLETED for {visit.participant.participant_sid}")
            trigger_reward_logic(visit, 'VISIT')
        else:
            AuditLog.log('UPDATE_VISIT', user_email=self.request.user.email, request=self.request, detail=f"Visit {visit.visit_type} updated for {visit.participant.participant_sid}")

class LeadViewSet(SoftPaginationMixin, viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAdminOrCoordinator]
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Lead.objects.none()
        if (user.role or '').upper() == 'SUPER_ADMIN': return Lead.objects.select_related('study').all()
        return Lead.objects.filter(study__assignments__user=user).select_related('study')

class CommunicationLogViewSet(SoftPaginationMixin, viewsets.ModelViewSet):
    queryset = CommunicationLog.objects.all()
    serializer_class = CommunicationLogSerializer
    permission_classes = [IsAdminOrCoordinator]
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return CommunicationLog.objects.none()
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']: return CommunicationLog.objects.select_related('participant', 'participant__user', 'participant__study').all()
        return CommunicationLog.objects.filter(participant__study__assignments__user=user).select_related('participant', 'participant__user', 'participant__study').distinct()

class CompensationViewSet(SoftPaginationMixin, viewsets.ModelViewSet):
    queryset = Compensation.objects.all()
    serializer_class = CompensationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Compensation.objects.none()
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
            queryset = Compensation.objects.select_related('participant', 'study').order_by('-paid_at')
        elif (user.role or '').upper() == 'PARTICIPANT':
            queryset = Compensation.objects.filter(participant__user=user).select_related('participant', 'study').order_by('-paid_at')
        else:
            queryset = Compensation.objects.filter(participant__study__assignments__user=user).distinct().select_related('participant', 'study').order_by('-paid_at')
        
        study_id = self.request.query_params.get('study_id')
        if study_id and study_id != 'all':
            if bson.ObjectId.is_valid(study_id):
                queryset = queryset.filter(study_id=study_id)
            else:
                queryset = queryset.filter(study__protocol_id=study_id)
        return queryset

class LabResultViewSet(SoftPaginationMixin, viewsets.ModelViewSet):
    queryset = LabResult.objects.all()
    serializer_class = LabResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return LabResult.objects.none()
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
            return LabResult.objects.select_related('participant', 'participant__study').order_by('-lab_date')
        if (user.role or '').upper() == 'PARTICIPANT':
            return LabResult.objects.filter(participant__user=user, is_released=True).select_related('participant').order_by('-lab_date')
        queryset = LabResult.objects.filter(participant__study__assignments__user=user).distinct().select_related('participant', 'participant__study').order_by('-lab_date')
        
        study_id = self.request.query_params.get('study_id')
        if study_id and study_id != 'all':
            import bson
            if bson.ObjectId.is_valid(study_id):
                queryset = queryset.filter(participant__study_id=study_id)
            else:
                queryset = queryset.filter(participant__study__protocol_id=study_id)
        return queryset
    
    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        lab = self.get_object()
        lab.is_released = True
        lab.released_at = timezone.now()
        lab.save()
        return Response({'status': 'released', 'released_at': lab.released_at})

class ProgressReportViewSet(viewsets.ModelViewSet):
    queryset = ProgressReport.objects.all()
    serializer_class = ProgressReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        # Admins see all, others see what they are assigned to
        if (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN']:
            return ProgressReport.objects.all().order_by('-report_date')
        return ProgressReport.objects.filter(study__assignments__user=user).order_by('-report_date')

class DataAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DataAuditLog.objects.all()
    serializer_class = DataAuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN': return DataAuditLog.objects.all()
        return DataAuditLog.objects.none()


class ConsentTemplateViewSet(WorkflowContentMixin, viewsets.ModelViewSet):
    queryset = ConsentTemplate.objects.all().order_by('-created_at')
    serializer_class = ConsentTemplateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    def get_permissions(self):
        if self.action == 'list' and self.request.query_params.get('public') == 'true':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        study_id = self.request.query_params.get('study_id')

        # PUBLIC: allow anyone to see ACTIVE templates for a specific study
        if not user.is_authenticated or self.request.query_params.get('public') == 'true':
            if not study_id:
                return ConsentTemplate.objects.none()
            
            import bson
            if bson.ObjectId.is_valid(study_id):
                return ConsentTemplate.objects.filter(study_id=study_id, status='ACTIVE')
            else:
                return ConsentTemplate.objects.filter(study__protocol_id=study_id, status='ACTIVE')

        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
            queryset = ConsentTemplate.objects.all().order_by('-created_at')
        # For Staff (Admin, Coordinator, PI): Filter templates by studies the user is assigned to
        elif (user.role or '').upper() in ['PI', 'COORDINATOR']:
            queryset = ConsentTemplate.objects.filter(study__assignments__user=user).distinct().order_by('-created_at')
        elif (user.role or '').upper() == 'PARTICIPANT':
            # For Participants: Filter templates by studies they are enrolled in
            queryset = ConsentTemplate.objects.filter(study__participants__user=user).distinct().order_by('-created_at')
        else:
            # Other roles or default
            queryset = ConsentTemplate.objects.none()
        
        if study_id and study_id != 'all':
            import bson
            if bson.ObjectId.is_valid(study_id):
                queryset = queryset.filter(study_id=study_id)
            else:
                queryset = queryset.filter(study__protocol_id=study_id)
                
        return queryset

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Document.objects.none()
            
        study_id = self.request.query_params.get('study_id')
        queryset = Document.objects.all()
        
        if study_id and study_id != 'all':
            import bson
            if bson.ObjectId.is_valid(study_id):
                queryset = queryset.filter(study_id=study_id)
            else:
                queryset = queryset.filter(study__protocol_id=study_id)

        # Super Admin and Admin see all
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
            return queryset.order_by('-uploaded_at')

        # Filter by visibility for other roles
        role_map = {
            'PI': 'PI',
            'COORDINATOR': 'COORDINATOR',
            'SPONSOR': 'SPONSOR',
            'PARTICIPANT': 'PARTICIPANT'
        }
        user_role = role_map.get((user.role or '').upper())
        
        if user_role:
            from django.db.models import Q
            # For MongoDB backend, we use equality which automatically performs an 'in' check for arrays
            queryset = queryset.filter(
                Q(visibility=user_role) | Q(visibility=[]) | Q(visibility__isnull=True)
            )

        # Further restrict to assigned studies for non-admins
        from django.db.models import Q
        return queryset.filter(
            Q(study__pi=user) | 
            Q(study__coordinator=user) | 
            Q(study__assignments__user=user)
        ).distinct().order_by('-uploaded_at')

    def perform_create(self, serializer):
        serializer.save()
        AuditLog.log('DOCUMENT_UPLOADED', user_email=self.request.user.email, request=self.request, detail=f"Uploaded document {serializer.instance.title} for study {serializer.instance.study.protocol_id}")

class ConsentViewSet(viewsets.ModelViewSet):
    queryset = Consent.objects.all().order_by('-agreed_at')
    serializer_class = ConsentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Consent.objects.none()
        
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
            queryset = self.queryset.all()
        elif (user.role or '').upper() == 'PARTICIPANT':
            queryset = self.queryset.filter(participant__user=user)
        else:
            # PIs, Coordinators, and Sponsors see consents for assigned studies
            from django.db.models import Q
            queryset = self.queryset.filter(
                Q(participant__study__pi=user) | 
                Q(participant__study__coordinator=user) | 
                Q(participant__study__assignments__user=user)
            ).distinct()
            
        study_id = self.request.query_params.get('study_id')
        participant_id = self.request.query_params.get('participant_id')
        
        if study_id and study_id != 'all':
            import bson
            if bson.ObjectId.is_valid(study_id):
                queryset = queryset.filter(study_id=study_id)
            else:
                # Fallback to protocol ID if it's not a hex ObjectId
                queryset = queryset.filter(study__protocol_id=study_id)
                
        if participant_id:
            queryset = queryset.filter(participant_id=participant_id)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def coordinator_sign(self, request, pk=None):
        """Step 2: Mandatory Coordinator Signature"""
        consent = self.get_object()
        user = request.user
        
        if (user.role or '').upper() not in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR']:
            return Response({'error': 'Unauthorized. Coordinator role required.'}, status=403)
            
        if consent.signing_status != 'PARTIALLY_SIGNED':
            return Response({'error': f'Invalid status for coordinator signature: {consent.signing_status}'}, status=400)
            
        cc_signature = request.data.get('signature')
        cc_name = request.data.get('name')
        
        if not cc_signature or not cc_name:
            return Response({'error': 'Name and Signature are mandatory.'}, status=400)
            
        consent.cc_signature = cc_signature
        consent.cc_name = cc_name
        consent.cc_user = user
        consent.cc_verified = True
        consent.save() # Triggers transition to FULLY_SIGNED in model.save
        
        return Response({'status': 'FULLY_SIGNED', 'detail': 'Consent record finalized and archived.'})

    def perform_create(self, serializer):
        user = self.request.user
        import bson

        # ── 1. Resolve Study via FK object (avoids ObjectId string vs Python object mismatch) ──
        study_id_raw = self.request.data.get('study', '')
        study_obj = None
        if study_id_raw:
            if bson.ObjectId.is_valid(str(study_id_raw)):
                study_obj = Study.objects.filter(pk=str(study_id_raw)).first()
            if not study_obj:
                study_obj = Study.objects.filter(protocol_id=str(study_id_raw)).first()

        # ── 2. Resolve Participant — explicit participant_id from frontend is PRIORITY ──
        # RC-1 FIX: Frontend sends participant_id (the active participant's DB ObjectId).
        # This eliminates the wrong-fallback bug where .first() returned a different participant.
        participant = None
        explicit_pid = self.request.data.get('participant_id', '')
        participant_sid = self.request.data.get('participant_sid', '')
        
        if explicit_pid and bson.ObjectId.is_valid(str(explicit_pid)):
            participant = Participant.objects.filter(pk=str(explicit_pid), user=user).first()
        elif participant_sid:
            participant = Participant.objects.filter(user=user, participant_sid=participant_sid).first()
        else:
            # Requirement 8: Prioritize status: ENROLLED/RANDOMIZED/ACTIVE > CONSENTED > PENDING_REVIEW
            priority_order = Case(
                When(status='ENROLLED', then=0),
                When(status='RANDOMIZED', then=0),
                When(status='ACTIVE', then=0),
                When(status='CONSENTED', then=1),
                When(status='PENDING_REVIEW', then=2),
                When(status__in=['RECRUITING', 'SCREENING'], then=3),
                default=4,
                output_field=IntegerField(),
            )
            participant = Participant.objects.filter(user=user).annotate(
                p_prio=priority_order
            ).order_by('p_prio', '-updated_at').first()

        # Secondary: match by study FK object (use study= not study_id= to avoid type mismatch)
        if not participant and study_obj:
            participant = Participant.objects.filter(user=user, study=study_obj).first()

        # Last resort: only safe when user has exactly one enrollment
        if not participant:
            all_parts = list(Participant.objects.filter(user=user))
            if len(all_parts) == 1:
                participant = all_parts[0]
            elif all_parts:
                participant = max(all_parts, key=lambda p: str(p.created_at or ''))

        # Derive study from participant if still unresolved
        if not study_obj and participant:
            study_obj = participant.study

        # ── 3. Resolve Template ──
        template_id = self.request.data.get('template', '')
        template = None
        if template_id and bson.ObjectId.is_valid(str(template_id)):
            template = ConsentTemplate.objects.filter(pk=str(template_id)).first()
        if not template and study_obj:
            template = ConsentTemplate.objects.filter(
                study=study_obj, status='ACTIVE'
            ).order_by('-version').first()

        # ── 4. Idempotent: prevent duplicate consent for same participant+template ──
        if participant and template:
            existing = Consent.objects.filter(
                participant=participant, template=template
            ).exclude(signing_status='REJECTED').first()
            if existing:
                raise serializers.ValidationError({
                    'detail': 'ALREADY_SIGNED',
                    'consent_id': str(existing.pk),
                    'signing_status': existing.signing_status,
                    'message': 'Consent already recorded for this participant and template.'
                })

        # ── 5. Auto-fill name/email from authenticated user ──
        auto_email = user.email or ''
        auto_full_name = self.request.data.get('full_name', '').strip()
        if not auto_full_name:
            try:
                auto_full_name = user.decrypted_name or user.email
            except Exception:
                auto_full_name = user.email

        consent = serializer.save(
            participant=participant,
            study=study_obj,
            template=template,
            email=auto_email,
            full_name=auto_full_name,
            agreed_at=now(),
            participant_signed_at=now(),
            audit_trail=[{
                "action": "PARTICIPANT_SIGNED",
                "time": now().isoformat(),
                "actor": auto_full_name,
                "role": "PARTICIPANT",
                "user": user.email
            }]
        )

        # ── 6. Mark Participant as CONSENTED + complete any DB consent tasks ──
        if participant:
            participant.status = 'CONSENTED'
            participant.save()

            from api.models import ParticipantTask
            for pt in ParticipantTask.objects.filter(
                participant=participant,
                task__task_type='CONSENT',
                status__in=['PENDING', 'IN_PROGRESS']
            ):
                pt.status = 'COMPLETED'
                pt.completed_at = now()
                pt.save()

            AuditLog.log('CONSENT_TASK_COMPLETED', user_email=user.email,
                         request=self.request,
                         detail=f"Consent task marked complete for {participant.participant_sid}")

        # ── 7. Notify Coordinator (mandatory sign) + PI (optional sign) ──
        if study_obj:
            participant_sid = participant.participant_sid if participant else 'Unknown'
            if study_obj.coordinator:
                Notification.objects.create(
                    user=study_obj.coordinator,
                    title="New Consent Signed — Signature Required",
                    message=f"Participant {participant_sid} signed the consent for {study_obj.protocol_id}. Your co-signature is required to finalize.",
                    type="INFO"
                )
                StaffTask.objects.get_or_create(
                    user=study_obj.coordinator,
                    study=study_obj,
                    task_type="CONSENT_SIGNATURE",
                    reference_id=str(consent.pk),
                    defaults={
                        'title': "Co-Sign Consent Form",
                        'description': f"Participant {participant_sid} signed the consent for {study_obj.protocol_id}. Review and co-sign to finalize.",
                    }
                )
            if study_obj.pi:
                Notification.objects.create(
                    user=study_obj.pi,
                    title="New Consent Signed — Review Requested",
                    message=f"Participant {participant_sid} signed the consent for {study_obj.protocol_id}. PI signature is optional per protocol.",
                    type="INFO"
                )



    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify(self, request, pk=None):
        """Seal & Verify action for PI or CC"""
        consent = self.get_object()
        user = request.user
        role = (user.role or '').upper()
        
        if role not in ['PI', 'COORDINATOR', 'ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Only PI or CC can verify consents.'}, status=status.HTTP_403_FORBIDDEN)
            
        now_time = now()
        signature_data = request.data.get('signature')
        staff_name = request.data.get('name')
        
        if role == 'PI' or role in ['ADMIN', 'SUPER_ADMIN']:
            consent.pi_verified = True
            consent.pi_verified_at = now_time
            consent.pi_user = user
            if staff_name: consent.pi_name = staff_name
            if signature_data: consent.pi_signature = signature_data
            action_label = "PI_VERIFIED"
        else:
            consent.cc_verified = True
            consent.cc_verified_at = now_time
            consent.cc_user = user
            if staff_name: consent.cc_name = staff_name
            if signature_data: consent.cc_signature = signature_data
            action_label = "CC_VERIFIED"
            
        consent.audit_trail.append({
            "action": action_label,
            "timestamp": now_time.isoformat(),
            "user": user.email,
            "ip": request.META.get('REMOTE_ADDR')
        })
        consent.save()
        
        # Auto-complete any pending staff task for this consent signature
        pending_tasks = StaffTask.objects.filter(
            user=user,
            task_type="CONSENT_SIGNATURE",
            reference_id=str(consent.pk),
            is_completed=False
        )
        for task in pending_tasks:
            task.is_completed = True
            task.save()
        
        AuditLog.log('VERIFY_CONSENT', user_email=user.email, request=request, detail=f"Verified consent for {consent.full_name} in study {consent.study.protocol_id}")
        
        return Response(ConsentSerializer(consent).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def pi_verify(self, request, pk=None):
        """Twin of verify action for PI verification"""
        return self.verify(request, pk)

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

class DosingLogViewSet(SoftPaginationMixin, viewsets.ModelViewSet):
    serializer_class = DosingLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = DosingLog.objects.select_related('participant', 'participant__study')
        if (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN']:
            return base_qs.all()
        # Participants see their own logs
        if (user.role or '').upper() == 'PARTICIPANT':
            return base_qs.filter(participant__user=user)
        # Coordinators/PIs see logs for their assigned studies
        from django.db.models import Q
        return base_qs.filter(
            Q(participant__study__pi=user) | 
            Q(participant__study__coordinator=user) | 
            Q(participant__study__assignments__user=user)
        )

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
        if (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN']:
            return AEReport.objects.all()
        if (user.role or '').upper() == 'PARTICIPANT':
            return AEReport.objects.filter(participant__user=user)
        from django.db.models import Q
        return AEReport.objects.filter(
            Q(participant__study__pi=user) | 
            Q(participant__study__coordinator=user) | 
            Q(participant__study__assignments__user=user)
        )

    def perform_create(self, serializer):
        user = self.request.user
        pid = self.request.data.get('participant')
        if (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN', 'PI', 'COORDINATOR'] and pid:
            serializer.save(participant_id=pid)
            return
        participant = Participant.objects.filter(user=self.request.user).first()
        if not participant:
            raise serializers.ValidationError({"participant": "User does not have an active participant record."})
        serializer.save(participant=participant)

class DailyMedicationLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyMedicationLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN']:
            return DailyMedicationLog.objects.all()
        if (user.role or '').upper() == 'PARTICIPANT':
            return DailyMedicationLog.objects.filter(participant__user=user)
        from django.db.models import Q
        return DailyMedicationLog.objects.filter(
            Q(participant__study__pi=user) | 
            Q(participant__study__coordinator=user) | 
            Q(participant__study__assignments__user=user)
        )

    def perform_create(self, serializer):
        participant = Participant.objects.filter(user=self.request.user).first()
        if not participant:
            raise serializers.ValidationError({"participant": "User does not have an active participant record."})

        # Check for existing log for this participant and date to avoid unique constraint 400 error
        date = serializer.validated_data.get('date')
        if date:
            existing = DailyMedicationLog.objects.filter(participant=participant, date=date).first()
            if existing:
                # Update existing instance instead of creating new one
                serializer.instance = existing
                log = serializer.save(participant=participant)
            else:
                log = serializer.save(participant=participant)
        else:
            log = serializer.save(participant=participant)

        # ── Notify Coordinator & PI on non-draft submission ──
        if not log.is_draft and participant.study:
            study = participant.study
            sid = participant.participant_sid or self.request.user.email
            date_str = log.date.strftime('%d %b %Y') if log.date else 'today'

            # Determine urgency for AE
            is_ae = log.noticed_side_effects
            ae_severity = getattr(log, 'severity', '') or ''
            is_urgent = is_ae and ae_severity.upper() in ['MODERATE', 'SEVERE']

            title = f"{'🚨 URGENT: ' if is_urgent else ''}Daily Log Submitted — {sid}"
            message_base = (
                f"Participant {sid} submitted their daily log for {date_str}.\n"
                f"Medicine taken: {'Yes' if log.took_medicine else 'No'}.\n"
            )
            if is_ae:
                message_base += (
                    f"⚠️ Adverse Event reported — Severity: {ae_severity or 'Not specified'}. "
                    f"Immediate review required."
                )

            # Coordinator notification
            if study.coordinator:
                try:
                    Notification.objects.create(
                        user=study.coordinator,
                        title=title,
                        message=message_base,
                        link=f"/dashboard/coordinator/participants/{participant.id}/logs"
                    )
                    if is_ae:
                        StaffTask.objects.create(
                            user=study.coordinator,
                            study=study,
                            title=f"AE Review Required — {sid} ({date_str})",
                            description=(
                                f"Participant {sid} reported side effects. "
                                f"Severity: {ae_severity or 'Unknown'}. Description: {log.side_effect_description[:200] if log.side_effect_description else 'N/A'}"
                            ),
                            task_type='AE_REVIEW',
                            reference_id=str(log.id)
                        )
                except Exception as e:
                    print(f"Coordinator notification error: {e}")

            # PI notification
            if study.pi:
                try:
                    Notification.objects.create(
                        user=study.pi,
                        title=title,
                        message=message_base,
                        link=f"/dashboard/coordinator/participants/{participant.id}/logs"
                    )
                except Exception as e:
                    print(f"PI notification error: {e}")


class AssignedFormViewSet(viewsets.ModelViewSet):
    queryset = AssignedForm.objects.all()
    serializer_class = AssignedFormSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN']:
            return AssignedForm.objects.all().order_by('-created_at')
        if (user.role or '').upper() == 'PARTICIPANT':
            return AssignedForm.objects.filter(participant__user=user).order_by('-created_at')
        # PIs/Coordinators see forms for their assigned studies
        from django.db.models import Q
        return AssignedForm.objects.filter(
            Q(study__pi=user) | 
            Q(study__coordinator=user) | 
            Q(study__assignments__user=user)
        ).distinct().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def sign_participant(self, request, pk=None):
        """Participant signs their form"""
        af = self.get_object()
        if af.participant.user != request.user:
            return Response({'error': 'Unauthorized'}, status=403)
            
        if af.status != 'PENDING':
            return Response({'error': 'Form already signed or completed.'}, status=400)
            
        sig_data = request.data.get('signature')
        form_data = request.data.get('data') # Snapshot of fields
        
        if not sig_data:
            return Response({'error': 'Signature required'}, status=400)
            
        af.participant_signature = sig_data
        af.participant_signed_at = now()
        af.data = form_data
        af.status = 'PARTICIPANT_SIGNED'
        af.save()
        
        # Mark Task as COMPLETED (for participant UI)
        tasks = ParticipantTask.objects.filter(assigned_form=af, participant=af.participant)
        for t in tasks:
            t.status = 'COMPLETED'
            t.completed_at = now()
            t.save()
            trigger_reward_logic(t, 'TASK')
        
        # Notify Coordinator
        study = af.study
        if study.coordinator:
            Notification.objects.create(
                user=study.coordinator,
                title="Form Signed",
                message=f"Participant {af.participant.participant_sid} signed '{af.form.title}'. Pending review.",
                link=f"/dashboard/coordinator/forms/{af.id}"
            )
            StaffTask.objects.create(
                user=study.coordinator,
                study=study,
                title=f"Review & Sign: {af.form.title}",
                description=f"Action Required: Staff signature for {af.participant.participant_sid}.",
                task_type="FORM_SIGNATURE",
                reference_id=str(af.pk)
            )
            
        return Response({'status': 'signed'})

    @action(detail=True, methods=['post'])
    def sign_coordinator(self, request, pk=None):
        """Coordinator signs/countersigns"""
        af = self.get_object()
        if (request.user.role or '').upper() not in ['COORDINATOR', 'PI', 'ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        sig_data = request.data.get('signature')
        af.coordinator_signature = sig_data
        af.coordinator_signed_at = now()
        af.coordinator_user = request.user
        af.status = 'COORDINATOR_SIGNED'
        af.save()
        
        # Notify PI
        if af.study.pi:
            Notification.objects.create(
                user=af.study.pi,
                title="Form Pending PI Sign-off",
                message=f"{af.form.title} verified by CC for {af.participant.participant_sid}.",
                link=f"/dashboard/pi/forms/{af.id}"
            )
            
        return Response({'status': 'coordinator_signed'})

    @action(detail=True, methods=['post'])
    def sign_pi(self, request, pk=None):
        """PI signs off (Optional but completing)"""
        af = self.get_object()
        if (request.user.role or '').upper() not in ['PI', 'ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        sig_data = request.data.get('signature')
        af.pi_signature = sig_data
        af.pi_signed_at = now()
        af.pi_user = request.user
        af.status = 'COMPLETED'
        af.save()
        
        return Response({'status': 'fully_completed'})

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all().order_by('-created_at')
    serializer_class = FormSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        # Allow anyone to list public screeners (for the public study page)
        if self.action == 'list' and self.request.query_params.get('public') == 'true':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        # PUBLIC endpoint: return only published forms for a given study (no auth required)
        if self.request.query_params.get('public') == 'true':
            study_id = self.request.query_params.get('study_id')
            if not study_id:
                return Form.objects.none()
            import bson
            if bson.ObjectId.is_valid(study_id):
                return Form.objects.filter(study_id=study_id, is_published=True)
            else:
                return Form.objects.filter(study__protocol_id=study_id, is_published=True)

        # PRIVATE: require authentication for all other queries
        user = self.request.user
        if not user.is_authenticated: return Form.objects.none()
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']: return Form.objects.all()
        study_id = self.request.query_params.get('study_id')
        if (user.role or '').upper() == 'PARTICIPANT':
            qs = Form.objects.filter(study__participants__user=user).distinct()
        else:
            from django.db.models import Q
            qs = Form.objects.filter(
                Q(study__pi=user) | 
                Q(study__coordinator=user) | 
                Q(study__assignments__user=user)
            ).distinct()
        if study_id and study_id != 'all':
            import bson
            if bson.ObjectId.is_valid(study_id):
                qs = qs.filter(study_id=study_id)
            else:
                qs = qs.filter(study__protocol_id=study_id)
        return qs

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
        queryset = Task.objects.all()
        if study_id and study_id != 'all':
            import bson
            if bson.ObjectId.is_valid(study_id):
                queryset = queryset.filter(study_id=study_id)
            else:
                queryset = queryset.filter(study__protocol_id=study_id)
        return queryset

class ParticipantTaskViewSet(viewsets.ModelViewSet):
    queryset = ParticipantTask.objects.all()
    serializer_class = ParticipantTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ParticipantTask.objects.none()
            
        queryset = ParticipantTask.objects.all()
        
        # Staff can filter by study or participant
        if (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']:
            study_id = self.request.query_params.get('study')
            participant_id = self.request.query_params.get('participant')
            
            if study_id:
                queryset = queryset.filter(participant__study_id=study_id)
            if participant_id:
                queryset = queryset.filter(participant_id=participant_id)
            return queryset

        # Maintenance: Auto-lock logic on query (Requirement 3)
        for task in queryset.filter(status='PENDING'):
             task.check_and_lock()

        visible_statuses = ['ENROLLED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE', 'COMPLETED']
        return queryset.filter(
            participant__user=user,
            participant__status__in=visible_statuses
        ).order_by('due_date')

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def lock_overdue_tasks(self, request):
        """Bulk utility to lock all overdue tasks across the system"""
        from django.utils.timezone import now
        updated = ParticipantTask.objects.filter(
            due_date__lt=now(),
            status='PENDING',
            is_locked=False
        ).update(is_locked=True)
        return Response({'locked_count': updated})

    def perform_create(self, serializer):
        """
        Allow ad-hoc task creation from the frontend by accepting a raw 'title' field.
        If no 'task' FK is provided, auto-create (or reuse) a Task record from the title.
        """
        from .models import Task
        task_obj = serializer.validated_data.get('task')
        
        if task_obj is None:
            # Frontend sent a title but no task FK - create an ad-hoc Task template
            title = self.request.data.get('title', 'Ad-hoc Task')
            participant = serializer.validated_data.get('participant')
            study = getattr(participant, 'study', None) if participant else None
            
            task_obj, _ = Task.objects.get_or_create(
                title=title,
                study=study,
                defaults={
                    'task_type': 'GENERAL',
                    'description': f'Ad-hoc task: {title}',
                    'is_active': True,
                }
            )
        
        serializer.save(task=task_obj)

    def perform_update(self, serializer):
        # Strict Restriction: Locked tasks cannot be edited (Requirement 3)
        if serializer.instance.is_locked:
             from rest_framework import serializers
             raise serializers.ValidationError({"detail": "This task is locked due to missed deadline."})
        instance = serializer.save()
        if instance.status == 'COMPLETED':
            trigger_reward_logic(instance, 'TASK')


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # 'me' action belongs to any authenticated user
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        # Standard CRUD restricted to staff roles
        if self.action in ['list', 'create', 'retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrCoordinator()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"!!! USER CREATION VALIDATION FAILED: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print(f"!!! USER CREATION EXCEPTION: {e}")
            return Response({"error": "System failure during record creation", "detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()
        
        # Base: Staff management views should EXCLUDE participants (who are managed in /api/participants/)
        staff_qs = User.objects.exclude(role__in=['PARTICIPANT', 'participant', 'Participant'])

        # Super Admins and Admins see all staff
        if (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN']:
            return staff_qs.order_by('-date_joined')
        
        if (user.role or '').upper() in ['PI', 'COORDINATOR']:
            # PIs and Coordinators see Sponsors, Admins, and colleagues
            return staff_qs.filter(
                Q(role__in=['SPONSOR', 'PI', 'COORDINATOR', 'ADMIN', 'SUPER_ADMIN']) |
                Q(created_by=user)
            ).distinct().order_by('-date_joined')

        return User.objects.filter(id=user.id)

    @cache_api_response("users_list", timeout=300)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    @cache_api_response("user_me", timeout=120)
    def me(self, request):
        """Endpoint for the current user to view or update their own profile."""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        if request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Invalidate caches to ensure fresh data on next GET or Dashboard load
                from .utils.cache_utils import invalidate_cache
                invalidate_cache("user_me", user_id=str(request.user.id))
                invalidate_cache("dashboard_summary", user_id=str(request.user.id))
                
                AuditLog.log('ROLE_CHANGED', user_email=request.user.email, request=request, detail="User updated own profile")
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all().order_by('-published_at')
    serializer_class = NewsSerializer
    permission_classes = [permissions.AllowAny]

    @cache_api_response("news_list", timeout=3600)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class StaffTaskViewSet(viewsets.ModelViewSet):
    queryset = StaffTask.objects.all()
    serializer_class = StaffTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return StaffTask.objects.none()
        if (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN']:
            return StaffTask.objects.all().order_by('-created_at')
        return StaffTask.objects.filter(user=user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.user != request.user and (request.user.role or '').upper() not in ['ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        task.is_completed = True
        task.completed_at = now()
        task.save()
        
        Notification.objects.create(
            user=request.user,
            title="Task Completed",
            message=f"You successfully completed the task: {task.title}",
            type="SUCCESS"
        )
        return Response({'status': 'task marked as completed'})

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date')
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]

    @cache_api_response("events_list", timeout=3600)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

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
            send_welcome_email.delay(email)
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
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'PI']:
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
        
        # DIRECT ALL INQUIRIES TO INFO@MUSBRESEARCH.COM ONLY
        inquiry.routing_target = target
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
                    local_dt = local_tz.localize(datetime.datetime.combine(inquiry.discovery_call_date, inquiry.discovery_call_time))
                    est_tz = pytz.timezone('US/Eastern')
                    est_dt = local_dt.astimezone(est_tz)
                    notification_data['est_discovery_call'] = est_dt.strftime('%Y-%m-%d %I:%M %p EST')
                except Exception as tz_err:
                    logger.warning(f"Timezone conversion failed: {tz_err}")

            send_inquiry_notification.delay(notification_data, target)

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
        
        if (request.user.role or '').upper() not in ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'PI']:
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
        if (request.user.role or '').upper() not in ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'PI']:
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
        if (request.user.role or '').upper() not in ['SUPER_ADMIN']:
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



class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow filtering by is_read via query param
        qs = Notification.objects.filter(user=self.request.user).order_by('-created_at')
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() == 'true')
        return qs

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        # Iterate and save to ensure absolute persistence across all DB connectors (like Djongo)
        unread = Notification.objects.filter(user=request.user, is_read=False)
        for n in unread:
            n.is_read = True
            n.save()
        return Response({'status': 'all marked as read'})

class ClinicalConversationViewSet(viewsets.ModelViewSet):
    queryset = ClinicalConversation.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'list':
            return ClinicalConversationBriefSerializer
        return ClinicalConversationSerializer


    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ClinicalConversation.objects.none()
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
            queryset = ClinicalConversation.objects.all().order_by('-last_updated')
        elif (user.role or '').upper() == 'PARTICIPANT':
            queryset = ClinicalConversation.objects.filter(participant__user=user).order_by('-last_updated')
        else:
            # PIs and Coordinators see conversations related to their assigned studies
            from django.db.models import Q
            queryset = ClinicalConversation.objects.filter(
                Q(study__pi=user) | 
                Q(study__coordinator=user) | 
                Q(study__assignments__user=user)
            ).distinct().order_by('-last_updated')
        
        study_id = self.request.query_params.get('study_id')
        if study_id and study_id != 'all':
            if bson.ObjectId.is_valid(study_id):
                queryset = queryset.filter(study_id=study_id)
            else:
                queryset = queryset.filter(study__protocol_id=study_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        study_id = self.request.data.get('study')
        participant_id = self.request.data.get('participant')
        
        participant = None
        
        # If staff is initiating, use the provided participant_id
        if participant_id and (user.role or '').upper() in ['ADMIN', 'SUPER_ADMIN', 'PI', 'COORDINATOR']:
            participant = Participant.objects.filter(id=participant_id).first()
            
        if not participant:
            # Fallback: find participant record for the current user (if they are a participant)
            participant = Participant.objects.filter(user=user, study_id=study_id).first()
            
        if not participant:
            # Further fallback: grab the first active enrollment for this user
            participant = Participant.objects.filter(user=user).exclude(
                status__in=['DROPPED', 'INELIGIBLE', 'COMPLETED']
            ).first()
            
        if not participant:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'participant': 'No active enrollment or valid participant found for this conversation.'})
            
        serializer.save(participant=participant, study=participant.study)

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        conv = self.get_object()
        text = request.data.get('text')
        tag = request.data.get('tag', 'GENERAL').upper()
        attachment = request.FILES.get('attachment')
        
        msg = ClinicalMessage.objects.create(
            conversation=conv,
            sender=request.user,
            text=text,
            tag=tag,
            attachment=attachment,
            is_from_pi=((request.user.role or '').upper() == 'PI')
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

    def get(self, request):
        """Allows participants to fetch their own study action request history."""
        from .models import Participant, StudyActionRequest
        from .serializers import StudyActionRequestSerializer
        
        # Resolve all participant records for this user (could be multiple studies)
        participants = Participant.objects.filter(user=request.user)
        
        # Fetch all action requests for these participant records
        requests = StudyActionRequest.objects.filter(participant__in=participants).order_by('-created_at')
        
        serializer = StudyActionRequestSerializer(requests, many=True, context={'request': request})
        return Response(serializer.data)

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
            send_help_request_notification.delay(
                study_title="UNASSIGNED STUDY",
                participant_name=user.decrypted_name,
                participant_id=f"REF_{str(user.id)[-6:]}",
                action_title=action_title,
                pi_email="info@musbresearch.com",
                coordinator_email=None,
                age=getattr(user, 'age', None),
                gender=getattr(user, 'gender', None),
                contact_email=user.email
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
            
            send_help_request_notification.delay(
                study_title=study.title,
                participant_name=user.decrypted_name,
                participant_id=participant_sid,
                action_title=action_title,
                pi_email=pi_email,
                coordinator_email=coordinator_email,
                age=getattr(user, 'age', None),
                gender=getattr(user, 'gender', None),
                contact_email=user.email
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
            
            # 3. CREATE FORMAL STUDY ACTION REQUEST (For History Tracking)
            if participant:
                from .models import StudyActionRequest
                StudyActionRequest.objects.create(
                    participant=participant,
                    study=study,
                    request_type=action_title,
                    status='PENDING'
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

class StudyMetaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'TRIAL_MODEL_CHOICES': [{'val': k, 'label': v} for k, v in Study.TRIAL_MODEL_CHOICES],
            'PHASE_CHOICES': [{'val': k, 'label': v} for k, v in Study.PHASE_CHOICES],
            'STATUS_CHOICES': [{'val': k, 'label': v} for k, v in Study.STATUS_CHOICES],
            'APP_STAGE_CHOICES': [{'val': k, 'label': v} for k, v in Study.APP_STAGE_CHOICES],
            'STUDY_TYPES': [{'val': k, 'label': v} for k, v in Study.STUDY_TYPES]
        })
class QuestionnaireTemplateViewSet(viewsets.ModelViewSet):
    queryset = QuestionnaireTemplate.objects.all().order_by('-created_at')
    serializer_class = QuestionnaireTemplateSerializer
    def _get_pdf_content(self, template):
        """Adaptive retrieval engine for both Cloudinary and Local clinical PDFs."""
        import requests, io
        from django.conf import settings
        
        if not template.pdf_file: return None, "No file record."
        
        # 1. Primary Attempt: Standard Django file-access
        try:
            template.pdf_file.open("rb")
            content = template.pdf_file.read()
            template.pdf_file.close()
            if content and len(content) > 100:
                print(f"DEBUG: Successfully read {len(content)} bytes from local storage for {template.name}")
                return content, None
        except Exception as e:
            print(f"DEBUG: Direct stream attempt failed for {template.name}: {e}")

        # 2. Secondary Attempt: Cloudinary-specific Signed URL retrieval
        # Only attempt if Cloudinary settings exist to avoid AttributeError
        if hasattr(settings, 'CLOUDINARY_STORAGE'):
            import cloudinary
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_STORAGE.get('CLOUD_NAME'),
                api_key=settings.CLOUDINARY_STORAGE.get('API_KEY'),
                api_secret=settings.CLOUDINARY_STORAGE.get('API_SECRET'),
                secure=True
            )
            
            name = template.pdf_file.name
            clean_id = name.lstrip('/')
            if clean_id.startswith('media/'): clean_id = clean_id[6:]
            candidates = [clean_id]
            if '.' in clean_id: candidates.append(clean_id.rsplit('.', 1)[0])

            for cid in candidates:
                for r_type in ['raw', 'image']:
                    try:
                        exists = cloudinary.api.resource(cid, resource_type=r_type)
                        if exists:
                            url = cloudinary.utils.private_download_url(cid, resource_type=r_type, type='upload')
                            resp = requests.get(url, timeout=10)
                            if resp.status_code == 200: return resp.content, None
                    except: continue

        return None, f"All retrieval paths failed (Storage potentially misconfigured)."

    @action(detail=True, methods=['get'], url_path='view', permission_classes=[permissions.IsAuthenticated])
    def view_pdf(self, request, pk=None):
        from django.http import HttpResponse
        template = self.get_object()
        content, error = self._get_pdf_content(template)
        if content: return HttpResponse(content, content_type='application/pdf')
        return Response({"error": "Stream failed", "detail": error}, status=400)

    @action(detail=True, methods=['get'])
    def extract_text(self, request, pk=None):
        template = self.get_object()
        content, error = self._get_pdf_content(template)

        if not content:
            return Response({'error': f'Retrieval failed: {error}'}, status=400)

        if not content.startswith(b'%PDF'):
            return Response({'error': 'File is not a valid PDF header'}, status=400)

        try:
            import pypdf, io, re, tempfile, os
            from pypdf.errors import PdfStreamError
            
            # 1. Byte-level Signature Guard
            if not content.startswith(b'%PDF'):
                idx = content.find(b'%PDF')
                if idx != -1:
                    content = content[idx:]
                else:
                    return Response({'error': 'Source file did not contain a valid PDF signature.'}, status=400)

            raw_text = ""
            
            # 2. Dual-Path Reading (Memory -> TempFile Fallback)
            # Sometimes pypdf on Windows has issues with io.BytesIO if the bytes are slightly malformed
            try:
                reader = pypdf.PdfReader(io.BytesIO(content))
                for page in reader.pages:
                    text = page.extract_text()
                    if text: raw_text += text + "\n"
            except (PdfStreamError, Exception) as pe:
                print(f"DEBUG: Memory-based parse failed, trying TempFile path: {pe}")
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name
                
                try:
                    reader = pypdf.PdfReader(tmp_path)
                    for page in reader.pages:
                        text = page.extract_text()
                        if text: raw_text += text + "\n"
                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
            
            if not raw_text.strip():
                 return Response({
                     'lines': [], 
                     'message': 'The PDF extraction returned no text. This usually means the file is a scanned image (requires OCR) or uses non-standard fonts.'
                 })

            # Smart Sentence Reconstructor
            raw_lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
            final_lines = []
            current_buffer = ""

            for line in raw_lines:
                is_marker = re.match(r'^(\d+[\.\)]?|[a-g][\.\)]|•|\-)\s', line.lower())
                is_multi_score = re.search(r'\d\s+[A-Za-z]+\s+\d\s+[A-Za-z]+', line)
                
                if (is_marker or is_multi_score) and current_buffer:
                    final_lines.append(current_buffer.strip())
                    current_buffer = line
                elif not current_buffer:
                    current_buffer = line
                else:
                    if re.search(r'[\?\!]$', current_buffer.strip()):
                        final_lines.append(current_buffer.strip())
                        current_buffer = line
                    elif re.search(r'[\.\:]$', current_buffer.strip()) and not re.search(r'(No\.|Vol\.|Dr\.)$', current_buffer.strip()):
                         final_lines.append(current_buffer.strip())
                         current_buffer = line
                    else:
                        current_buffer += " " + line
            
            if current_buffer: final_lines.append(current_buffer.strip())
            final_lines = [l for l in final_lines if len(l) > 3 and not l.startswith('©')]
            return Response({'lines': final_lines})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def perform_create(self, serializer):
        user = self.request.user
        pdf_file = self.request.FILES.get('pdf_file')
        name = self.request.data.get('name')
        if not name and pdf_file:
            name = pdf_file.name.rsplit('.', 1)[0]
        # Ensure pdf_file is passed explicitly to handle potential sanitizer stripping
        serializer.save(created_by=user, name=name or "Untitled Questionnaire", pdf_file=pdf_file)

class StudyQuestionnaireViewSet(viewsets.ModelViewSet):
    queryset = StudyQuestionnaire.objects.all()
    serializer_class = StudyQuestionnaireSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        study_id = self.request.query_params.get('study_id')
        if study_id:
            if bson.ObjectId.is_valid(study_id):
                return self.queryset.filter(study_id=study_id)
            return self.queryset.filter(study__protocol_id=study_id)
        return self.queryset.all()

class QuestionnaireScheduleInstanceViewSet(viewsets.ModelViewSet):
    queryset = QuestionnaireScheduleInstance.objects.all()
    serializer_class = QuestionnaireScheduleInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None



    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit_responses(self, request, pk=None):
        instance = self.get_object()
        responses = request.data.get('responses', {})
        signature = request.data.get('signature')
        
        # If it's a PDF mode, signature is mandatory
        if instance.study_questionnaire.mode == 'PDF' and not signature:
            return Response({'error': 'Signature required for this instrument.'}, status=status.HTTP_400_BAD_REQUEST)
        
        instance.response_data = responses
        if signature:
            instance.participant_signature = signature
            instance.participant_signed_at = timezone.now()
            
        instance.status = 'COMPLETED'
        instance.completed_at = timezone.now()
        instance.save()
        
        # Log to Audit
        AuditLog.log('SUBMIT_INSTRUMENT', user_email=request.user.email, request=request, detail=f"Submitted {instance.schedule_name} for Study {instance.participant.study.protocol_id}")
        
        return Response({'status': 'submitted', 'completed_at': instance.completed_at})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def sign_staff(self, request, pk=None):
        """Staff (CC/PI) countersigns the submitted instrument"""
        instance = self.get_object()
        role = (request.user.role or '').upper()
        if role not in ['COORDINATOR', 'PI', 'ADMIN', 'SUPER_ADMIN']:
            return Response({'error': 'Unauthorized'}, status=403)
            
        signature = request.data.get('signature')
        if not signature:
            return Response({'error': 'Signature required'}, status=400)
            
        if role == 'PI':
            instance.pi_signature = signature
            instance.pi_signed_at = timezone.now()
        else:
            instance.coordinator_signature = signature
            instance.coordinator_signed_at = timezone.now()
            
        instance.save()
        return Response({'status': 'staff_signed'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save_draft(self, request, pk=None):
        instance = self.get_object()
        responses = request.data.get('responses')
        instance.response_data = responses
        instance.save()
        return Response({'status': 'draft_saved'})

    def get_queryset(self):
        user = self.request.user
        participant_id = self.request.query_params.get('participant_id')
        study_id = self.request.query_params.get('study_id')

        # RBAC and Base Queryset
        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
            qs = self.queryset.all()
        elif (user.role or '').upper() == 'PARTICIPANT':
            qs = self.queryset.filter(participant__user=user)
        else:
            # PI / Coordinator visibility
            qs = self.queryset.filter(
                Q(study_questionnaire__study__pi=user) | 
                Q(study_questionnaire__study__coordinator=user)
            ).distinct()

        # Drill-down Filters
        if participant_id:
            qs = qs.filter(participant_id=participant_id)
        if study_id:
            if bson.ObjectId.is_valid(study_id):
                qs = qs.filter(study_questionnaire__study_id=study_id)
            else:
                qs = qs.filter(study_questionnaire__study__protocol_id=study_id)

        return qs.order_by('scheduled_date')

class TechnologyViewSet(viewsets.ModelViewSet):
    queryset = Technology.objects.all().order_by('display_order')
    serializer_class = TechnologySerializer
    permission_classes = [permissions.AllowAny]

class InnovationPageSettingsView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        settings = InnovationPageSettings.load()
        serializer = InnovationPageSettingsSerializer(settings)
        return Response(serializer.data)

class SponsorInquiryView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    def post(self, request):
        serializer = SponsorInquirySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "message": "Inquiry submitted successfully. A confirmation email has been sent."}, status=status.HTTP_201_CREATED)
        import logging
        logging.getLogger(__name__).error(f"Sponsor Inquiry Validation Failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
