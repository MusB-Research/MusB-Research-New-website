from rest_framework import serializers
from .models import (
    Study, StudyAssignment, Participant, Visit, Kit, Form, FormResponse, 
    Task, ParticipantTask, Consent, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog, InterventionArm, News, Event,
    Partnership, Publication, EducationMaterial
)
from authentication.models import User
from authentication.security import decrypt_data
from .utils.sanitizers import sanitize_html
import bson

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
        """Handle MongoDB ObjectId serialization and user fields."""
        ret = super().to_representation(instance)
        
        # Ensure we don't leak raw ObjectIds in JSON responses
        for key, value in ret.items():
            if isinstance(value, bson.ObjectId):
                ret[key] = str(value)
        
        # If created_by is present and is a User instance, show its ID or email
        if 'created_by' in ret and hasattr(instance, 'created_by') and instance.created_by:
            ret['created_by'] = str(instance.created_by.id)
            
        return ret

    def to_internal_value(self, data):
        # Sanitize all incoming string data.
        # data may be an immutable QueryDict (multipart upload) – copy it first.
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

    def create(self, validated_data):
        pi_ids = validated_data.pop('pi_ids', [])
        coordinator_ids = validated_data.pop('coordinator_ids', [])
        
        study = super().create(validated_data)
        
        # Create assignments
        for user in pi_ids:
            StudyAssignment.objects.get_or_create(study=study, user=user, role='PI')
        
        # Ensure lead PI is also in assignments
        if study.pi:
            StudyAssignment.objects.get_or_create(study=study, user=study.pi, role='PI')

        for user in coordinator_ids:
            StudyAssignment.objects.get_or_create(study=study, user=user, role='COORDINATOR')
        
        # Ensure lead coordinator is also in assignments
        if study.coordinator:
            StudyAssignment.objects.get_or_create(study=study, user=study.coordinator, role='COORDINATOR')
            
        return study

    def update(self, instance, validated_data):
        pi_ids = validated_data.pop('pi_ids', None)
        coordinator_ids = validated_data.pop('coordinator_ids', None)
        
        study = super().update(instance, validated_data)
        
        # Update PI assignments if provided
        if pi_ids is not None:
            instance.assignments.filter(role='PI').delete()
            for user in pi_ids:
                StudyAssignment.objects.get_or_create(study=instance, user=user, role='PI')
            
            # Sync back to primary PI field if it's null and we have PIs
            if not study.pi and pi_ids:
                study.pi = pi_ids[0]
                study.save()
        elif 'pi' in validated_data:
            # If ONLY lead PI was updated, ensure it's in the assignments list
            if study.pi:
                StudyAssignment.objects.get_or_create(study=instance, user=study.pi, role='PI')

        # Update Coordinator assignments if provided
        if coordinator_ids is not None:
            instance.assignments.filter(role='COORDINATOR').delete()
            for user in coordinator_ids:
                StudyAssignment.objects.get_or_create(study=instance, user=user, role='COORDINATOR')
            
            # Sync back to primary coordinator field if it's null and we have coords
            if not study.coordinator and coordinator_ids:
                study.coordinator = coordinator_ids[0]
                study.save()
        elif 'coordinator' in validated_data:
            # If ONLY lead coordinator was updated, ensure it's in the assignments list
            if study.coordinator:
                StudyAssignment.objects.get_or_create(study=instance, user=study.coordinator, role='COORDINATOR')
                
        return study

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

class DeIdentifiedParticipantSerializer(serializers.ModelSerializer):
    """Restricted view for Sponsors (No PII)"""
    id = serializers.CharField(read_only=True)
    # Mask DOB to just age or year
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

class DataAuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    def get_user_email(self, obj):
        if obj.user:
            return obj.user.email
        return None

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
    id = ObjectIdField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = '__all__'

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

class EventSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    class Meta:
        model = Event
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
