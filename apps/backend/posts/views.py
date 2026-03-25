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


class IsSubforumCreatorOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff or obj.creator_id == request.user.id


def get_general_subforum():
    subforum, _ = Subforum.objects.get_or_create(
        slug="general",
        defaults={"title": "General", "description": "Default subforum"},
    )
    return subforum

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
        subforum = serializer.validated_data.get("subforum") or get_general_subforum()
        serializer.save(
            author=self.request.user,
            subforum=subforum,
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
        subforum = serializer.validated_data.get("subforum") or get_general_subforum()
        serializer.save(
            author=self.request.user,
            published=False,
            subforum=subforum,
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
    queryset = Subforum.objects.prefetch_related("posts").all().order_by("title")
    serializer_class = SubforumSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class SubforumRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subforum.objects.prefetch_related("posts").all()
    serializer_class = SubforumSerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsSubforumCreatorOrAdmin()]

    def destroy(self, request, *args, **kwargs):
        subforum = self.get_object()
        self.check_object_permissions(request, subforum)
        subforum.delete()
        return Response({"detail": "Subforum deleted."}, status=status.HTTP_200_OK)


class SubforumPostCreateAPIView(generics.CreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        subforum = get_object_or_404(Subforum, slug=self.kwargs["slug"])
        markdown = serializer.validated_data.get("content_markdown", "")
        plain = serializer.validated_data.get("content", "")
        serializer.save(
            author=self.request.user,
            subforum=subforum,
            content_markdown=markdown or plain,
            content=plain or markdown,
        )


class PostSubforumUpdateAPIView(generics.UpdateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]
    lookup_field = "id"

    def patch(self, request, *args, **kwargs):
        post = self.get_object()
        self.check_object_permissions(request, post)

        subforum_slug = request.data.get("subforum")
        if not isinstance(subforum_slug, str) or not subforum_slug.strip():
            return Response(
                {"detail": "subforum slug is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subforum = get_object_or_404(Subforum, slug=subforum_slug.strip())
        post.subforum = subforum
        post.save(update_fields=["subforum"])

        serializer = self.get_serializer(post)
        return Response(serializer.data, status=status.HTTP_200_OK)
