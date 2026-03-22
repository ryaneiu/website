"""
Docstring for apps.backend.posts.models
"""

from django.db import models
from django.contrib.auth.models import User


class Subforum(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name

class Post(models.Model):
    """
    Docstring for Post
    """
    author = models.ForeignKey(User,
                               on_delete=models.CASCADE,
                               related_name="posts_posts")  # <--- add related_name
    title = models.CharField(max_length=255)
    content = models.TextField()
    content_markdown = models.TextField(blank=True, default="")
    subforum = models.ForeignKey(
        Subforum,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    published = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.title


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "post"], name="unique_user_post_like")
        ]


class Reply(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="replies")
    parent_reply = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="child_replies",
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_replies")
    content = models.TextField(blank=True, default="")
    content_markdown = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
