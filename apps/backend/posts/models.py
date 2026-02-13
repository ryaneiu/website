"""
Docstring for apps.backend.posts.models
"""

from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    """
    Docstring for Post
    """
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts_posts")  # <--- add related_name
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    published = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.title