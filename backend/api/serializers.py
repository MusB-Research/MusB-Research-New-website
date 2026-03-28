from rest_framework import serializers
from .models import (
    Study, StudyAssignment, Participant, Visit, Kit, Form, FormResponse, 
    Task, ParticipantTask, Consent, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog, InterventionArm,
    News, Event, FacilityInquiry, Candidate, NewsletterSubscriber,
    BookletDownloadRequest, Partnership, Publication, EducationMaterial,
    StudyInquiry, ClinicalConversation, ClinicalMessage
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
                if is_authorized or (user and hasattr(instance, 'user') and instance.user == user):
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
    id = ObjectIdField(read_only=True)
    full_name = serializers.CharField()
    phone_number = serializers.SerializerMethodField()
    last_login_formatted = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    
    mobile_number = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    state = serializers.SerializerMethodField()
    place_of_origin = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 'phone_number', 'mobile_number',
            'profile_picture', 'password', 'last_login_formatted',
            'full_address', 'city', 'state', 'zip_code', 'country', 'place_of_origin',
            'must_change_password', 'profile_completed', 'is_active'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Use decrypted name for output
        ret['full_name'] = instance.decrypted_name
        return ret

    def get_phone_number(self, obj):
        return obj.decrypted_phone

    def get_mobile_number(self, obj):
        return obj.decrypted_phone

    def get_full_address(self, obj):
        return decrypt_data(obj.full_address) if obj.full_address else ''

    def get_city(self, obj):
        return decrypt_data(obj.city) if obj.city else ''

    def get_state(self, obj):
        return decrypt_data(obj.state) if obj.state else ''

    def get_place_of_origin(self, obj):
        return decrypt_data(obj.place_of_origin) if obj.place_of_origin else ''

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

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class StudySerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    pi_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='pi', required=False, allow_null=True
    )
    coordinator_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='coordinator', required=False, allow_null=True
    )
    sponsor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='sponsor', required=False, allow_null=True
    )
    pi_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), write_only=True, required=False)
    coordinator_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), write_only=True, required=False)
    
    # Read-only fields for current assignments
    assigned_pis = UserSerializer(many=True, read_only=True)
    assigned_coordinators = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Study
        fields = [
            'id', 'title', 'full_title', 'description', 'protocol_id', 'sponsor_name', 'study_type', 'status',
            'pi_id', 'coordinator_id', 'sponsor_id', 'pi_ids', 'coordinator_ids',
            'assigned_pis', 'assigned_coordinators', 'approval_status', 'created_by',
            'primary_indication', 'trial_model', 'is_double_blind', 'has_placebo_control',
            'has_screening_log', 'shipment_mode', 'consent_mode', 'condition',
            'trial_format', 'benefit', 'duration', 'tags', 'compensation', 'location',
            'time_commitment', 'overview', 'timeline', 'kits_info', 'safety_info',
            'privacy_standards', 'remote_participation', 'start_date', 'end_date',
            'launch_date', 'irb_status', 'target_screened', 'actual_screened',
            'proposal_source', 'proposal_submitted_date', 'agreement_signed_date',
            'contract_status', 'sponsor_contact_name', 'sponsor_contact_email'
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

class ParticipantSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    gender = serializers.SerializerMethodField()
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Participant
        fields = ['id', 'study', 'user', 'user_details', 'participant_sid', 'status', 'gender', 'dob', 'assigned_arm', 'is_locked', 'completion_date', 'created_at']

    def get_gender(self, obj):
        return obj.decrypted_gender

class DeIdentifiedParticipantSerializer(SanitizedModelSerializer):
    """Restricted view for Sponsors (No PII)"""
    id = serializers.CharField(read_only=True)
    age = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    
    class Meta:
        model = Participant
        fields = ['id', 'study', 'participant_sid', 'status', 'gender', 'age', 'assigned_arm', 'completion_date']

    def get_gender(self, obj):
        return obj.decrypted_gender

    def get_age(self, obj):
        if not obj.dob: return None
        from datetime import date
        today = date.today()
        return today.year - obj.dob.year - ((today.month, today.day) < (obj.dob.month, obj.dob.day))

class LeadSerializer(SanitizedModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'

class CommunicationLogSerializer(SanitizedModelSerializer):
    class Meta:
        model = CommunicationLog
        fields = '__all__'

class CompensationSerializer(SanitizedModelSerializer):
    class Meta:
        model = Compensation
        fields = '__all__'

class LabResultSerializer(SanitizedModelSerializer):
    class Meta:
        model = LabResult
        fields = '__all__'

class DataAuditLogSerializer(SanitizedModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = DataAuditLog
        fields = '__all__'

class VisitSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    notes = serializers.SerializerMethodField()
    class Meta:
        model = Visit
        fields = ['id', 'participant', 'visit_type', 'scheduled_date', 'actual_date', 'status', 'notes', 'measurements']

    def get_notes(self, obj):
        return obj.decrypted_notes

class KitSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Kit
        fields = '__all__'

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

class TaskSerializer(SanitizedModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class ParticipantTaskSerializer(SanitizedModelSerializer):
    task_details = TaskSerializer(source='task', read_only=True)
    class Meta:
        model = ParticipantTask
        fields = '__all__'

class ConsentSerializer(SanitizedModelSerializer):
    class Meta:
        model = Consent
        fields = '__all__'
        read_only_fields = ['agreed_at', 'ip_address']

class NewsSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = News
        fields = '__all__'

class EventSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Event
        fields = '__all__'

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
