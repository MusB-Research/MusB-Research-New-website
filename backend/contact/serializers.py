from rest_framework import serializers
from .models import ContactPageSettings, ContactFormConfiguration, InquiryType, Submission

class ContactPageSettingsSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = ContactPageSettings
        fields = '__all__'

class ContactFormConfigurationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = ContactFormConfiguration
        fields = '__all__'

class InquiryTypeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = InquiryType
        fields = ['id', 'label', 'slug', 'display_order']

class SubmissionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    inquiry_type_slug = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Submission
        fields = ['id', 'name', 'email', 'company', 'phone', 'inquiry_type', 'inquiry_type_slug', 'message', 'submitted_at']
        read_only_fields = ['submitted_at', 'inquiry_type']

    def create(self, validated_data):
        inquiry_slug = validated_data.pop('inquiry_type_slug', None)
        if inquiry_slug:
            try:
                # Try to find by slug
                validated_data['inquiry_type'] = InquiryType.objects.get(slug=inquiry_slug)
            except (InquiryType.DoesNotExist, Exception):
                pass 
        
        instance = super().create(validated_data)
        
        # Determine routing - always ensure info@musbresearch.com is the fallback
        if instance.inquiry_type and instance.inquiry_type.recipient_email:
            instance.routed_to = instance.inquiry_type.recipient_email
        else:
            instance.routed_to = "info@musbresearch.com"
            
        instance.save()
        return instance

