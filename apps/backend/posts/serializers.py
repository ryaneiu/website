from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ["id", "title", "content", "author", "published", "created_at"]
        read_only_fields = ["author", "published", "created_at"]
