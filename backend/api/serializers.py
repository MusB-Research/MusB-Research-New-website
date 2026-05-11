from rest_framework import serializers
from .models import (
    Visit, Study, StudyAssignment, Participant, Form, FormResponse, Task, 
    ParticipantTask, StaffTask, Consent, ConsentTemplate, Lead, CommunicationLog, 
    Compensation, LabResult, DataAuditLog, InterventionArm,
    News, Event, FacilityInquiry, Candidate, NewsletterSubscriber,
    BookletDownloadRequest, Partnership, Publication, EducationMaterial,
    StudyInquiry, ClinicalConversation, ClinicalMessage,
    DosingLog, AEReport, Document, Notification, ProgressReport,
    StudyActionRequest, DailyMedicationLog, AssignedForm, SponsorOrganization,
    StudyKit, QuestionnaireTemplate, StudyQuestionnaire, QuestionnaireScheduleInstance,
    Technology, InnovationPageSettings, SponsorInquiry, TeamMember,
ClinicalAuditLog, PIIRevealLog,
    StaffMember, Advisor, ClinicalCollaborator
)

from authentication.models import User, Invitation
from authentication.security import decrypt_data
from .utils.sanitizers import sanitize_html
import bson
from bson import ObjectId
import os
import logging
import datetime
import json

logger = logging.getLogger(__name__)

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
            return ObjectId(data)
        except Exception:
            raise serializers.ValidationError(f"Invalid ObjectId: {data}")

class SanitizedModelSerializer(serializers.ModelSerializer):
    id = ObjectIdField(read_only=True)

    @staticmethod
    def sanitize_data(data):
        """Recursively convert ObjectIds and other non-serializable types to strings."""
        if isinstance(data, dict):
            # Optimization: use dict comprehension
            return {k: SanitizedModelSerializer.sanitize_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            # Optimization: use list comprehension
            return [SanitizedModelSerializer.sanitize_data(v) for v in data]
        # Faster type check for common BSON type
        elif type(data).__name__ == 'ObjectId':
            return str(data)
        return data

    def to_representation(self, instance):
        """Optimized MongoDB ObjectId serialization and conditional decryption."""
        ret = super().to_representation(instance)
        
        # 1. Targeted Sanitization (Only if keys exist)
        for k, v in ret.items():
            if type(v).__name__ == 'ObjectId':
                ret[k] = str(v)
            elif isinstance(v, (list, dict)):
                 ret[k] = self.sanitize_data(v)

        # Optimization: Early exit if decryption is skipped via context
        if self.context.get('skip_decryption'):
            return ret

        # Performance: Only run this if we are not in a list view or if explicitly authorized
        request = self.context.get('request')
        user = request.user if request else None
        
        # Optimization: Early exit if user is not staff/authorized for PII
        # PI and Coordinators are authorized. Participants are authorized for their own data.
        is_authorized = user and user.is_authenticated and (user.role or '').upper() in ['SUPER_ADMIN', 'ADMIN', 'PI', 'COORDINATOR']
        
        for key, value in ret.items():
            if isinstance(value, str) and value.startswith('gAAAA'):
                # Redundancy check: if the serializer already has a 'decrypted_' version of this field, skip it
                if f"decrypted_{key}" in ret or key in ['phone_number', 'full_address', 'npi', 'qualifications']:
                    # We usually want to keep the raw encrypted value in the DB field and use the decrypted_ field for UI
                    continue

                can_decrypt = is_authorized
                if not can_decrypt and user and user.is_authenticated:
                    # Resource owner check
                    iid = str(instance.pk) if hasattr(instance, 'pk') else None
                    uid = str(user.pk) if hasattr(user, 'pk') else None
                    if iid and uid and iid == uid:
                        can_decrypt = True
                    elif hasattr(instance, 'user') and instance.user:
                        i_user_pk = str(instance.user.pk) if hasattr(instance.user, 'pk') else None
                        if i_user_pk and uid and i_user_pk == uid:
                            can_decrypt = True
                
                if can_decrypt:
                    try:
                        decrypted = decrypt_data(value)
                        if decrypted != value:
                            ret[key] = decrypted
                    except:
                        pass
        return ret

    def to_internal_value(self, data):
        # Sanitize all incoming string data.
        # IMPORTANT: Only sanitize plain strings — do NOT touch lists/dicts/objects
        # which may already be correctly parsed by a subclass's to_internal_value.
        try:
            mutable_data = data.dict() if hasattr(data, 'dict') else dict(data)
        except Exception:
            mutable_data = data

        if isinstance(mutable_data, dict):
            for key, value in list(mutable_data.items()):
                # Only sanitize plain strings — never mutate lists, dicts, or other types
                if isinstance(value, str):
                    mutable_data[key] = sanitize_html(value)
                # If a value is a list of strings (e.g. tags), sanitize each string element
                elif isinstance(value, list):
                    mutable_data[key] = [
                        sanitize_html(v) if isinstance(v, str) else v
                        for v in value
                    ]

        return super().to_internal_value(mutable_data)

class UserSerializer(SanitizedModelSerializer):
    last_login_formatted = serializers.SerializerMethodField()
    date_joined_formatted = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    
    # Aliases for frontend compatibility
    mobile_number = serializers.CharField(source='phone_number', required=False, allow_blank=True)
    decrypted_name = serializers.SerializerMethodField()
    decrypted_phone = serializers.SerializerMethodField()
    decrypted_address = serializers.SerializerMethodField()
    decrypted_npi = serializers.SerializerMethodField()
    decrypted_qualifications = serializers.SerializerMethodField()

    def get_decrypted_name(self, obj):
        try:
            return obj.decrypted_name
        except Exception:
            return obj.full_name or obj.email

    def get_decrypted_phone(self, obj):
        """Always return the decrypted phone_number using the model's property."""
        try:
            return obj.decrypted_phone or ''
        except Exception:
            return ''

    def get_decrypted_address(self, obj):
        """Always return the decrypted full_address using the model's property."""
        try:
            return obj.decrypted_address or ''
        except Exception:
            return ''

    def get_decrypted_npi(self, obj):
        try:
            return obj.decrypted_npi or ''
        except Exception:
            return ''

    def get_decrypted_qualifications(self, obj):
        try:
            return obj.decrypted_qualifications or ''
        except Exception:
            return ''
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'decrypted_name', 'decrypted_phone', 'decrypted_address',
            'decrypted_npi', 'decrypted_qualifications',
            'role', 'phone_number', 'mobile_number',
            'profile_picture', 'profile_image', 'password', 'last_login_formatted', 'date_joined_formatted',
            'full_address', 'city', 'state', 'zip_code', 'country', 'place_of_origin',
            'date_of_birth', 'age', 'gender', 'has_active_enrollment',
            'medical_licence', 'medical_licence_expiry', 'insurance_certificate', 'insurance_expiry',
            'cv_document', 'cv_expiry', 'gcp_training', 'gcp_training_expiry', 'financial_disclosure',
            'npi', 'qualifications',
            'must_change_password', 'profile_completed', 'is_screener_completed', 'is_active', 'timezone',
            'status', 'affiliation', 'assigned_studies', 'created_by',
            'first_name', 'last_name', 'google_auth',
            'is_mellow_member', 'lat', 'lng', 'organization', 'bio'
        ]

    def validate_status(self, value):
        if value:
            return value.upper()
        return value

    def validate_role(self, value):
        if value:
            return value.upper()
        return value

    def validate_affiliation(self, value):
        if value:
            return value.upper()
        return value
        
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        
        # 2. Targeted Decryption
        for field, val in ret.items():
            if isinstance(val, str) and val.startswith('gAAAA'):
                try:
                    decrypted = decrypt_data(val)
                    if decrypted and decrypted != val:
                        ret[field] = decrypted
                except:
                    pass
        
        # Explicit priority for decrypted properties to ensure UI consistency
        if hasattr(instance, 'decrypted_name'):
             ret['decrypted_name'] = instance.decrypted_name

        if hasattr(instance, 'decrypted_phone') and instance.decrypted_phone:
             ret['decrypted_phone'] = instance.decrypted_phone
             if ret.get('mobile_number') and str(ret.get('mobile_number')).startswith('gAAAA'):
                 ret['mobile_number'] = instance.decrypted_phone
        
        if hasattr(instance, 'decrypted_address') and instance.decrypted_address:
             ret['decrypted_address'] = instance.decrypted_address
             if ret.get('full_address') and str(ret.get('full_address')).startswith('gAAAA'):
                 ret['full_address'] = instance.decrypted_address
                    
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

