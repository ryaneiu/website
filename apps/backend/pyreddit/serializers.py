"""
Docstring for apps.backend.pyreddit.serializers
"""

from rest_framework import serializers
from .models import Post, Comment

class PostSerializer(serializers.ModelSerializer):
    """
    Docstring for PostSerializer
    """
    content = serializers.CharField(source='body')

    class Meta:
        """
        Docstring for Meta
        """
        model = Post
        fields = ['id', 'title', 'body', 'content', 'votes', 'created_at']
        extra_kwargs = {
            'body': {'required': False},
        }

class CommentSerializer(serializers.ModelSerializer):
    """
    Docstring for CommentSerializer
    """
    class Meta:
        """
        Docstring for Meta
        """
        model = Comment
        fields = ['id', 'post', 'body', 'votes', 'created_at']
