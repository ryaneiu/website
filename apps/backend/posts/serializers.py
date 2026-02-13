"""
Docstring for apps.backend.posts.serializers
"""

from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    """
    Docstring for PostSerializer
    """
    author_username = serializers.ReadOnlyField(
        source='author.username')  # optional, shows author's username

    class Meta:
        """
        Docstring for Meta
        """
        model = Post
        fields = ['id',
                  'title',
                  'content',
                  'author',
                  'author_username',
                  'created_at',
                  'published']
        read_only_fields = ['id',
                            'author',
                            'created_at',
                            'published']  # author & created_at are auto-set
