from rest_framework import serializers
from .models import (
    Study, StudyAssignment, Participant, Visit, Kit, Form, FormResponse, 
    Task, ParticipantTask, Consent, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog, InterventionArm, News, Event
)
from authentication.models import User
from authentication.security import decrypt_data
from .utils.sanitizers import sanitize_html

class SanitizedModelSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        # Sanitize all incoming string data
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str):
                    data[key] = sanitize_html(value)
        return super().to_internal_value(data)

class UserSerializer(SanitizedModelSerializer):
    id = serializers.CharField(read_only=True)
    full_name = serializers.CharField()
    phone_number = serializers.SerializerMethodField()
    last_login_formatted = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'phone_number', 'profile_picture', 'password', 'last_login_formatted']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Use decrypted name for output
        ret['full_name'] = instance.decrypted_name
        return ret

    def get_phone_number(self, obj):
        return obj.decrypted_phone

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
    id = serializers.CharField(read_only=True)
    pi_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='pi', required=False, allow_null=True
    )
    coordinator_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='coordinator', required=False, allow_null=True
    )

    class Meta:
        model = Study
        fields = '__all__'

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
    class Meta:
        model = News
        fields = '__all__'

class EventSerializer(SanitizedModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
