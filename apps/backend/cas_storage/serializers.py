from rest_framework import serializers
from .models import UploadedFile

class FileUploadSerializer(serializers.ModelSerializer):
    
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UploadedFile
        fields = ['id', 'file', 'file_url', 'uploaded_at']
        read_only_fields = ['uploaded_at']
    
    def validate_file(self, value):
        # 5MB = 5 * 1024 * 1024 bytes
        limit = 5 * 1024 * 1024
        if value.size > limit:
            raise serializers.ValidationError("File too large. Size should not exceed 5 MB.")
        return value
    
    def get_file_url(self, obj):
        # Returns the full URL (including domain) if request is in context
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None