class UserBriefSerializer(SanitizedModelSerializer):
    """High-Performance light-weight user serializer for dashboard lists."""
    decrypted_name = serializers.SerializerMethodField()

    def get_decrypted_name(self, obj):
        try:
            return obj.decrypted_name
        except Exception:
            return obj.full_name or obj.email

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'decrypted_name', 'role', 'status', 'affiliation', 'profile_picture']



class DocumentSerializer(SanitizedModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'title', 'study', 'file', 'file_url', 'version', 'visibility', 'is_archived', 'uploaded_at']

    def to_internal_value(self, data):
        """Map frontend protocol ID to study ObjectId if needed."""
        # Handle study lookup if protocol_id string is passed
        if 'study' in data and isinstance(data['study'], str):
            if data['study'] == 'all':
                raise serializers.ValidationError({"study": "You must select a specific study, not 'All Studies', to upload a document."})
            import bson
            if not bson.ObjectId.is_valid(data['study']):
                study_obj = Study.objects.filter(protocol_id=data['study']).first()
                if study_obj:
                    data['study'] = str(study_obj.id)

        # Handle visibility if sent as string (common in multipart/form-data)
        if 'visibility' in data and isinstance(data['visibility'], str):
            import json
            try:
                data['visibility'] = json.loads(data['visibility'])
            except:
                pass

        return super().to_internal_value(data)

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
    pi_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)
    coordinator_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)
    sponsor_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)

    # --- Explicit optional overrides for fields that are required in the DB model ---
    # 'sponsor_name' and 'title' have no blank=True in the model, but we handle defaults here.
    title = serializers.CharField(required=False, allow_blank=True, default='Untitled Study')
    sponsor_name = serializers.CharField(required=False, allow_blank=True, default='')
    study_type = serializers.CharField(required=False, default='IN_PERSON')
    status = serializers.CharField(required=False, default='DRAFT')
    stage = serializers.CharField(required=False, default='DRAFT')
    
    REWARD_TYPE_CHOICES = [
        ('CASH', 'Cash'), ('COUPONS', 'Coupons'), ('MASTER_CARD', 'Master Card'),
        ('VISA_CARD', 'Visa Card'), ('WALMART_CARDS', 'Walmart Cards'),
        ('TARGET_CARD', 'Target Card'), ('CVS_CARD', 'CVS Card'),
        ('PUBLIX_CARDS', 'Publix Cards'), ('MIXED', 'Mixed (Both)')
    ]
    REWARD_LOGIC_CHOICES = [
        ('PER_TASK', 'Per Task Completion'),
        ('PER_VISIT', 'Per Visit Completion'),
        ('FULL_STUDY', 'Full Study Completion')
    ]
    
    reward_type = serializers.ChoiceField(choices=REWARD_TYPE_CHOICES, required=False, default='CASH')
    reward_logic = serializers.ChoiceField(choices=REWARD_LOGIC_CHOICES, required=False, default='PER_TASK')
    reward_config = serializers.JSONField(required=False, default=dict)
    compensation = serializers.CharField(required=False, allow_blank=True, default='')
    compensation_currency = serializers.CharField(required=False, allow_blank=True, default='USD')
    tags = serializers.JSONField(required=False, default=list)
    timeline = serializers.JSONField(required=False, default=list)
    privacy_standards = serializers.JSONField(required=False, default=list)
    target_subjects = serializers.IntegerField(required=False, default=0)
    target_screened = serializers.IntegerField(required=False, default=0)
    study_questionnaires = serializers.JSONField(required=False, write_only=True)

    # Read-only nested fields ---
    # consent_templates is a reverse FK relation — MUST be read_only, never required on write
    consent_templates = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    assigned_pis = UserSerializer(many=True, read_only=True)
    assigned_coordinators = UserSerializer(many=True, read_only=True)
    assigned_sponsors = UserSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)

    PHASE_CHOICES = [
        ('N/A', 'N/A'),
        ('PHASE_0', 'Phase 0'),
        ('PHASE_1', 'Phase 1'),
        ('PHASE_1_2', 'Phase 1/2'),
        ('PHASE_2', 'Phase 2'),
        ('PHASE_2_3', 'Phase 2/3'),
        ('PHASE_3', 'Phase 3'),
        ('PHASE_4', 'Phase 4'),
        ('PILOT', 'Pilot Study'),
        ('BIOEQUIVALENCE', 'Bioequivalence'),
    ]
    phase = serializers.ChoiceField(choices=PHASE_CHOICES, required=False, allow_blank=True, default='N/A')
    consent_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Study
        fields = [
            'id', 'title', 'full_title', 'description', 'protocol_id', 'sponsor_name', 'study_type', 'status', 'stage',
            'pi_id', 'coordinator_id', 'sponsor_id', 'sponsor_org_id', 'pi_ids', 'coordinator_ids', 'sponsor_ids',
            'assigned_pis', 'assigned_coordinators', 'assigned_sponsors', 'approval_status', 'created_by', 'created_by_role',
            'primary_indication', 'trial_model', 'phase', 'masking_strategy', 'is_double_blind', 'has_placebo_control',
            'has_screening_log', 'shipment_mode', 'consent_mode', 'condition', 'show_dosing_log', 'show_ae_report', 'show_lab_upload', 'is_archived',
            'trial_format', 'benefit', 'duration', 'tags', 'compensation', 'compensation_currency', 'location',
            'time_commitment', 'overview', 'participation_message', 'timeline', 'safety_info',
            'privacy_standards', 'remote_participation', 'start_date', 'end_date',
            'launch_date', 'irb_status', 'target_subjects', 'target_screened', 'actual_screened',
            'proposal_source', 'proposal_submitted_date', 'agreement_signed_date',
            'contract_status', 'sponsor_contact_name', 'sponsor_contact_email',
            'reward_type', 'reward_logic', 'reward_config',
            'consent_content', 'require_participant_sig', 'require_cc_verification', 'require_pi_signoff', 'require_lar',
            'consent_pdf_template', 'consent_pdf_url', 'consent_templates',
            'documents', 'countries',
            'study_questionnaires', 'screener_config', 'screener_pdf_template', 'avg_screener_duration',
            'rct_design', 'medication_supply', 'has_study_kit', 'consent_collection',
            'created_at', 'updated_at'
        ]

    def get_consent_pdf_url(self, obj):
        if not obj.consent_pdf_template: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.consent_pdf_template.url)
        return obj.consent_pdf_template.url

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Optimized ID Extraction: Avoids 3 database queries per object by using prefetched list
        all_assignments = list(instance.assignments.all())
        ret['pi_ids'] = [str(a.user_id) for a in all_assignments if a.role == 'PI']
        ret['coordinator_ids'] = [str(a.user_id) for a in all_assignments if a.role == 'COORDINATOR']
        ret['sponsor_ids'] = [str(a.user_id) for a in all_assignments if a.role == 'SPONSOR_ADMIN']
        
        # Include questionnaires in the representation (since the field is write_only)
        if hasattr(instance, 'study_questionnaires'):
            ret['study_questionnaires'] = StudyQuestionnaireSerializer(instance.study_questionnaires.all(), many=True).data
            
        return ret

    def to_internal_value(self, data):
        # Convert to mutable dict if it's a QueryDict (from Multipart/FormData)
        if hasattr(data, 'dict'):
            data = data.dict()
        elif not isinstance(data, dict):
            data = dict(data)
        else:
            data = data.copy()

        # Strip unknown/extra frontend-only fields
        FRONTEND_ONLY_FIELDS = {
            'reward_amount', 'masking', 'indication', 'execution_type',
            'startDate', 'endDate',
            'documents', 'assigned_pis', 'assigned_coordinators', 'assigned_sponsors', 'consent_templates'
        }
        
        if isinstance(data, dict):
            # Map frontend keys to backend fields
            if 'consent_pdf_file' in data:
                data['consent_pdf_template'] = data.pop('consent_pdf_file')
            
            if 'screener_pdf_file' in data:
                data['screener_pdf_template'] = data.pop('screener_pdf_file')
            
            # Map Screener Configuration
            if 'screenerQuestions' in data:
                screener_qs = data.pop('screenerQuestions')
                if isinstance(screener_qs, str):
                    try:
                        screener_qs = json.loads(screener_qs)
                    except (ValueError, TypeError):
                        pass
                
                import datetime
                data['screener_config'] = {
                    'questions': screener_qs if isinstance(screener_qs, (list, dict)) else [],
                    'last_updated': str(datetime.datetime.now())
                }
            
            # Map Consent Text
            if 'extractedConsentText' in data:
                data['consent_content'] = data.pop('extractedConsentText')

            # --- Map Date Fields (Frontend camelCase -> Backend snake_case) ---
            if 'startDate' in data and not data.get('start_date'):
                data['start_date'] = data.pop('startDate')
            if 'endDate' in data and not data.get('end_date'):
                data['end_date'] = data.pop('endDate')

            # --- Map Sponsor (Frontend 'sponsor' -> Backend 'sponsor_id' or 'sponsor_org_id') ---
            if 'sponsor' in data:
                val = data.get('sponsor')
                if val:
                    import bson
                    if bson.ObjectId.is_valid(val):
                        # Check if it's an organization or a user
                        if SponsorOrganization.objects.filter(id=val).exists():
                            data['sponsor_org_id'] = val
                        elif User.objects.filter(id=val).exists():
                            data['sponsor_id'] = val
                    else:
                        # Fallback to name
                        data['sponsor_name'] = val

            # Parse JSON strings for JSONFields
            json_fields = [
                'screener_config', 'reward_config', 'timeline', 'tags', 'privacy_standards', 
                'consent_collection', 'study_questionnaires',
            ]
            for field in json_fields:
                val = data.get(field)
                if val and isinstance(val, str):
                    if (val.strip().startswith('{') and val.strip().endswith('}')) or (val.strip().startswith('[') and val.strip().endswith(']')):
                        try:
                            data[field] = json.loads(val)
                        except (ValueError, TypeError):
                            pass

            # --- Resolve pi_ids / coordinator_ids / sponsor_ids ---
            # PrimaryKeyRelatedField(many=True) expects a list of PKs (or User instances).
            # We accept: list of IDs, comma-string, or JSON string of IDs.
            for id_field in ['pi_ids', 'coordinator_ids', 'sponsor_ids']:
                val = data.get(id_field)
                if val is None:
                    continue
                # Parse JSON string → list
                if isinstance(val, str):
                    val = val.strip()
                    if val.startswith('['):
                        try: val = json.loads(val)
                        except: val = []
                    elif ',' in val:
                        val = [v.strip() for v in val.split(',') if v.strip()]
                    elif val:
                        val = [val]
                    else:
                        val = []
                # Ensure it's a clean list of ObjectIds for MongoDB
                if isinstance(val, list):
                    import bson
                    cleaned_ids = []
                    for v in val:
                        if v:
                            v_str = str(v)
                            if bson.ObjectId.is_valid(v_str):
                                cleaned_ids.append(bson.ObjectId(v_str))
                            else:
                                cleaned_ids.append(v_str)
                    data[id_field] = cleaned_ids
                else:
                    data.pop(id_field, None)

            # Robust mapping for sponsor_org_id if arriving as string
            if 'sponsor_org_id' in data and isinstance(data['sponsor_org_id'], str):
                import bson
                if bson.ObjectId.is_valid(data['sponsor_org_id']):
                    data['sponsor_org_id'] = bson.ObjectId(data['sponsor_org_id'])

            # Strip frontend helper fields
            data = {k: v for k, v in data.items() if k not in FRONTEND_ONLY_FIELDS}

            # Handle FileField string URLs (don't try to save a string URL to a FileField)
            if 'consent_pdf_template' in data and isinstance(data.get('consent_pdf_template'), str):
                data.pop('consent_pdf_template')
            if 'screener_pdf_template' in data and isinstance(data.get('screener_pdf_template'), str):
                data.pop('screener_pdf_template')

        try:
            return super().to_internal_value(data)
        except serializers.ValidationError:
            raise
        except Exception as e:
            import traceback
            raise serializers.ValidationError({"detail": str(e), "trace": traceback.format_exc()[-500:]})

    def update(self, instance, validated_data):
        # Extract relationship data before popping.
        # NOTE: pi_ids/coordinator_ids/sponsor_ids come as lists of User objects
        # after PrimaryKeyRelatedField validation, so we convert them to PKs.
        def _extract_ids(field_name):
            val = validated_data.pop(field_name, None)
            if val is None: return None
            # PrimaryKeyRelatedField(many=True) returns a list of model instances
            result = []
            for item in val:
                if hasattr(item, 'pk'):
                    result.append(item.pk)
                else:
                    result.append(item)
            return result

        pi_ids = _extract_ids('pi_ids')
        coordinator_ids = _extract_ids('coordinator_ids')
        sponsor_ids = _extract_ids('sponsor_ids')
        study_questionnaires = validated_data.pop('study_questionnaires', None)

        # Handle Many-to-Many Personnel Assignments
        from .models import StudyAssignment
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        def update_assignments(user_ids, role):
            if user_ids is None: return
            # 1. Remove existing assignments for this role not in the new list
            instance.assignments.filter(role=role).exclude(user_id__in=user_ids).delete()
            # 2. Add new assignments
            for uid in user_ids:
                if uid:
                    StudyAssignment.objects.get_or_create(study=instance, user_id=uid, role=role)
            # 3. Sync primary direct field for the first user
            if user_ids and len(user_ids) > 0:
                field_map = {'PI': 'pi', 'COORDINATOR': 'coordinator', 'SPONSOR_ADMIN': 'sponsor'}
                field_name = field_map.get(role)
                if field_name:
                    setattr(instance, field_name + '_id', user_ids[0])
                    # If it's a sponsor, try to sync sponsor_name
                    if role == 'SPONSOR_ADMIN':
                        try:
                            user = User.objects.get(id=user_ids[0])
                            instance.sponsor_name = user.get_full_name() or user.username
                        except: pass

        update_assignments(pi_ids, 'PI')
        update_assignments(coordinator_ids, 'COORDINATOR')
        update_assignments(sponsor_ids, 'SPONSOR_ADMIN')

        # Update the study instance
        instance = super().update(instance, validated_data)
        
        # Handle Clinical Instruments (StudyQuestionnaire)
        if study_questionnaires is not None:
            from .models import StudyQuestionnaire
            existing_q_ids = set()
            for q_data in study_questionnaires:
                t_id = q_data.get('template_id') or q_data.get('template') or q_data.get('id')
                if not t_id: continue
                
                existing_q_ids.add(str(t_id))
                defaults = {}
                if 'mode' in q_data:
                    defaults['mode'] = q_data['mode']
                
                # Safe mapping for repeat_type
                freq = q_data.get('frequency') or q_data.get('repeat_type')
                if freq in ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']:
                    defaults['repeat_type'] = freq
                elif freq == 'One time only':
                    defaults['repeat_type'] = 'CUSTOM'
                    defaults['repeat_count'] = 1

                if 'frequency_interval' in q_data:
                    try: defaults['frequency_interval'] = int(q_data['frequency_interval'])
                    except: pass
                if 'frequency_unit' in q_data:
                    defaults['frequency_unit'] = q_data['frequency_unit']
                if 'repeat_count' in q_data:
                    try: defaults['repeat_count'] = int(q_data['repeat_count'])
                    except: pass
                if 'schedule_name' in q_data:
                    defaults['schedule_name'] = q_data['schedule_name']
                if 'allow_late_submission' in q_data:
                    defaults['allow_late_submission'] = bool(q_data['allow_late_submission'])

                StudyQuestionnaire.objects.update_or_create(
                    study=instance,
                    template_id=t_id,
                    defaults=defaults
                )
            # Remove instruments no longer selected
            instance.study_questionnaires.exclude(template_id__in=existing_q_ids).delete()

        # Final safety sync: ensure direct fields (pi, coordinator, sponsor) are in StudyAssignments
        for role, field in [('PI', 'pi'), ('COORDINATOR', 'coordinator'), ('SPONSOR_ADMIN', 'sponsor')]:
            val = getattr(instance, field, None)
            if val:
                StudyAssignment.objects.get_or_create(study=instance, user=val, role=role)

        return instance

