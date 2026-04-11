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
    StudyInquiry, ClinicalConversation, ClinicalMessage, Kit,
    DosingLog, AEReport, Document, Notification, ProgressReport, DailyMedicationLog,
    AssignedForm, SponsorOrganization, QuestionnaireTemplate, StudyQuestionnaire,
    QuestionnaireScheduleInstance
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
    KitSerializer, DosingLogSerializer, AEReportSerializer,
    NotificationSerializer, ProgressReportSerializer, DocumentSerializer,
    DailyMedicationLogSerializer, AssignedFormSerializer, SponsorOrganizationSerializer,
    PublicStudySerializer, QuestionnaireTemplateSerializer, StudyQuestionnaireSerializer,
    QuestionnaireScheduleInstanceSerializer
)
from authentication.models import User, AuditLog
from django.db.models import Q
from django.utils import timezone
import pytz
from .utils.reward_logic import trigger_reward_logic
import datetime
import bson

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

class SponsorOrganizationViewSet(viewsets.ModelViewSet):
    queryset = SponsorOrganization.objects.all()
    serializer_class = SponsorOrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # All authenticated users can view sponsor organizations (needed for selection)
        return SponsorOrganization.objects.all().order_by('name')

    def perform_create(self, serializer):
        # Allow Super Admin, Admin, and PI to create organizations for now
        if self.request.user.role.upper() not in ['SUPER_ADMIN', 'ADMIN', 'PI']:
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
            ).order_by('created_at')
        
        role = (user.role or '').strip().upper()
        
        # 1. Super Admin: Absolute Visibility
        if role == 'SUPER_ADMIN':
            return Study.objects.all().order_by('created_at')
            
        # 2. Staff Roles (PI, COORDINATOR, ADMIN): Assigned studies or those they created
        if role in ['PI', 'COORDINATOR', 'ADMIN']:
            return Study.objects.filter(
                Q(pi=user) | Q(coordinator=user) | Q(created_by=user) | Q(assignments__user=user)
            ).distinct().order_by('created_at')

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

    def perform_create(self, serializer):
        user = self.request.user
        role = user.role.upper()
        
        # Requirement 1: Sponsors cannot create study directly
        if role == 'SPONSOR':
            raise serializers.ValidationError({"detail": "Sponsors cannot create studies directly. Please submit a Study Inquiry for review."})

        pi_ids = serializer.validated_data.pop('pi_ids', [])
        coord_ids = serializer.validated_data.pop('coordinator_ids', [])
        sponsor_ids = serializer.validated_data.pop('sponsor_ids', [])
        
        # Staff creation is auto-approved
        approval_status = 'approved' if role in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR'] else 'pending'
        
        study = serializer.save(
            created_by=user, 
            created_by_role=role,
            approval_status=approval_status
        )

        # Handle Clinical Instruments (Questionnaires) from the Launch Form
        questionnaires_data = serializer.validated_data.get('study_questionnaires', [])
        for q_data in questionnaires_data:
            template_id = q_data.get('template')
            if not template_id: continue
            
            try:
                template = QuestionnaireTemplate.objects.get(pk=template_id)
                StudyQuestionnaire.objects.create(
                    study=study,
                    template=template,
                    mode=q_data.get('mode', 'STRUCTURED'),
                    frequency=q_data.get('frequency', 'ONCE'),
                    repetitions=q_data.get('repetitions', 1),
                    schedule_name=q_data.get('schedule_name', template.name)
                )
            except QuestionnaireTemplate.DoesNotExist:
                pass # Or log error
            
        self._sync_assignments(study, pi_ids, coord_ids, sponsor_ids)
        AuditLog.log('UPDATE_STUDY', user_email=user.email, request=self.request, detail=f"Created study {study.title}")
        if user.role.upper() in ['PI', 'COORDINATOR']:
            StudyAssignment.objects.get_or_create(study=study, user=user, role=user.role)

    def perform_update(self, serializer):
        user = self.request.user
        role = user.role.upper()
        
        # Requirement 2: Sponsors cannot edit study protocol or stage
        if role == 'SPONSOR':
             raise serializers.ValidationError({"detail": "Sponsors only have read-only access to assigned studies."})

        # Requirement 3: Only Super Admin can toggle is_archived manually
        if 'is_archived' in serializer.validated_data and role != 'SUPER_ADMIN':
            serializer.validated_data.pop('is_archived')

        pi_ids = serializer.validated_data.pop('pi_ids', None)
        coord_ids = serializer.validated_data.pop('coordinator_ids', None)
        sponsor_ids = serializer.validated_data.pop('sponsor_ids', None)
        
        # Logic 4: If stage is moved to CLOSED_ARCHIVED, auto-archive
        if serializer.validated_data.get('stage') == 'CLOSED_ARCHIVED':
            serializer.validated_data['is_archived'] = True

        study = serializer.save()
        self._sync_assignments(study, pi_ids, coord_ids, sponsor_ids)
        AuditLog.log('UPDATE_STUDY', user_email=user.email, request=self.request, detail=f"Modified study {study.title}")

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

        # Enforce one-study-at-a-time: block if already enrolled in any other study
        # (any status that is not DROPPED or INELIGIBLE means still engaged)
        active_enrollment = Participant.objects.filter(
            user=user
        ).exclude(
            status__in=['DROPPED', 'INELIGIBLE', 'COMPLETED']
        ).exclude(study=study).first()
        if active_enrollment:
            return Response({
                'status': 'already_in_study',
                'message': f'You are already enrolled in study {active_enrollment.study.protocol_id}. You can only participate in one study at a time. Please complete or withdraw from your current study before joining another.',
                'current_study': active_enrollment.study.protocol_id,
                'current_study_title': active_enrollment.study.title,
            }, status=status.HTTP_409_CONFLICT)
            
        # Generate anonymous SID
        import secrets
        pid_clean = "".join(filter(str.isalnum, study.protocol_id))[:4].upper()
        sid = f"{pid_clean}-{secrets.token_hex(4).upper()}"
        
        participant = Participant.objects.create(
            study=study,
            user=user,
            participant_sid=sid,
            status='RECRUITING' # Initial state before eligibility form submission
        )
        AuditLog.log('PARTICIPANT_SELF_ENROLL', user_email=user.email, request=request, detail=f"User self-enrolled in study {study.protocol_id}")
        
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
        
        return Response({
            'status': 'success', 
            'message': 'Study added to your portal. Please complete the eligibility screener to proceed.', 
            'participant_sid': sid,
            'study_title': study.title
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

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'participant_sid'

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


    # (get_queryset consolidated below)
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Endpoint to get the current user's most recent participant profile."""
        participant = Participant.objects.filter(user=request.user).order_by('-created_at').first()
        if not participant:
            return Response({'error': 'No participant record found.'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = self.get_serializer(participant)
        return Response(serializer.data)

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
        for user in filter(None, team):
            Notification.objects.create(
                user=user,
                title="Eligibility Submission",
                message=f"Participant {participant.participant_sid} submitted form for {study.protocol_id}.",
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
        """Review endpoint for PI/Coordinator (Requirement 4)"""
        participant = self.get_object()
        decision = request.data.get('decision') # 'ACCEPT' or 'REJECT'
        notes = request.data.get('notes', '')

        if decision in ['ACCEPT', 'ELIGIBLE']:
            participant.status = 'ENROLLED'
            # TRIGGER FORM ASSIGNMENT (Requirement 1)
            # Find all forms marked as is_required_on_enrollment for this study
            required_forms = Form.objects.filter(study=participant.study, is_required_on_enrollment=True)
            for f in required_forms:
                # 1. Create the AssignedForm tracking record
                af = AssignedForm.objects.create(
                    participant=participant,
                    form=f,
                    study=participant.study,
                    status='PENDING'
                )
                
                # 2. Create the ParticipantTask UI record to trigger the form in their portal
                
                # Create a specific task for this form signature
                Task.objects.get_or_create(
                    study=participant.study,
                    title=f.title,
                    task_type='FORM_SIGNATURE',
                    form=f,
                    frequency='ONCE'
                )
                
                # Assign the task instance
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

            # Also ensure a Consent task exists if the study is eConsent
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

        elif decision in ['REJECT', 'INELIGIBLE']:
            participant.status = 'INELIGIBLE'
        else:
            return Response({'error': 'Invalid decision.'}, status=status.HTTP_400_BAD_REQUEST)

        participant.reviewed_by = request.user
        participant.reviewed_at = timezone.now()
        participant.status_notes = notes
        participant.save()

        # Notify Participant
        if participant.user:
            msg = "Accepted into study." if decision == 'ACCEPT' else "Not eligible at this time."
            Notification.objects.create(
                user=participant.user,
                title="Status Updated",
                message=f"{participant.study.protocol_id}: {msg}",
                type="SUCCESS" if decision == 'ACCEPT' else "WARNING"
            )

        return Response({'status': 'reviewed', 'new_status': participant.status})
        
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrCoordinator])
    def withdraw(self, request, *args, **kwargs):
        """Terminate subject participation and set status to DROPPED"""
        participant = self.get_object()
        reason = request.data.get('reason', 'PI Initiated Withdrawal')
        
        participant.status = 'DROPPED'
        current_notes = participant.status_notes or ""
        participant.status_notes = current_notes + f"\n[WITHDRAWAL {timezone.now().date()}]: {reason}"
        participant.save()
        
        # Log to Audit Trail
        from .models import DataAuditLog
        DataAuditLog.objects.create(
            user=request.user,
            entity_type='PARTICIPANT',
            entity_id=participant.participant_sid,
            action='WITHDRAWAL',
            details=f"Subject withdrawn by {request.user.email}. Reason: {reason}"
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
        if user.role.upper() == 'SPONSOR':
            return DeIdentifiedParticipantSerializer
        # Senior Developer: Use Brief serializer for lists to dramatically boost dashboard speed
        if self.action == 'list':
            return ParticipantBriefSerializer
        return ParticipantSerializer
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Participant.objects.none()

        role = user.role.upper()
        if role in ['SUPER_ADMIN', 'ADMIN']:
            return Participant.objects.all().order_by('-created_at')
            
        if role == 'PARTICIPANT':
            return Participant.objects.filter(user=user).order_by('-created_at')
            
        # PIs and Coordinators only see participants in studies they are explicitly assigned to
        return Participant.objects.filter(study__assignments__user=user).distinct().order_by('-created_at')

class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Visit.objects.none()
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            return Visit.objects.all().order_by('-scheduled_date')
        if user.role.upper() == 'PARTICIPANT':
            return Visit.objects.filter(participant__user=user).order_by('-scheduled_date')
        # PIs, Coordinators, and Sponsors see visits for assigned studies
        return Visit.objects.filter(participant__study__assignments__user=user).distinct().order_by('-scheduled_date')

    def perform_create(self, serializer):
        visit = serializer.save()
        AuditLog.log('VISIT_SCHEDULED', user_email=self.request.user.email, request=self.request, detail=f"Visit {visit.visit_type} scheduled for {visit.participant.participant_sid}")

    def perform_update(self, serializer):
        visit = serializer.save()
        if visit.status == 'COMPLETED':
            AuditLog.log('VISIT_COMPLETED', user_email=self.request.user.email, request=self.request, detail=f"Visit {visit.visit_type} COMPLETED for {visit.participant.participant_sid}")
            trigger_reward_logic(visit, 'VISIT')
        else:
            AuditLog.log('UPDATE_VISIT', user_email=self.request.user.email, request=self.request, detail=f"Visit {visit.visit_type} updated for {visit.participant.participant_sid}")

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
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']: return CommunicationLog.objects.all()
        return CommunicationLog.objects.filter(participant__study__assignments__user=user).distinct()

class CompensationViewSet(viewsets.ModelViewSet):
    queryset = Compensation.objects.all()
    serializer_class = CompensationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Compensation.objects.none()
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            queryset = Compensation.objects.all().order_by('-paid_at')
        elif user.role.upper() == 'PARTICIPANT':
            queryset = Compensation.objects.filter(participant__user=user).order_by('-paid_at')
        else:
            queryset = Compensation.objects.filter(participant__study__assignments__user=user).distinct().order_by('-paid_at')
        
        study_id = self.request.query_params.get('study_id')
        if study_id and study_id != 'all':
            if bson.ObjectId.is_valid(study_id):
                queryset = queryset.filter(study_id=study_id)
            else:
                queryset = queryset.filter(study__protocol_id=study_id)
        return queryset

class LabResultViewSet(viewsets.ModelViewSet):
    queryset = LabResult.objects.all()
    serializer_class = LabResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return LabResult.objects.none()
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            return LabResult.objects.all().order_by('-lab_date')
        if user.role.upper() == 'PARTICIPANT':
            return LabResult.objects.filter(participant__user=user, is_released=True).order_by('-lab_date')
        queryset = LabResult.objects.filter(participant__study__assignments__user=user).distinct().order_by('-lab_date')
        
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
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN']:
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
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ConsentTemplate.objects.none()
            
        study_id = self.request.query_params.get('study_id')

        if (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN']:
            queryset = ConsentTemplate.objects.all().order_by('-created_at')
        # For Staff (Admin, Coordinator, PI): Filter templates by studies the user is assigned to
        elif user.role.upper() in ['PI', 'COORDINATOR']:
            queryset = ConsentTemplate.objects.filter(study__assignments__user=user).distinct().order_by('-created_at')
        elif user.role.upper() == 'PARTICIPANT':
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
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            return queryset.order_by('-uploaded_at')

        # Filter by visibility for other roles
        role_map = {
            'PI': 'PI',
            'COORDINATOR': 'COORDINATOR',
            'SPONSOR': 'SPONSOR',
            'PARTICIPANT': 'PARTICIPANT'
        }
        user_role = role_map.get(user.role.upper())
        
        if user_role:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(visibility__contains=user_role) | Q(visibility=[]) | Q(visibility__isnull=True)
            )

        # Further restrict to assigned studies for non-admins
        return queryset.filter(study__assignments__user=user).distinct().order_by('-uploaded_at')

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
        
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            queryset = self.queryset.all()
        elif user.role.upper() == 'PARTICIPANT':
            queryset = self.queryset.filter(participant__user=user)
        else:
            # PIs, Coordinators, and Sponsors see consents for assigned studies
            queryset = self.queryset.filter(participant__study__assignments__user=user).distinct()
            
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

    def perform_create(self, serializer):
        user = self.request.user
        study_id = self.request.data.get('study')
        
        participant = Participant.objects.filter(user=user, study_id=study_id).first()
        if not participant:
            participant = Participant.objects.filter(user=user).first()
            
        # 1. Blocks if active in another study (Not COMPLETED or DROPPED or INELIGIBLE)
        active_studies = Participant.objects.filter(
            user=user, 
            status__in=['CONSENTED', 'RANDOMIZED', 'ACTIVE']
        ).exclude(study_id=study_id)
        if active_studies.exists():
            raise serializers.ValidationError({"error": "You are currently active in another study. You must complete it before joining a new one."})

        # Determine template: Use explicitly provided template ID if present, otherwise fallback to latest active
        template_id = self.request.data.get('template')
        if template_id:
            from bson import ObjectId
            template = ConsentTemplate.objects.filter(pk=template_id).first()
        else:
            template = ConsentTemplate.objects.filter(
                study_id=study_id, 
                status='ACTIVE'
            ).order_by('-version').first()
        
        consent = serializer.save(
            participant=participant,
            template=template,
            participant_signed_at=now(),
            audit_trail=[{
                "action": "PARTICIPANT_SIGNED",
                "timestamp": now().isoformat(),
                "user": user.email
            }]
        )
        
        # Mark Participant as CONSENTED 
        if participant:
            participant.status = 'CONSENTED'
            participant.save()

        # 2. Alert logic for PI & Coordinator
        study = Study.objects.get(id=study_id)
        
        # Notify Coordinator
        if study.coordinator:
            Notification.objects.create(
                user=study.coordinator,
                title="New Consent Signed",
                message=f"Participant {participant.participant_sid if participant else 'Unknown'} signed the consent for {study.protocol_id}. Please review and sign.",
                type="INFO"
            )
            StaffTask.objects.create(
                user=study.coordinator,
                study=study,
                title="Sign Consent Form",
                description=f"Participant {participant.participant_sid if participant else 'Unknown'} signed the consent for {study.protocol_id}.",
                task_type="CONSENT_SIGNATURE",
                reference_id=str(consent.pk)
            )
            
        # Notify PI
        if study.pi:
            Notification.objects.create(
                user=study.pi,
                title="New Consent Signed",
                message=f"Participant {participant.participant_sid if participant else 'Unknown'} signed the consent for {study.protocol_id}. Required to sign (optional depending on protocol).",
                type="INFO"
            )
            StaffTask.objects.create(
                user=study.pi,
                study=study,
                title="Sign Consent Form",
                description=f"Participant {participant.participant_sid if participant else 'Unknown'} signed the consent for {study.protocol_id}.",
                task_type="CONSENT_SIGNATURE",
                reference_id=str(consent.pk)
            )

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
        user = self.request.user
        pid = self.request.data.get('participant')
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN', 'PI', 'COORDINATOR'] and pid:
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
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN']:
            return DailyMedicationLog.objects.all()
        if user.role.upper() == 'PARTICIPANT':
            return DailyMedicationLog.objects.filter(participant__user=user)
        return DailyMedicationLog.objects.filter(participant__study__assignments__user=user)

    def perform_create(self, serializer):
        participant = Participant.objects.filter(user=self.request.user).first()
        if not participant:
            raise serializers.ValidationError({"participant": "User does not have an active participant record."})
        serializer.save(participant=participant)

class AssignedFormViewSet(viewsets.ModelViewSet):
    queryset = AssignedForm.objects.all()
    serializer_class = AssignedFormSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN']:
            return AssignedForm.objects.all().order_by('-created_at')
        if user.role.upper() == 'PARTICIPANT':
            return AssignedForm.objects.filter(participant__user=user).order_by('-created_at')
        # PIs/Coordinators see forms for their assigned studies
        return AssignedForm.objects.filter(study__assignments__user=user).distinct().order_by('-created_at')

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
                link=f"/coordinator/forms/{af.id}"
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
        if request.user.role.upper() not in ['COORDINATOR', 'PI', 'ADMIN', 'SUPER_ADMIN']:
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
                link=f"/pi/forms/{af.id}"
            )
            
        return Response({'status': 'coordinator_signed'})

    @action(detail=True, methods=['post'])
    def sign_pi(self, request, pk=None):
        """PI signs off (Optional but completing)"""
        af = self.get_object()
        if request.user.role.upper() not in ['PI', 'ADMIN', 'SUPER_ADMIN']:
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
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']: return Form.objects.all()
        study_id = self.request.query_params.get('study_id')
        if user.role.upper() == 'PARTICIPANT':
            qs = Form.objects.filter(study__participants__user=user).distinct()
        else:
            qs = Form.objects.filter(study__assignments__user=user).distinct()
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
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PI']:
            study_id = self.request.query_params.get('study')
            participant_id = self.request.query_params.get('participant')
            
            if study_id:
                queryset = queryset.filter(participant__study_id=study_id)
            if participant_id:
                queryset = queryset.filter(participant_id=participant_id)
            return queryset

        # CRITICAL: Only return tasks for participants who are formally ENROLLED or PENDING REVIEW.
        # This allows candidates to see screening-phase tasks like eConsent.
        visible_statuses = ['PENDING_REVIEW', 'ENROLLED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE']
        return queryset.filter(
            participant__user=user,
            participant__status__in=visible_statuses
        )

    def perform_update(self, serializer):
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

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()
        
        # Super Admins and Admins see everyone
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN']:
            return User.objects.all().order_by('-date_joined')
        
        if user.role.upper() in ['PI', 'COORDINATOR']:
            # PIs and Coordinators need visibility into Sponsors and Medical Personnel 
            # for staffing and launch tasks. Participants should be managed via /api/participants/.
            return User.objects.filter(
                Q(role__in=['sponsor', 'SPONSOR', 'pi', 'PI', 'coordinator', 'COORDINATOR', 'admin', 'ADMIN']) |
                Q(created_by=user)
            ).distinct().order_by('-date_joined')

        return User.objects.filter(id=user.id)

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Endpoint for the current user to view or update their own profile."""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        if request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                AuditLog.log('ROLE_CHANGED', user_email=request.user.email, request=request, detail="User updated own profile")
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all()
    serializer_class = NewsSerializer
    permission_classes = [permissions.AllowAny]

class StaffTaskViewSet(viewsets.ModelViewSet):
    queryset = StaffTask.objects.all()
    serializer_class = StaffTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return StaffTask.objects.none()
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN']:
            return StaffTask.objects.all().order_by('-created_at')
        return StaffTask.objects.filter(user=user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.user != request.user and request.user.role.upper() not in ['ADMIN', 'SUPER_ADMIN']:
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
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: return Kit.objects.none()
        if user.role.upper() in ['ADMIN', 'SUPER_ADMIN']:
            return Kit.objects.all().order_by('-assignment_date')
        if user.role.upper() == 'PARTICIPANT':
            return Kit.objects.filter(participant__user=user).order_by('-assignment_date')
        # PIs, Coordinators, and Sponsors: only kits for their assigned studies
        queryset = Kit.objects.filter(participant__study__assignments__user=user).distinct().order_by('-assignment_date')
        
        study_id = self.request.query_params.get('study_id')
        if study_id and study_id != 'all':
            if bson.ObjectId.is_valid(study_id):
                queryset = queryset.filter(participant__study_id=study_id)
            else:
                queryset = queryset.filter(participant__study__protocol_id=study_id)
        return queryset

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
        return Response({'status': 'DAMAGED'})

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
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
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
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            queryset = ClinicalConversation.objects.all().order_by('-last_updated')
        elif user.role.upper() == 'PARTICIPANT':
            queryset = ClinicalConversation.objects.filter(participant__user=user).order_by('-last_updated')
        else:
            # PIs and Coordinators see conversations related to their assigned studies
            queryset = ClinicalConversation.objects.filter(study__assignments__user=user).distinct().order_by('-last_updated')
        
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
        if participant_id and user.role.upper() in ['ADMIN', 'SUPER_ADMIN', 'PI', 'COORDINATOR']:
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
    queryset = QuestionnaireTemplate.objects.all()
    serializer_class = QuestionnaireTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        pdf_file = self.request.FILES.get('pdf_file')
        name = self.request.data.get('name')
        if not name and pdf_file:
            name = pdf_file.name.rsplit('.', 1)[0]
        serializer.save(created_by=user, name=name or "Untitled Questionnaire")

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
        responses = request.data.get('responses')
        
        if not responses:
            return Response({'error': 'No responses provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        instance.responses = responses
        instance.status = 'COMPLETED'
        instance.completed_at = timezone.now()
        instance.save()
        
        # Log to Audit
        AuditLog.log('SUBMIT_INSTRUMENT', user_email=request.user.email, request=request, detail=f"Submitted {instance.schedule_name} for Study {instance.participant.study.protocol_id}")
        
        return Response({'status': 'submitted', 'completed_at': instance.completed_at})

    def get_queryset(self):
        user = self.request.user
        participant_id = self.request.query_params.get('participant_id')
        study_id = self.request.query_params.get('study_id')

        # RBAC and Base Queryset
        if user.role.upper() in ['SUPER_ADMIN', 'ADMIN']:
            qs = self.queryset.all()
        elif user.role.upper() == 'PARTICIPANT':
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
