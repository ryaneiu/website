"""
Views for the posts app.

Contains API views to list, create, and publish posts for the Reddit-like site.
"""
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Post, Like, Reply, Subforum
from .serializers import PostSerializer, ReplySerializer, SubforumSerializer


class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author_id == request.user.id

# List all posts
class PostListCreateAPIView(generics.ListCreateAPIView):
    queryset = Post.objects.annotate(
        likes_count=Count("likes", distinct=True),
        replies_count=Count("replies", distinct=True),
    ).order_by("-created_at")
    serializer_class = PostSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        markdown = serializer.validated_data.get("content_markdown", "")
        plain = serializer.validated_data.get("content", "")
        serializer.save(
            author=self.request.user,
            content_markdown=markdown or plain,
            content=plain or markdown,
        )


class PostRetrieveAPIView(generics.RetrieveDestroyAPIView):
    queryset = Post.objects.annotate(
        likes_count=Count("likes", distinct=True),
        replies_count=Count("replies", distinct=True),
    )
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    lookup_field = "id"

# Create a post
class CreatePostView(generics.CreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        markdown = serializer.validated_data.get("content_markdown", "")
        plain = serializer.validated_data.get("content", "")
        serializer.save(
            author=self.request.user,
            published=False,
            content_markdown=markdown or plain,
            content=plain or markdown,
        )

# Publish a post
class PublishPostView(generics.UpdateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.objects.all()
    lookup_field = "id"

    def perform_update(self, serializer):
        serializer.save(published=True)


class ToggleLikeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        post = get_object_or_404(Post, id=id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        likes_count = post.likes.count()
        if not created:
            like.delete()
            likes_count = max(likes_count - 1, 0)
            return Response({"liked": False, "likes_count": likes_count}, status=status.HTTP_200_OK)
        return Response({"liked": True, "likes_count": likes_count}, status=status.HTTP_201_CREATED)


class ReplyListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ReplySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return Reply.objects.filter(post_id=self.kwargs["id"]).select_related("author").order_by("created_at")

    def perform_create(self, serializer):
        post_id = int(self.kwargs["id"])
        markdown = serializer.validated_data.get("content_markdown", "")
        plain = serializer.validated_data.get("content", "")
        parent_reply = serializer.validated_data.get("parent_reply")
        post = get_object_or_404(Post, id=post_id)

        if parent_reply is not None and parent_reply.post_id != post_id:
            raise ValidationError({"parent_reply": "parent_reply must belong to the same post."})

        target_author_id = parent_reply.author_id if parent_reply is not None else post.author_id
        if target_author_id == self.request.user.id:
            raise ValidationError({"detail": "You can only reply to content from a different account."})

        serializer.save(
            author=self.request.user,
            post=post,
            parent_reply=parent_reply,
            content_markdown=markdown or plain,
            content=plain or markdown,
        )


class SubforumListCreateAPIView(generics.ListCreateAPIView):
    queryset = Subforum.objects.all().order_by("name")
    serializer_class = SubforumSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
