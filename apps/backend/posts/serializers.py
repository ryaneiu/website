from rest_framework import serializers
from .models import Post, Reply, Like, Subforum


class SubforumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subforum
        fields = ["id", "name", "description", "created_at"]
        read_only_fields = ["created_at"]


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

    def get_likes_count(self, obj):
        return getattr(obj, "likes_count", obj.likes.count())

    def get_replies_count(self, obj):
        return getattr(obj, "replies_count", obj.replies.count())

    def get_body(self, obj):
        return obj.content_markdown or obj.content

    def get_votes(self, obj):
        return self.get_likes_count(obj)

    def get_can_delete(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return False
        return obj.author_id == request.user.id

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
        ]
        read_only_fields = ["author", "published", "created_at"]
