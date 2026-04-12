from rest_framework import serializers
from django.db.models import Q

from .models import Post, Reply, Like, Subforum
from .utils.censor import censor_text, extract_first_image_url, process_image


DEFAULT_FILTER_PREFERENCES = {"include_nsfw": False, "include_swears": False}


class SubforumSerializer(serializers.ModelSerializer):
    posts = serializers.SerializerMethodField(read_only=True)
    creator_username = serializers.CharField(source="creator.username", read_only=True)

    def get_posts(self, obj):
        posts = obj.posts.select_related("author").order_by("-created_at")

        filter_preferences = self.context.get("filter_preferences")
        search_query = ""
        if isinstance(filter_preferences, dict):
            search_query = str(filter_preferences.get("q", "")).strip()

        if search_query:
            posts = posts.filter(
                Q(title__icontains=search_query)
                | Q(content__icontains=search_query)
                | Q(content_markdown__icontains=search_query)
                | Q(author__username__icontains=search_query)
            )

        serializer = PostSerializer(posts, many=True, context=self.context)
        return serializer.data

    def validate_title(self, value):
        cleaned = (value or "").strip()
        if not cleaned:
            raise serializers.ValidationError("Subforum title cannot be empty.")
        prohibited_chars = {"/", "\\", "<", ">", "{", "}", "[", "]", "|"}
        if any(char in cleaned for char in prohibited_chars):
            raise serializers.ValidationError(
                "Subforum title contains prohibited characters."
            )
        return cleaned

    def validate_description(self, value):
        return (value or "").strip()

    class Meta:
        model = Subforum
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "created_at",
            "creator",
            "creator_username",
            "posts",
        ]
        read_only_fields = ["created_at", "slug", "creator", "creator_username", "posts"]


class ReplySerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Reply
        fields = [
            "id",
            "post",
            "parent_reply",
            "author",
            "author_username",
            "content",
            "content_markdown",
            "created_at",
        ]
        read_only_fields = ["post", "author", "created_at"]


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ["id", "post", "user", "created_at"]
        read_only_fields = ["user", "created_at"]

class PostSerializer(serializers.ModelSerializer):
    likes_count = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()
    votes = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    subforum = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Subforum.objects.all(),
        required=False,
        allow_null=True,
    )

    def _get_filter_preferences(self) -> dict[str, bool]:
        preferences = self.context.get("filter_preferences")
        if isinstance(preferences, dict):
            return {
                "include_nsfw": bool(preferences.get("include_nsfw", False)),
                "include_swears": bool(preferences.get("include_swears", False)),
            }
        return DEFAULT_FILTER_PREFERENCES

    def get_likes_count(self, obj):
        return getattr(obj, "likes_count", obj.likes.count())

    def get_replies_count(self, obj):
        return getattr(obj, "replies_count", obj.replies.count())

    def get_body(self, obj):
        filter_preferences = self._get_filter_preferences()
        include_swears = filter_preferences["include_swears"]
        source_text = obj.content_markdown or obj.content
        return censor_text(source_text, enabled=include_swears)

    def get_image(self, obj):
        filter_preferences = self._get_filter_preferences()
        include_nsfw = filter_preferences["include_nsfw"]
        source_text = obj.content_markdown or obj.content
        image_url = extract_first_image_url(source_text)
        return process_image(
            image_url,
            nsfw_enabled=include_nsfw,
            is_nsfw=obj.is_nsfw,
        )

    def get_votes(self, obj):
        return self.get_likes_count(obj)

    def get_can_delete(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return False
        return obj.author_id == request.user.id

    def validate_title(self, value):
        cleaned = (value or "").strip()
        if not cleaned:
            raise serializers.ValidationError("Post title cannot be empty.")
        if len(cleaned) > 255:
            raise serializers.ValidationError(
                "Post title cannot exceed 255 characters."
            )
        return cleaned

    def validate(self, attrs):
        content = (attrs.get("content") or "").strip()
        markdown = (attrs.get("content_markdown") or "").strip()

        if not content and not markdown:
            raise serializers.ValidationError(
                {"content": "Post content cannot be empty."}
            )

        if len(content) > 10000 or len(markdown) > 10000:
            raise serializers.ValidationError(
                {"content": "Post content cannot exceed 10000 characters."}
            )

        attrs["content"] = content or markdown
        attrs["content_markdown"] = markdown or content
        return attrs

    def to_representation(self, obj):
        representation = super().to_representation(obj)
        include_swears = self._get_filter_preferences()["include_swears"]
        source_content = obj.content or ""
        source_markdown = obj.content_markdown or ""

        representation["content"] = censor_text(source_content, enabled=include_swears)
        representation["content_markdown"] = censor_text(source_markdown, enabled=include_swears)
        representation["body"] = censor_text(
            source_markdown or source_content,
            enabled=include_swears,
        )
        return representation

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "body",
            "content",
            "content_markdown",
            "author",
            "published",
            "created_at",
            "subforum",
            "votes",
            "likes_count",
            "replies_count",
            "can_delete",
            "image",
            "is_nsfw",
            "has_swears",
        ]
        read_only_fields = [
            "author",
            "published",
            "created_at",
            "is_nsfw",
            "has_swears",
        ]
