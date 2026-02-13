"""
Docstring for apps.backend.pyreddit.models
"""

from django.db import models

# Create your models here.

from django.contrib.auth.models import User

class Post(models.Model):
    """
    Docstring for Post
    """
    title = models.CharField(max_length=255)
    body = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    votes = models.IntegerField(default=0)

class Comment(models.Model):
    """
    Docstring for Comment
    """
    post = models.ForeignKey(Post,
                             related_name='comments', 
                             on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    votes = models.IntegerField(default=0)