class StudyBriefSerializer(SanitizedModelSerializer):
    """High-Performance serializer for study lists/grids."""
    enrollment_count = serializers.SerializerMethodField()
    compliance_rate = serializers.SerializerMethodField()

    def get_enrollment_count(self, obj):
        return obj.participants.count()

    def get_compliance_rate(self, obj):
        # Calculate compliance across all participants and tasks
        # This is a broad estimate for the study directory
        try:
            instances = QuestionnaireScheduleInstance.objects.filter(participant__study=obj)
            total = instances.count()
            if total == 0: return 0
            completed = instances.filter(status__in=['COMPLETED', 'LATE']).count()
            return round((completed / total) * 100, 1)
        except Exception:
            return 0

    class Meta:
        model = Study
        fields = [
            'id', 'title', 'protocol_id', 'sponsor_name', 'study_type', 'status', 'stage',
            'created_at', 'updated_at', 'primary_indication', 'condition', 'phase',
            'is_archived', 'approval_status', 'consent_content', 'screener_config',
            'enrollment_count', 'compliance_rate', 'sponsor_id', 'sponsor_org_id'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Include personnel IDs for UI consistency and to prevent data loss in auto-saves
        try:
            all_assignments = instance.assignments.all()
            ret['pi_ids'] = [str(a.user_id) for a in all_assignments if a.role == 'PI']
            ret['coordinator_ids'] = [str(a.user_id) for a in all_assignments if a.role == 'COORDINATOR']
            ret['sponsor_ids'] = [str(a.user_id) for a in all_assignments if a.role == 'SPONSOR_ADMIN']
        except:
            ret['pi_ids'] = []
            ret['coordinator_ids'] = []
            ret['sponsor_ids'] = []
        return ret

class PublicStudySerializer(SanitizedModelSerializer):
    """Lighter version for discovery page to boost performance"""
    pi_details = serializers.SerializerMethodField()

    class Meta:
        model = Study
        fields = [
            'id', 'title', 'full_title', 'protocol_id', 'description', 'condition', 
            'duration', 'location', 'compensation', 'status', 'stage', 
            'tags', 'created_at', 'screener_config',
            'overview', 'benefit', 'participation_message',
            'require_participant_sig', 'require_cc_verification', 
            'require_pi_signoff', 'require_lar', 'consent_content', 'countries',
            'pi_details'
        ]
        ordering = ['created_at']

    def get_pi_details(self, obj):
        pi = obj.pi
        if pi:
            request = self.context.get('request')
            return {
                'name': pi.full_name or f"{pi.first_name} {pi.last_name}",
                'profile_picture': request.build_absolute_uri(pi.profile_image.url) if request and pi.profile_image else (pi.profile_picture or None),
                'qualifications': pi.qualifications or "MD, PhD",
                'bio': pi.bio or "Principal Investigator"
            }
        return None

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
    participant_name = serializers.CharField(source='participant.user.full_name', read_only=True)
    participant_sid = serializers.CharField(source='participant.participant_sid', read_only=True)
    
    # Coordinator info for the participant portal
    scheduled_by_details = UserSerializer(source='scheduled_by', read_only=True)
    scheduled_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
    
    updated_by_details = UserSerializer(source='updated_by', read_only=True)
    updated_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    # Study Staff Details (PI & Primary Coordinator)
    pi_details = serializers.SerializerMethodField()
    coordinator_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Visit
        fields = [
            'id', 'participant', 'participant_name', 'participant_sid', 'visit_type', 'scheduled_date', 
            'actual_date', 'status', 'notes', 'location', 'location_address', 'checklist', 
            'assessments', 'measurements', 'deviations', 'samples', 'dispensing', 
            'pi_approved', 'locked', 'scheduled_by', 'scheduled_by_details',
            'updated_by', 'updated_by_details', 'pi_details', 'coordinator_details'
        ]
        extra_kwargs = {
            'notes': {'write_only': True, 'required': False}
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Rule 9.4: Default medical node state
        if not ret.get('dispensing'):
             ret['dispensing'] = { 'dispensed': 'N/A', 'dose': 'N/A', 'compliance': 100 }
        return ret

    def get_notes(self, obj):
        return obj.decrypted_notes

    def get_pi_details(self, obj):
        pi = obj.participant.study.pi
        if pi:
            return {
                'name': pi.full_name,
                'email': pi.email,
                'phone': pi.decrypted_phone or pi.phone_number or 'N/A',
                'role': 'Investigator'
            }
        return None

    def get_coordinator_details(self, obj):
        coord = obj.participant.study.coordinator
        if coord:
            return {
                'name': coord.full_name,
                'email': coord.email,
                'phone': coord.decrypted_phone or coord.phone_number or 'N/A',
                'role': 'Study Coordinator'
            }
        return None

class VisitBriefSerializer(SanitizedModelSerializer):
    """Senior Developer: Lightweight visit serializer for timelines."""
    class Meta:
        model = Visit
        fields = ['id', 'visit_type', 'scheduled_date', 'actual_date', 'status', 'checklist']



class LeadSerializer(SanitizedModelSerializer):
    full_name = serializers.ReadOnlyField()

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
    participant_name = serializers.SerializerMethodField()

    def get_participant_name(self, obj):
        if not obj.participant: return "N/A"
        p = obj.participant
        if p.user:
            return getattr(p.user, 'decrypted_name', None) or p.user.full_name
        data = p.eligibility_data or {}
        return data.get('fullName') or data.get('full_name') or data.get('name') or p.participant_sid

    class Meta:
        model = AssignedForm
        fields = ['id', 'study', 'form', 'form_details', 'participant', 'participant_name', 'status', 'participant_signature', 'participant_signed_at', 'coordinator_signature', 'coordinator_signed_at', 'coordinator_user', 'pi_signature', 'pi_signed_at', 'pi_user', 'data', 'signed_pdf', 'signed_pdf_url', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['participant_signed_at', 'coordinator_signed_at', 'pi_signed_at']

    def get_signed_pdf_url(self, obj):
        if not obj.signed_pdf: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.signed_pdf.url)
        return obj.signed_pdf.url

class AssignedFormBriefSerializer(SanitizedModelSerializer):
    participant_name = serializers.SerializerMethodField()
    form_name = serializers.CharField(source='form.name', read_only=True)

    def get_participant_name(self, obj):
        if not obj.participant: return "N/S"
        p = obj.participant
        if p.user:
            return getattr(p.user, 'decrypted_name', None) or p.user.full_name
        data = p.eligibility_data or {}
        return data.get('fullName') or data.get('full_name') or data.get('name') or p.participant_sid

    class Meta:
        model = AssignedForm
        fields = ['id', 'study', 'participant', 'participant_name', 'form_name', 'status', 'due_date', 'created_at']

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

    def get_participant_name(self, obj):
        if not obj.participant: return "Anonymous"
        p = obj.participant
        if p.user:
            return getattr(p.user, 'decrypted_name', None) or p.user.full_name
        data = p.eligibility_data or {}
        return data.get('fullName') or data.get('full_name') or data.get('name') or p.participant_sid

    def get_study(self, obj):
        """Expose the participant's study ID so the frontend can filter tasks per-study."""
        try:
            return str(obj.participant.study_id)
        except Exception:
            return None

    def get_protocol_id(self, obj):
        try:
            return obj.participant.study.protocol_id
        except Exception:
            return "N/A"

    participant_sid = serializers.CharField(source='participant.participant_sid', read_only=True)
    participant_status = serializers.CharField(source='participant.status', read_only=True)

    class Meta:
        model = ParticipantTask
        fields = [
            'id', 'participant', 'participant_sid', 'participant_status', 'task', 'task_details', 'study', 'due_date', 
            'completed_at', 'status', 'visit_name', 'timeline_group', 'estimated_time', 
            'is_locked', 'current_data', 'assigned_form', 'assigned_form_details',
            'participant_name', 'protocol_id'
        ]
        extra_kwargs = {
            'task': {'required': False, 'allow_null': True}
        }


class StaffTaskSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    class Meta:
        model = StaffTask
        fields = '__all__'

class ConsentTemplateSerializer(SanitizedModelSerializer):
    class Meta:
        model = ConsentTemplate
        fields = [
            'id', 'study', 'created_by', 'title', 'version', 'status',
            'require_participant_sig', 'require_cc_verification', 'require_pi_signoff',
            'require_witness', 'require_lar', 'require_initials_on_pages', 'require_initial_sections',
            'must_scroll_full', 'must_answer_quiz', 'terms_content', 'irbNumber', 'irbApprovalDate',
            'effectiveDate', 'expirationDate', 'file', 'file_url', 'pageCount', 'placedFields', 'shortName',
            'signatureRequirements', 'completionRules'
        ]

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


    def to_internal_value(self, data):
        """Map frontend snake_case or camelCase keys to the correct internal field names."""
        # Create a mutable copy if it's a QueryDict or dict
        if hasattr(data, 'dict'):
            data = data.dict()
        else:
            data = data.copy() if isinstance(data, dict) else dict(data)

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
            if snake in data and (camel not in data or not data[camel]):
                data[camel] = data[snake]
        
        # Robust handling for empty strings on Date/Int fields that allow null
        date_fields = ['irbApprovalDate', 'effectiveDate', 'expirationDate']
        for field in date_fields:
            if field in data and data[field] == '':
                data[field] = None

        # Special handling for JSON fields coming from FormData (passed as strings)
        if 'placedFields' in data and isinstance(data['placedFields'], str):
            import json
            try:
                data['placedFields'] = json.loads(data['placedFields'])
            except:
                data['placedFields'] = []

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
    pi_user_name = serializers.CharField(source='pi_user.full_name', read_only=True)
    cc_user_name = serializers.CharField(source='cc_user.full_name', read_only=True)
    study_title = serializers.CharField(source='study.title', read_only=True)
    protocol_id = serializers.CharField(source='study.protocol_id', read_only=True)
    signed_pdf_url = serializers.SerializerMethodField()
    decrypted_name = serializers.SerializerMethodField()
    template_details = serializers.SerializerMethodField()
    
    # Auto-filled by the backend view — not required from the frontend
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    full_name = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Consent
        fields = [
            'id', 'study', 'participant', 'full_name', 'email', 
            'agreed_at', 'participant_signed_at', 'participant_signature',
            'cc_name', 'cc_signature', 'cc_verified', 'cc_verified_at', 'cc_user', 'cc_user_name',
            'pi_name', 'pi_signature', 'pi_verified', 'pi_verified_at', 'pi_user', 'pi_user_name',
            'signing_status', 'audit_trail', 'signed_pdf', 'signed_pdf_url',
            'protocol_id', 'study_title', 'decrypted_name', 'is_valid',
            'is_lar', 'lar_name', 'lar_relationship', 'lar_reason', 'template_details'
        ]
        read_only_fields = ['agreed_at', 'ip_address']

    def get_decrypted_name(self, obj):
        return obj.full_name or ''

    def get_template_details(self, obj):
        template = obj.template
        if not template: return None
        return {
            'terms_content': template.terms_content,
            'require_participant_sig': template.require_participant_sig,
            'require_cc_verification': template.require_cc_verification,
            'require_pi_signoff': template.require_pi_signoff,
            'require_witness': template.require_witness,
            'require_lar': template.require_lar
        }
    
    def to_internal_value(self, data):
        """Map frontend protocol ID to study ObjectId if needed."""
        if 'study' in data and isinstance(data['study'], str):
            import bson
            if not bson.ObjectId.is_valid(data['study']):
                study_obj = Study.objects.filter(protocol_id=data['study']).first()
                if study_obj:
                    data['study'] = str(study_obj.id)
        return super().to_internal_value(data)

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
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    user_role_label = serializers.CharField(source='sender.role', read_only=True)
    
    class Meta:
        model = ClinicalMessage
        fields = ['id', 'sender', 'sender_name', 'user_role_label', 'text', 'tag', 'attachment', 'is_from_pi', 'created_at']

class ClinicalConversationBriefSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    participant_sid = serializers.CharField(source='participant.participant_sid', read_only=True)
    participant_name = serializers.CharField(source='participant.user.full_name', read_only=True)
    study_protocol = serializers.CharField(source='study.protocol_id', read_only=True)
    assigned_coordinator = serializers.CharField(source='study.coordinator.full_name', read_only=True, allow_null=True)
    participant_status = serializers.CharField(source='participant.status', read_only=True)

    class Meta:
        model = ClinicalConversation
        fields = [
            'id', 'participant', 'participant_name', 'participant_sid', 'participant_status', 'study', 
            'study_protocol', 'status', 'is_flagged', 'last_message_preview', 
            'last_updated', 'created_at', 'assigned_coordinator'
        ]
        extra_kwargs = {
            'participant': {'required': False},
            'study': {'required': False}
        }

class ClinicalConversationSerializer(SanitizedModelSerializer):
    id = ObjectIdField(read_only=True)
    messages = ClinicalMessageSerializer(many=True, read_only=True)
    participant_sid = serializers.CharField(source='participant.participant_sid', read_only=True)
    participant_name = serializers.CharField(source='participant.user.full_name', read_only=True)
    study_protocol = serializers.CharField(source='study.protocol_id', read_only=True)
    assigned_coordinator = serializers.CharField(source='study.coordinator.full_name', read_only=True, allow_null=True)
    participant_status = serializers.CharField(source='participant.status', read_only=True)

    class Meta:
        model = ClinicalConversation
        fields = [
            'id', 'participant', 'participant_name', 'participant_sid', 'participant_status', 'study', 
            'study_protocol', 'status', 'is_flagged', 'last_message_preview', 
            'last_updated', 'created_at', 'messages', 'assigned_coordinator'
        ]
        extra_kwargs = {
            'participant': {'required': False},
            'study': {'required': False}
        }

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
    participant_sid = serializers.CharField(source='participant.participant_sid', read_only=True)
    participant_name = serializers.SerializerMethodField()
    supporting_file_url = serializers.SerializerMethodField()

    def get_participant_name(self, obj):
        try:
            p = obj.participant
            if p.user:
                return getattr(p.user, 'decrypted_name', None) or p.user.full_name
            data = p.eligibility_data or {}
            return data.get('fullName') or data.get('full_name') or data.get('name') or p.participant_sid
        except Exception:
            return 'Unknown'

    def get_supporting_file_url(self, obj):
        if not obj.supporting_file:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.supporting_file.url)
        return obj.supporting_file.url

    class Meta:
        model = DailyMedicationLog
        fields = [
            'id', 'participant', 'participant_sid', 'participant_name',
            'date', 'took_medicine', 'time_taken', 'full_dose', 'dose_amount', 'reason_missed',
            'noticed_side_effects', 'side_effect_description', 'side_effect_start_time',
            'side_effect_ongoing', 'severity', 'interfered_daily_activities', 'sought_medical_care',
            'ae_additional_comments', 'overall_feeling', 'health_updates',
            'supporting_file', 'supporting_file_url', 'is_draft', 'created_at', 'updated_at'
        ]
        read_only_fields = ['participant']



class StudyKitSerializer(SanitizedModelSerializer):
    participant_name = serializers.CharField(source='participant.user.full_name', read_only=True)
    participant_id = serializers.CharField(source='participant.participant_sid', read_only=True)
    protocol_id = serializers.CharField(source='study.protocol_id', read_only=True)
    participant_phone = serializers.SerializerMethodField()
    participant_address = serializers.SerializerMethodField()

    def get_participant_phone(self, obj):
        if not obj.participant:
            return "N/A"
        p = obj.participant
        if p.user:
            return getattr(p.user, 'decrypted_phone', None) or p.user.phone_number or "N/A"
        data = p.eligibility_data or {}
        return data.get('phone') or data.get('phoneNumber') or 'N/A'

    def get_participant_address(self, obj):
        if obj.address:
            return obj.address
        if not obj.participant:
            return "N/A"
        p = obj.participant
        if p.user:
            return getattr(p.user, 'decrypted_address', None) or p.user.full_address or p.user.zip_code or "N/A"
        data = p.eligibility_data or {}
        return data.get('location') or data.get('address') or data.get('zipCode') or 'N/A'

    class Meta:
        model = StudyKit
        fields = [
            'id', 'kit_number', 'kit_type', 'status', 'carrier', 
            'tracking_number', 'address', 'shipping_label_url', 
            'return_label_url', 'last_updated', 'created_at',
            'participant_name', 'participant_id', 'protocol_id',
            'study', 'participant', 'participant_phone', 'participant_address'
        ]
        read_only_fields = ['last_updated', 'created_at']

class ParticipantSerializer(SanitizedModelSerializer):
    kits = StudyKitSerializer(many=True, read_only=True)
    tasks = ParticipantTaskSerializer(many=True, read_only=True)


    id = serializers.CharField(read_only=True)
    gender = serializers.SerializerMethodField()
    user_details = UserSerializer(source='user', read_only=True)
    study_name = serializers.CharField(source='study.title', read_only=True)
    protocol_id = serializers.CharField(source='study.protocol_id', read_only=True)
    coordinator_name = serializers.CharField(source='study.coordinator.full_name', read_only=True, allow_null=True)
    visits = VisitSerializer(many=True, read_only=True)
    ae_reports = AEReportSerializer(many=True, read_only=True)
    daily_logs = DailyMedicationLogSerializer(many=True, read_only=True)
    lab_results = LabResultSerializer(many=True, read_only=True)
    consent_records = ConsentSerializer(many=True, read_only=True)
    age = serializers.SerializerMethodField()
    assigned_arm_name = serializers.CharField(source='assigned_arm.name', read_only=True, allow_null=True)
    condition = serializers.CharField(source='study.condition', read_only=True, allow_null=True)
    study_type = serializers.CharField(source='study.study_type', read_only=True, allow_null=True)
    
    reviewer_name = serializers.CharField(source='reviewed_by.full_name', read_only=True, allow_null=True)
    participant_status = serializers.CharField(source='status', read_only=True)

    # Identity Resolution Fields (Fallbacks for guest/anonymous participants)
    display_name = serializers.SerializerMethodField()
    display_email = serializers.SerializerMethodField()
    display_phone = serializers.SerializerMethodField()
    display_address = serializers.SerializerMethodField()

    def get_display_name(self, obj):
        if obj.user:
            # Senior Developer: Use the existing decrypted_name or full_name
            name = getattr(obj.user, 'decrypted_name', None) or obj.user.full_name
            if name: return name
        
        # Fallback to eligibility data (Screener)
        data = obj.eligibility_data or {}
        return data.get('fullName') or data.get('full_name') or data.get('name') or obj.participant_sid

    def get_display_email(self, obj):
        if obj.user:
            return obj.user.email
        
        # Fallback to eligibility data
        data = obj.eligibility_data or {}
        return data.get('email') or 'N/A'

    def get_display_phone(self, obj):
        if obj.user:
            return getattr(obj.user, 'decrypted_phone', None) or obj.user.phone_number
        
        # Fallback to eligibility data
        data = obj.eligibility_data or {}
        return data.get('phone') or data.get('phoneNumber') or 'N/A'

    def get_display_address(self, obj):
        if obj.user:
            return getattr(obj.user, 'decrypted_address', None) or obj.user.full_address or obj.user.zip_code
        
        # Fallback to eligibility data
        data = obj.eligibility_data or {}
        return data.get('location') or data.get('address') or data.get('zipCode') or 'N/A'

    class Meta:
        model = Participant
        fields = [
            'id', 'participant_sid', 'participant_status', 'user', 'user_details', 'study', 'study_name', 'protocol_id',
            'coordinator_name', 'gender', 'dob', 'age', 'status', 'assigned_arm', 'completion_date',
            'condition', 'study_type', 'eligibility_data',
            'display_name', 'display_email', 'display_phone', 'display_address',
            'created_at', 'updated_at', 'reviewed_at', 'reviewed_by', 'reviewer_name',
            'visits', 'ae_reports', 'daily_logs', 'lab_results', 'consent_records',
            'kits', 'tasks',

            'coordinator_approved', 'coordinator_approved_at', 'coordinator_signature',
            'pi_approved', 'pi_approved_at', 'pi_signature', 'approval_status',
            'consent_details', 'randomization_details', 'assigned_arm', 'assigned_arm_name'
        ]

    def validate(self, data):
        """
        PLATFORM CORE LOGIC: Prevent multi-study active enrollment.
        A participant cannot be 'ACTIVE', 'RANDOMIZED', or 'CONSENTED' in more than one study at a time.
        """
        user = data.get('user') or self.context['request'].user
        study = data.get('study')
        
        if user and study:
            from django.db.models import Q
            active_studies = Participant.objects.filter(
                user=user,
                status__in=['CONSENTED', 'RANDOMIZED', 'ACTIVE']
            ).exclude(study=study)
            
            if active_studies.exists():
                raise serializers.ValidationError({
                    "detail": "Action Blocked: You are currently active in another clinical protocol. You must formally complete or withdraw from your current study before joining a new one."
                })
        return data

    def get_gender(self, obj):
        return obj.gender or (obj.user.gender if obj.user else None)

    def get_age(self, obj):
        # Fallback priority: 1. Participant.dob, 2. User.date_of_birth, 3. User.age
        dob = obj.dob or (obj.user.date_of_birth if obj.user else None)
        if not dob:
            return obj.user.age if obj.user else None
            
        from datetime import date
        today = date.today()
        # Calculate age correctly accounting for month/day
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    
    # Helper to avoid issues with leap years or missing days
    def safe_day(self, obj):
        return obj.dob.day if obj.dob else 1

class ParticipantBriefSerializer(SanitizedModelSerializer):
    """Senior Developer: Light-weight serializer for dashboard lists to prevent 15s loading delays."""
    id = serializers.CharField(read_only=True)
    user_details = UserBriefSerializer(source='user', read_only=True)
    study_name = serializers.CharField(source='study.title', read_only=True)
    protocol_id = serializers.CharField(source='study.protocol_id', read_only=True)
    visits = VisitBriefSerializer(many=True, read_only=True)
    ae_reports = AEReportSerializer(many=True, read_only=True)
    daily_logs = DailyMedicationLogSerializer(many=True, read_only=True)
    
    display_name = serializers.SerializerMethodField()
    display_email = serializers.SerializerMethodField()
    display_phone = serializers.SerializerMethodField()
    display_address = serializers.SerializerMethodField()

    def get_display_name(self, obj):
        if obj.user:
            name = getattr(obj.user, 'decrypted_name', None) or obj.user.full_name
            if name: return name
        data = obj.eligibility_data or {}
        return data.get('fullName') or data.get('full_name') or data.get('name') or obj.participant_sid

    def get_display_email(self, obj):
        if obj.user: return obj.user.email
        data = obj.eligibility_data or {}
        return data.get('email') or 'N/A'

    def get_display_phone(self, obj):
        if obj.user: return getattr(obj.user, 'decrypted_phone', None) or obj.user.phone_number
        data = obj.eligibility_data or {}
        return data.get('phone') or data.get('phoneNumber') or 'N/A'

    def get_display_address(self, obj):
        if obj.user: return getattr(obj.user, 'decrypted_address', None) or obj.user.full_address or obj.user.zip_code
        data = obj.eligibility_data or {}
        return data.get('location') or data.get('address') or data.get('zipCode') or 'N/A'
    # Removed nested heavy relations (visits, ae_reports) from brief list view to fix 1.6s delay
    class Meta:
        model = Participant
        fields = [
            'id', 'study', 'study_name', 'protocol_id', 'user', 'user_details',
            'participant_sid', 'status', 'created_at', 'reviewed_at',
            'display_name', 'display_email', 'display_phone', 'display_address',
            'visits', 'ae_reports', 'daily_logs',
            'coordinator_approved', 'pi_approved', 'approval_status'
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
        return obj.gender

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
    participant_details = ParticipantBriefSerializer(source='participant', read_only=True)
    study_details = StudyBriefSerializer(source='study', read_only=True)
    task_details = TaskSerializer(source='task', read_only=True)
    visit_details = VisitSerializer(source='visit', read_only=True)
    study_protocol = serializers.CharField(source='study.protocol_id', read_only=True)

    class Meta:
        model = Compensation
        fields = [
            'id', 'participant', 'study', 'study_protocol', 'visit', 'task', 
            'participant_details', 'study_details', 'task_details', 'visit_details',
            'transaction_type', 'description', 'amount', 'currency', 'status', 'payment_method', 
            'paid_at', 'notes', 'card_number', 'payment_reference', 'created_at'
        ]
class QuestionnaireTemplateSerializer(SanitizedModelSerializer):
    used_in_studies = serializers.SerializerMethodField()

    class Meta:
        model = QuestionnaireTemplate
        fields = '__all__'

    def get_used_in_studies(self, obj):
        # Use Django's prefetch cache (key = 'studyquestionnaire_set', the default reverse accessor)
        sqs = getattr(obj, '_prefetched_objects_cache', {}).get('studyquestionnaire_set', None)
        if sqs is None:
            from .models import StudyQuestionnaire
            sqs = StudyQuestionnaire.objects.filter(template=obj).select_related('study')
        return [
            {'id': str(sq.study.id), 'title': sq.study.title, 'protocol_id': sq.study.protocol_id}
            for sq in sqs
            if sq.study
        ]

class QuestionnaireTemplateBriefSerializer(SanitizedModelSerializer):
    used_in_studies = serializers.SerializerMethodField()

    class Meta:
        model = QuestionnaireTemplate
        fields = ['id', 'name', 'pdf_file', 'json_structure', 'created_at', 'used_in_studies']

    def get_used_in_studies(self, obj):
        sqs = getattr(obj, '_prefetched_objects_cache', {}).get('studyquestionnaire_set', None)
        if sqs is None:
            from .models import StudyQuestionnaire
            sqs = StudyQuestionnaire.objects.filter(template=obj).select_related('study')
        return [
            {'id': str(sq.study.id), 'title': sq.study.title, 'protocol_id': sq.study.protocol_id}
            for sq in sqs
            if sq.study
        ]

class QuestionnaireScheduleInstanceBriefSerializer(SanitizedModelSerializer):
    """High-Performance light-weight serializer for schedule lists."""
    template_details = serializers.SerializerMethodField()
    participant_details = serializers.SerializerMethodField()
    protocol_id = serializers.CharField(source='study_questionnaire.study.protocol_id', read_only=True)

    class Meta:
        model = QuestionnaireScheduleInstance
        fields = [
            'id', 'template_details', 'participant_details', 'protocol_id', 
            'scheduled_date', 'status', 'completed_at'
        ]

    def get_template_details(self, obj):
        return {'name': obj.study_questionnaire.template.name if obj.study_questionnaire and obj.study_questionnaire.template else 'Instrument'}

    def get_participant_details(self, obj):
        return {'full_name': obj.participant.user.full_name if obj.participant and obj.participant.user else 'Subject'}



class TechnologySerializer(SanitizedModelSerializer):
    class Meta:
        model = Technology
        fields = '__all__'

class TeamMemberSerializer(SanitizedModelSerializer):
    image_url = serializers.SerializerMethodField()
    def get_image_url(self, obj):
        if not obj.image: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.image.url)
        return obj.image.url
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('category'):
            ret['category'] = 'leadership'
        return ret
    class Meta:
        model = TeamMember
        fields = '__all__'

class StaffMemberSerializer(SanitizedModelSerializer):
    image_url = serializers.SerializerMethodField()
    def get_image_url(self, obj):
        if not obj.image: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.image.url)
        return obj.image.url
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('category'):
            ret['category'] = 'staff'
        return ret
    class Meta:
        model = StaffMember
        fields = '__all__'

