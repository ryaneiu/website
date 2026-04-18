"""
Docstring for apps.backend.posts.models
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from .utils.censor import classify_post_content


class Subforum(models.Model):
    title = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_subforums",
    )

    def clean(self):
        title = (self.title or "").strip()
        if not title:
            raise ValidationError({"title": "Subforum title cannot be empty."})

        prohibited_chars = {"/", "\\", "<", ">", "{" , "}", "[", "]", "|"}
        if any(char in title for char in prohibited_chars):
            raise ValidationError(
                {"title": "Subforum title contains prohibited characters."}
            )

        self.title = title

        if self.description is None:
            self.description = ""
        self.description = self.description.strip()

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.slug:
            base_slug = slugify(self.title) or "general"
            slug = base_slug
            idx = 2
            while Subforum.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{idx}"
                idx += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title

class Post(models.Model):
    """
    Docstring for Post
    """
    LANGUAGE_ENGLISH = "en"
    LANGUAGE_FRENCH = "fr"
    LANGUAGE_CHOICES = [
        (LANGUAGE_ENGLISH, "English"),
        (LANGUAGE_FRENCH, "French"),
    ]

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
    is_nsfw = models.BooleanField(default=False, db_index=True)
    has_swears = models.BooleanField(default=False, db_index=True)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default=LANGUAGE_ENGLISH, db_index=True)

    def clean(self):
        title = (self.title or "").strip()
        content = (self.content or "").strip()
        markdown = (self.content_markdown or "").strip()

        if not title:
            raise ValidationError({"title": "Post title cannot be empty."})
        if len(title) > 255:
            raise ValidationError({"title": "Post title cannot exceed 255 characters."})

        if not content and not markdown:
            raise ValidationError(
                {"content": "Post content cannot be empty."}
            )
        if len(content) > 500000 or len(markdown) > 500000:
            raise ValidationError(
                {"content": "Post content cannot exceed 500000 characters."}
            )

        if self.language not in {self.LANGUAGE_ENGLISH, self.LANGUAGE_FRENCH}:
            raise ValidationError({"language": "Post language must be en or fr."})

        self.title = title
        self.content = content or markdown
        self.content_markdown = markdown or content

        is_nsfw, has_swears = classify_post_content(
            self.title,
            self.content,
            self.content_markdown,
        )
        self.is_nsfw = is_nsfw
        self.has_swears = has_swears

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

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


class DeploymentResetMarker(models.Model):
    name = models.CharField(max_length=64, unique=True)
    value = models.CharField(max_length=255, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)
