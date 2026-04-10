from rest_framework import serializers
from .models import (
    Study, StudyAssignment, Participant, Visit, Form, FormResponse, 
    Task, ParticipantTask, StaffTask, Consent, ConsentTemplate, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog, InterventionArm,
    News, Event, FacilityInquiry, Candidate, NewsletterSubscriber,
    BookletDownloadRequest, Partnership, Publication, EducationMaterial,
    StudyInquiry, ClinicalConversation, ClinicalMessage, Kit,
    DosingLog, AEReport, Document, Notification, ProgressReport,
    StudyActionRequest, DailyMedicationLog, AssignedForm, SponsorOrganization
)
from authentication.models import User
from authentication.security import decrypt_data
from .utils.sanitizers import sanitize_html
import bson
import os

class ObjectIdField(serializers.Field):
    """Custom field to handle MongoDB ObjectId serialization."""
    def to_representation(self, value):
        if value is None:
            return None
        return str(value)

    def to_internal_value(self, data):
        if not data:
            return None
        try:
            return bson.ObjectId(data)
        except Exception:
            raise serializers.ValidationError(f"Invalid ObjectId: {data}")

class SanitizedModelSerializer(serializers.ModelSerializer):
    id = ObjectIdField(read_only=True)
    
    def to_representation(self, instance):
        """Handle MongoDB ObjectId serialization and authorized decryption (SUPER_ADMIN, etc.)."""
        from authentication.security import decrypt_data
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request else None
        
        # Only decrypt for authorized clinical/admin roles
        is_authorized = user and user.is_authenticated and (user.role.upper() in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR'])
        
        # Ensure we don't leak raw ObjectIds and handle decryption
        for key, value in ret.items():
            if type(value).__name__ == 'ObjectId':
                ret[key] = str(value)
            elif isinstance(value, list):
                ret[key] = [str(item) if type(item).__name__ == 'ObjectId' else item for item in value]
            elif isinstance(value, str) and (val_str := str(value)).startswith('gAAAA'):
                # Automatically decrypt ONLY for authorized roles
                if is_authorized or (user and (instance == user or (hasattr(instance, 'user') and instance.user == user))):
                    try:
                        ret[key] = decrypt_data(val_str)
                    except Exception:
                        pass
        
        # If created_by is present and is a User instance, show its ID or email
        if 'created_by' in ret and hasattr(instance, 'created_by') and instance.created_by:
            ret['created_by'] = str(instance.created_by.id)
            
        return ret

    def to_internal_value(self, data):
        # Sanitize all incoming string data.
        try:
            mutable_data = data.dict() if hasattr(data, 'dict') else dict(data)
        except Exception:
            mutable_data = data

        if isinstance(mutable_data, dict):
            for key, value in list(mutable_data.items()):
                if isinstance(value, str):
                    mutable_data[key] = sanitize_html(value)

        return super().to_internal_value(mutable_data)

class UserSerializer(SanitizedModelSerializer):
    last_login_formatted = serializers.SerializerMethodField()
    date_joined_formatted = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    
    # Aliases for frontend compatibility
    mobile_number = serializers.CharField(source='phone_number', required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 'phone_number', 'mobile_number',
            'profile_picture', 'password', 'last_login_formatted', 'date_joined_formatted',
            'full_address', 'city', 'state', 'zip_code', 'country', 'place_of_origin',
            'must_change_password', 'profile_completed', 'is_active', 'timezone',
            'status', 'affiliation', 'assigned_studies', 'created_by'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Ensure full_name is decrypted
        if hasattr(instance, 'decrypted_name'):
            ret['full_name'] = instance.decrypted_name
        return ret

    def get_last_login_formatted(self, obj):
        if not obj.last_login:
            return "Never"
        
        from django.utils.timezone import now
        diff = now() - obj.last_login
        
        if diff.days > 0:
            return f"{diff.days}d ago"
        seconds = diff.seconds
        if seconds < 60:
            return "Just Now"
        if seconds < 3600:
            return f"{seconds // 60}m ago"
        return f"{seconds // 3600}h ago"
    
    def get_date_joined_formatted(self, obj):
        if not obj.date_joined:
            return "N/A"
        return obj.date_joined.strftime('%b %d, %Y %H:%M')


    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class DocumentSerializer(SanitizedModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'file_url', 'version', 'visibility', 'is_archived', 'uploaded_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class SponsorOrganizationSerializer(SanitizedModelSerializer):
    class Meta:
        model = SponsorOrganization
        fields = '__all__'

class StudySerializer(SanitizedModelSerializer):
    # --- Relational ID fields ---
    pi_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='pi', required=False, allow_null=True
    )
    coordinator_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='coordinator', required=False, allow_null=True
    )
    sponsor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='sponsor', required=False, allow_null=True
    )
    sponsor_org_id = serializers.PrimaryKeyRelatedField(
        queryset=SponsorOrganization.objects.all(), source='sponsor_org', required=False, allow_null=True
    )
    pi_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), write_only=True, required=False)
    coordinator_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), write_only=True, required=False)

    # --- Explicit optional overrides for fields that are required in the DB model ---
    # 'sponsor_name' and 'title' have no blank=True in the model, but we handle defaults here.
    title = serializers.CharField(required=False, allow_blank=True, default='Untitled Study')
    sponsor_name = serializers.CharField(required=False, allow_blank=True, default='')
    study_type = serializers.CharField(required=False, default='IN_PERSON')
    status = serializers.CharField(required=False, default='DRAFT')
    stage = serializers.CharField(required=False, default='DRAFT')
    reward_type = serializers.CharField(required=False, default='CASH')
    reward_logic = serializers.CharField(required=False, default='PER_TASK')
    reward_config = serializers.JSONField(required=False, default=dict)
    compensation = serializers.CharField(required=False, allow_blank=True, default='')
    tags = serializers.JSONField(required=False, default=list)
    timeline = serializers.JSONField(required=False, default=list)
    privacy_standards = serializers.JSONField(required=False, default=list)
    target_subjects = serializers.IntegerField(required=False, default=0)
    target_screened = serializers.IntegerField(required=False, default=0)

    # --- Read-only nested fields ---
    assigned_pis = UserSerializer(many=True, read_only=True)
    assigned_coordinators = UserSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    # consent_templates is a reverse FK relation — MUST be read_only, never required on write
    consent_templates = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Study
        fields = [
            'id', 'title', 'full_title', 'description', 'protocol_id', 'sponsor_name', 'study_type', 'status', 'stage',
            'pi_id', 'coordinator_id', 'sponsor_id', 'sponsor_org_id', 'pi_ids', 'coordinator_ids',
            'assigned_pis', 'assigned_coordinators', 'approval_status', 'created_by', 'created_by_role',
            'primary_indication', 'trial_model', 'phase', 'is_double_blind', 'has_placebo_control',
            'has_screening_log', 'shipment_mode', 'consent_mode', 'condition',
            'trial_format', 'benefit', 'duration', 'tags', 'compensation', 'location', 'uses_kit',
            'time_commitment', 'overview', 'timeline', 'kits_info', 'safety_info',
            'privacy_standards', 'remote_participation', 'start_date', 'end_date',
            'launch_date', 'irb_status', 'target_subjects', 'target_screened', 'actual_screened',
            'proposal_source', 'proposal_submitted_date', 'agreement_signed_date',
            'contract_status', 'sponsor_contact_name', 'sponsor_contact_email',
            'show_dosing_log', 'show_ae_report', 'show_lab_upload', 'is_archived',
            'reward_type', 'reward_logic', 'reward_config',
            'consent_template_file', 'consent_templates', 'documents'
        ]

    def to_internal_value(self, data):
        import logging
        logger = logging.getLogger(__name__)
        # Strip unknown/extra frontend-only fields that the serializer doesn't know about
        KNOWN_FIELDS = set(self.fields.keys()) | {
            'pi_ids', 'coordinator_ids', 'pi_id', 'coordinator_id', 'sponsor_id', 'sponsor_org_id'
        }
        FRONTEND_ONLY_FIELDS = {
            'reward_amount', 'rct_design', 'masking', 'consent_collection', 'medication_supply',
            'compensation_currency', 'brief_description', 'indication', 'execution_type',
            'assigned_sponsors', 'startDate', 'endDate',
            # Also strip these if frontend accidentally sends them (they are read-only relations)
            'consent_templates', 'documents', 'assigned_pis', 'assigned_coordinators'
        }
        if isinstance(data, dict):
            data = {k: v for k, v in data.items() if k not in FRONTEND_ONLY_FIELDS}
        try:
            return super().to_internal_value(data)
        except Exception as e:
            logger.error(f"[StudySerializer] Validation Error: {e}")
            raise