class AdvisorSerializer(SanitizedModelSerializer):
    image_url = serializers.SerializerMethodField()
    def get_image_url(self, obj):
        if not obj.image: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.image.url)
        return obj.image.url
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('category'):
            ret['category'] = 'advisors'
        return ret
    class Meta:
        model = Advisor
        fields = '__all__'

class ClinicalCollaboratorSerializer(SanitizedModelSerializer):
    image_url = serializers.SerializerMethodField()
    def get_image_url(self, obj):
        if not obj.image: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.image.url)
        return obj.image.url
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('category'):
            ret['category'] = 'collaborators'
        return ret
    class Meta:
        model = ClinicalCollaborator
        fields = '__all__'



class InnovationPageSettingsSerializer(SanitizedModelSerializer):
    class Meta:
        model = InnovationPageSettings
        fields = '__all__'

class SponsorInquirySerializer(SanitizedModelSerializer):
    class Meta:
        model = SponsorInquiry
        fields = '__all__'

class StudyQuestionnaireSerializer(SanitizedModelSerializer):
    template_details = QuestionnaireTemplateBriefSerializer(source='template', read_only=True)
    class Meta:
        model = StudyQuestionnaire
        fields = '__all__'

class QuestionnaireScheduleInstanceSerializer(SanitizedModelSerializer):
    questionnaire_details = StudyQuestionnaireSerializer(source='study_questionnaire', read_only=True)
    participant_details = serializers.SerializerMethodField()
    signed_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = QuestionnaireScheduleInstance
        fields = '__all__'

    def get_participant_details(self, obj):
        return {
            'sid': obj.participant.participant_sid if obj.participant else 'N/A',
            'name': obj.participant.user.full_name if obj.participant and obj.participant.user else 'Subject'
        }

    def get_signed_pdf_url(self, obj):
        if not obj.signed_pdf: return None
        request = self.context.get('request')
        if request: return request.build_absolute_uri(obj.signed_pdf.url)
        return obj.signed_pdf.url

class InvitationSerializer(SanitizedModelSerializer):
    invited_by_name = serializers.CharField(source='invited_by.full_name', read_only=True)
    
    class Meta:
        model = Invitation
        fields = [
            'id', 'email', 'role', 'invited_by', 'invited_by_name', 
            'organization', 'scope', 'study_ids', 'is_accepted', 
            'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'is_accepted', 'created_at', 'invited_by', 'expires_at']

class ClinicalAuditLogSerializer(SanitizedModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    class Meta:
        model = ClinicalAuditLog
        fields = '__all__'

class PIIRevealLogSerializer(SanitizedModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    class Meta:
        model = PIIRevealLog
        fields = '__all__'
