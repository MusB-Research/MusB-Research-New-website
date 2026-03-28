from rest_framework import serializers
from .models import SupportTicket, TicketMessage, TicketAuditLog


class TicketAuditLogSerializer(serializers.ModelSerializer):
    # Serialize the auto `id` (ObjectId) as a plain string — avoids int() crash
    id = serializers.CharField(read_only=True)

    class Meta:
        model = TicketAuditLog
        fields = ['id', 'user', 'action', 'timestamp']


class TicketMessageSerializer(serializers.ModelSerializer):
    # ObjectId-safe FK serialization
    id = serializers.CharField(read_only=True)
    sender = serializers.CharField(read_only=True)  # returns str(ObjectId)

    # Use decrypted_name — the custom MusB encryption-aware property
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ['id', 'sender', 'sender_name', 'content',
                  'is_internal', 'user_role_label', 'created_at']

    def get_sender_name(self, obj):
        try:
            return getattr(obj.sender, 'decrypted_name', None) or obj.sender.email
        except Exception:
            return 'Unknown'


class SupportTicketSerializer(serializers.ModelSerializer):
    # ObjectId-safe FK serialization
    id = serializers.CharField(read_only=True)
    creator = serializers.CharField(read_only=True)  # returns str(ObjectId)
    study = serializers.CharField(read_only=True, allow_null=True)

    messages = TicketMessageSerializer(many=True, read_only=True)
    audit_logs = TicketAuditLogSerializer(many=True, read_only=True)

    # Use decrypted_name — avoids get_full_name AttributeError
    creator_name = serializers.SerializerMethodField()
    study_protocol = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_id', 'title', 'creator', 'creator_name', 'study',
            'study_protocol', 'status', 'priority', 'category',
            'assigned_to', 'messages', 'audit_logs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['creator', 'study', 'ticket_id']

    def get_creator_name(self, obj):
        try:
            return getattr(obj.creator, 'decrypted_name', None) or obj.creator.email
        except Exception:
            return 'Unknown'

    def get_study_protocol(self, obj):
        try:
            return obj.study.protocol_id if obj.study else None
        except Exception:
            return None