class PublicStudySerializer(SanitizedModelSerializer):
    """Lighter version for discovery page to boost performance"""
    class Meta:
        model = Study
        fields = [
            'id', 'title', 'protocol_id', 'description', 'condition', 
            'duration', 'location', 'compensation', 'status', 'stage', 
            'tags', 'uses_kit'
        ]

class InterventionArmSerializer(SanitizedModelSerializer):
    class Meta:
        model = InterventionArm
        fields = '__all__'

class StudyAssignmentSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    
    class Meta:
        model = StudyAssignment
        fields = ['id', 'study', 'user', 'user_id', 'role', 'date_assigned']

class VisitSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    notes = serializers.SerializerMethodField()
    class Meta:
        model = Visit
        fields = [
            'id', 'participant', 'visit_type', 'scheduled_date', 'actual_date', 
            'status', 'notes', 'location', 'checklist', 'assessments', 
            'measurements', 'deviations', 'samples', 'dispensing', 
            'pi_approved', 'locked'
        ]

    def get_notes(self, obj):
        return obj.decrypted_notes



class LeadSerializer(SanitizedModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'

class CommunicationLogSerializer(SanitizedModelSerializer):
    class Meta:
        model = CommunicationLog
        fields = '__all__'



class DataAuditLogSerializer(SanitizedModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = DataAuditLog
        fields = '__all__'


class KitSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    collection_guide_url = serializers.SerializerMethodField()
    shipping_label_url = serializers.SerializerMethodField()
    return_label_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Kit
        fields = [
            'id', 'study', 'participant', 'kit_number', 'kit_type', 'status', 
            'assignment_date', 'collection_date', 'shipping_date', 'received_date', 
            'carrier', 'tracking_number', 'tracking_url', 'expected_delivery', 
            'collection_guide', 'shipping_label', 'return_label', 
            'collection_guide_url', 'shipping_label_url', 'return_label_url',
            'symptom_note', 'address_override'
        ]

    def get_collection_guide_url(self, obj):
        if not obj.collection_guide: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.collection_guide.url)
        return obj.collection_guide.url

    def get_shipping_label_url(self, obj):
        if not obj.shipping_label: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.shipping_label.url)
        return obj.shipping_label.url

    def get_return_label_url(self, obj):
        if not obj.return_label: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.return_label.url)
        return obj.return_label.url

class FormSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Form
        fields = '__all__'

class FormResponseSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = FormResponse
        fields = '__all__'

class AssignedFormSerializer(SanitizedModelSerializer):
    form_details = FormSerializer(source='form', read_only=True)
    signed_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = AssignedForm
        fields = ['id', 'study', 'form', 'form_details', 'participant', 'status', 'participant_signature', 'participant_signed_at', 'coordinator_signature', 'coordinator_signed_at', 'coordinator_user', 'pi_signature', 'pi_signed_at', 'pi_user', 'data', 'signed_pdf', 'signed_pdf_url', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['participant_signed_at', 'coordinator_signed_at', 'pi_signed_at']

    def get_signed_pdf_url(self, obj):
        if not obj.signed_pdf: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.signed_pdf.url)
        return obj.signed_pdf.url

class TaskSerializer(SanitizedModelSerializer):
    form_details = FormSerializer(source='form', read_only=True)
    class Meta:
        model = Task
        fields = '__all__'

class ParticipantTaskSerializer(SanitizedModelSerializer):
    task_details = TaskSerializer(source='task', read_only=True)
    assigned_form_details = AssignedFormSerializer(source='assigned_form', read_only=True)
    study = serializers.SerializerMethodField()
    participant_name = serializers.SerializerMethodField()
    protocol_id = serializers.SerializerMethodField()

    def get_study(self, obj):
        """Expose the participant's study ID so the frontend can filter tasks per-study."""
        try:
            return str(obj.participant.study_id)
        except Exception:
            return None

    def get_participant_name(self, obj):
        try:
            return obj.participant.user.decrypted_name
        except Exception:
            return "Anonymous"

    def get_protocol_id(self, obj):
        try:
            return obj.participant.study.protocol_id
        except Exception:
            return "N/A"

    class Meta:
        model = ParticipantTask
        fields = [
            'id', 'participant', 'task', 'task_details', 'study', 'due_date', 
            'completed_at', 'status', 'visit_name', 'timeline_group', 'estimated_time', 
            'is_locked', 'current_data', 'assigned_form', 'assigned_form_details',
            'participant_name', 'protocol_id'
        ]

class StaffTaskSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    class Meta:
        model = StaffTask
        fields = '__all__'

class ConsentTemplateSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    file_url = serializers.SerializerMethodField()
    
    # Nested UI Objects
    signatureRequirements = serializers.SerializerMethodField()
    completionRules = serializers.SerializerMethodField()
    
    # CamelCase/SnakeCase Mapping for UI Compatibility
    placedFields = serializers.JSONField(source='placed_fields', required=False)
    irbNumber = serializers.CharField(source='irb_number', required=False, allow_blank=True)
    irbApprovalDate = serializers.DateField(source='irb_approval_date', required=False, allow_null=True)
    effectiveDate = serializers.DateField(source='effective_date', required=False, allow_null=True)
    expirationDate = serializers.DateField(source='expiration_date', required=False, allow_null=True)
    pageCount = serializers.IntegerField(source='page_count', default=1)
    shortName = serializers.SerializerMethodField()

    class Meta:
        model = ConsentTemplate
        fields = '__all__'

    def to_internal_value(self, data):
        """Map frontend snake_case or camelCase keys to the correct internal field names."""
        # Support both styles from frontend
        mappings = {
            'placed_fields': 'placedFields',
            'irb_number': 'irbNumber',
            'irb_approval_date': 'irbApprovalDate',
            'effective_date': 'effectiveDate',
            'expiration_date': 'expirationDate',
            'page_count': 'pageCount'
        }
        for snake, camel in mappings.items():
            if snake in data and camel not in data:
                data[camel] = data[snake]
        
        # Handle study lookup if protocol_id string is passed
        if 'study' in data and isinstance(data['study'], str):
            import bson
            if not bson.ObjectId.is_valid(data['study']):
                study_obj = Study.objects.filter(protocol_id=data['study']).first()
                if study_obj:
                    data['study'] = str(study_obj.id)

        return super().to_internal_value(data)

    def get_file_url(self, obj):
        if not obj.file: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def get_shortName(self, obj):
        return obj.title[:10]

    def get_signatureRequirements(self, obj):
        return {
            'participantSignature': obj.require_participant_sig,
            'participantDate': True,
            'larSignature': obj.require_lar,
            'witnessSignature': obj.require_witness,
            'ccSignature': obj.require_cc_verification,
            'piVerification': obj.require_pi_signoff,
            'initialEachPage': obj.require_initials_on_pages,
            'initialKeySections': obj.require_initial_sections
        }

    def get_completionRules(self, obj):
        return {
            'mustScrollFull': obj.must_scroll_full,
            'mustAnswerComprehension': obj.must_answer_quiz,
            'mustCheckAgreements': True,
            'allowRemote': True,
            'allowInPerson': True,
            'requireCCBeforePI': True
        }

class ConsentSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    pi_name = serializers.CharField(source='pi_user.decrypted_name', read_only=True)
    cc_name = serializers.CharField(source='cc_user.decrypted_name', read_only=True)
    template_version = serializers.CharField(source='template.version', read_only=True)
    study_title = serializers.CharField(source='study.title', read_only=True)
    protocol_id = serializers.CharField(source='study.protocol_id', read_only=True)
    signed_pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Consent
        fields = [
            'id', 'study', 'study_title', 'protocol_id', 'template', 'template_version', 
            'participant', 'full_name', 'email',
            'cc_verified', 'cc_verified_at', 'cc_user', 'cc_name',
            'pi_verified', 'pi_verified_at', 'pi_user', 'pi_name',
            'agreed_at', 'signed_pdf', 'signed_pdf_url', 'is_valid', 'audit_trail'
        ]
        read_only_fields = ['agreed_at', 'ip_address', 'signed_pdf']

    def get_signed_pdf_url(self, obj):
        if not obj.signed_pdf: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.signed_pdf.url)
        return obj.signed_pdf.url

