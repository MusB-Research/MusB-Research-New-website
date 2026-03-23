from rest_framework import serializers
from .models import JobPosting

class JobPostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosting
        fields = '__all__'

    def validate_requirements(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Requirements must be a JSON array.")
        return value