class LabResultSerializer(SanitizedModelSerializer):
    class Meta:
        model = LabResult
        fields = '__all__'


class NewsSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = News
        fields = '__all__'

    def get_image_url(self, obj):
        if not obj.image: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.image.url)
        return obj.image.url

class EventSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = Event
        fields = '__all__'

    def get_image_url(self, obj):
        if not obj.image: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.image.url)
        return obj.image.url

class FacilityInquirySerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    
    class Meta:
        model = FacilityInquiry
        fields = '__all__'

class CandidateSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    
    class Meta:
        model = Candidate
        fields = '__all__'

class NewsletterSubscriberSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = NewsletterSubscriber
        fields = '__all__'

class BookletDownloadRequestSerializer(SanitizedModelSerializer):
    class Meta:
        model = BookletDownloadRequest
        fields = '__all__'

class PartnershipSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Partnership
        fields = '__all__'

    def get_logo_url(self, obj):
        if not obj.logo: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.logo.url)
        return obj.logo.url

class PublicationSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    class Meta:
        model = Publication
        fields = '__all__'

class EducationMaterialSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EducationMaterial
        fields = '__all__'

    def get_file_url(self, obj):
        if not obj.file: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.file.url)
        return obj.file.url

class StudyInquirySerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    contact_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    contact_person_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    contact_person_designation = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    contact_mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = StudyInquiry
        fields = '__all__'
        read_only_fields = ['sponsor_user', 'routing_target']

class ClinicalMessageSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    sender_name = serializers.CharField(source='sender.decrypted_name', read_only=True)
    user_role_label = serializers.CharField(source='sender.role', read_only=True)
    
    class Meta:
        model = ClinicalMessage
        fields = ['id', 'sender', 'sender_name', 'user_role_label', 'text', 'tag', 'attachment', 'is_from_pi', 'created_at']

class ClinicalConversationBriefSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    participant_sid = serializers.CharField(source='participant.participant_sid', read_only=True)
    study_protocol = serializers.CharField(source='study.protocol_id', read_only=True)
    assigned_coordinator = serializers.CharField(source='study.coordinator.decrypted_name', read_only=True, allow_null=True)
    participant_status = serializers.CharField(source='participant.status', read_only=True)

    class Meta:
        model = ClinicalConversation
        fields = [
            'id', 'participant', 'participant_sid', 'participant_status', 'study', 
            'study_protocol', 'status', 'is_flagged', 'last_message_preview', 
            'last_updated', 'created_at', 'assigned_coordinator'
        ]
        read_only_fields = ['participant', 'study']

class ClinicalConversationSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    messages = ClinicalMessageSerializer(many=True, read_only=True)
    participant_sid = serializers.CharField(source='participant.participant_sid', read_only=True)
    study_protocol = serializers.CharField(source='study.protocol_id', read_only=True)
    assigned_coordinator = serializers.CharField(source='study.coordinator.decrypted_name', read_only=True, allow_null=True)
    participant_status = serializers.CharField(source='participant.status', read_only=True)

    class Meta:
        model = ClinicalConversation
        fields = [
            'id', 'participant', 'participant_sid', 'participant_status', 'study', 
            'study_protocol', 'status', 'is_flagged', 'last_message_preview', 
            'last_updated', 'created_at', 'messages', 'assigned_coordinator'
        ]
        read_only_fields = ['participant', 'study']

class DosingLogSerializer(SanitizedModelSerializer):
    class Meta:
        model = DosingLog
        fields = '__all__'
        read_only_fields = ['participant']

class AEReportSerializer(SanitizedModelSerializer):
    class Meta:
        model = AEReport
        fields = '__all__'
        read_only_fields = ['participant']

class DailyMedicationLogSerializer(SanitizedModelSerializer):
    class Meta:
        model = DailyMedicationLog
        fields = '__all__'
        read_only_fields = ['participant']

class ParticipantSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    gender = serializers.SerializerMethodField()
    user_details = UserSerializer(source='user', read_only=True)
    study_name = serializers.CharField(source='study.title', read_only=True)
    protocol_id = serializers.CharField(source='study.protocol_id', read_only=True)
    coordinator_name = serializers.CharField(source='study.coordinator.decrypted_name', read_only=True, allow_null=True)
    visits = VisitSerializer(many=True, read_only=True)
    ae_reports = AEReportSerializer(many=True, read_only=True)
    daily_logs = DailyMedicationLogSerializer(many=True, read_only=True)
    lab_results = LabResultSerializer(many=True, read_only=True)
    consent_records = ConsentSerializer(many=True, read_only=True)
    age = serializers.SerializerMethodField()
    
    reviewer_name = serializers.CharField(source='reviewed_by.decrypted_name', read_only=True, allow_null=True)

    class Meta:
        model = Participant
        fields = [
            'id', 'study', 'study_name', 'protocol_id', 'user', 'user_details', 
            'participant_sid', 'status', 'gender', 'dob', 'age', 'assigned_arm', 
            'is_locked', 'completion_date', 'created_at', 'coordinator_name', 
            'visits', 'ae_reports', 'daily_logs', 'lab_results', 'consent_records',
            'eligibility_data', 'submitted_at', 'reviewed_by', 'reviewer_name',
            'reviewed_at', 'status_notes'
        ]

    def get_gender(self, obj):
        return obj.decrypted_gender

    def get_age(self, obj):
        if not obj.dob: return None
        from datetime import date
        today = date.today()
        return today.year - obj.dob.year - ((today.month, today.day) < (obj.dob.month, self.safe_day(obj)))
    
    # Helper to avoid issues with leap years or missing days
    def safe_day(self, obj):
        return obj.dob.day if obj.dob else 1

class ParticipantBriefSerializer(SanitizedModelSerializer):
    """Senior Developer: Light-weight serializer for dashboard lists to prevent 15s loading delays."""
    id = serializers.CharField(read_only=True)
    study_name = serializers.CharField(source='study.title', read_only=True)
    protocol_id = serializers.CharField(source='study.protocol_id', read_only=True)
    
    class Meta:
        model = Participant
        fields = [
            'id', 'study', 'study_name', 'protocol_id', 'user', 
            'participant_sid', 'status', 'created_at', 'reviewed_at'
        ]

class DeIdentifiedParticipantSerializer(SanitizedModelSerializer):
    """Restricted view for Sponsors (No PII)"""
    id = serializers.CharField(read_only=True)
    age = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    
    class Meta:
        model = Participant
        fields = [
            'id', 'study', 'participant_sid', 'status', 'gender', 'age', 
            'assigned_arm', 'completion_date', 'created_at', 'reviewed_at'
        ]

    def get_gender(self, obj):
        return obj.decrypted_gender

    def get_age(self, obj):
        if not obj.dob: return None
        from datetime import date
        today = date.today()
        return today.year - obj.dob.year - ((today.month, today.day) < (obj.dob.month, obj.dob.day))

class NotificationSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    class Meta:
        model = Notification
        fields = '__all__'

class ProgressReportSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    study_protocol = serializers.CharField(source='study.protocol_id', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    class Meta:
        model = ProgressReport
        fields = ['id', 'study', 'study_protocol', 'name', 'report_type', 'report_type_display', 'report_date', 'file', 'status', 'created_at']
class StudyActionRequestSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    participant_id = ObjectIdField(read_only=True, source='participant.id')
    study_id = ObjectIdField(read_only=True, source='study.id')
    study_title = serializers.CharField(read_only=True, source='study.title')
    created_at_formatted = serializers.DateTimeField(source='created_at', format="%b %d, %Y %H:%M", read_only=True)

    class Meta:
        model = StudyActionRequest
        fields = [
            'id', 'participant_id', 'study_id', 'study_title', 'request_type', 
            'status', 'created_at', 'created_at_formatted', 'updated_at', 'notes'
        ]

class CompensationSerializer(SanitizedModelSerializer):
    participant_details = ParticipantSerializer(source='participant', read_only=True)
    study_details = StudySerializer(source='study', read_only=True)
    task_details = TaskSerializer(source='task', read_only=True)
    visit_details = VisitSerializer(source='visit', read_only=True)
    study_protocol = serializers.CharField(source='study.protocol_id', read_only=True)

    class Meta:
        model = Compensation
        fields = [
            'id', 'participant', 'study', 'study_protocol', 'visit', 'task', 
            'participant_details', 'study_details', 'task_details', 'visit_details',
            'transaction_type', 'description', 'amount', 'status', 'payment_method', 
            'paid_at', 'notes', 'created_at'
        ]
