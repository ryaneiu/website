"""
Views for the posts app.

Contains API views to list, create, and publish posts for the Reddit-like site.
"""
from django.db.models import Count, Exists, OuterRef, Q, Value
from django.db.models.fields import BooleanField
from django.shortcuts import get_object_or_404
from django.template.response import TemplateResponse
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError, PermissionDenied, AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Post, Like, Reply, ReplyLike, Subforum
from .serializers import PostSerializer, ReplySerializer, SubforumSerializer, SubforumListSerializer, PostAttachmentSerializer
from .utils.validators import validate_query
from .permissions import IsAuthor
import io
from django.core.files.base import File
from PIL import Image
import pillow_avif
from cas_storage.storage import ContentAdressableStorage
from cas_storage.services import ObjectStorageTokenService
from typing import cast
from pyreddit.authentication import CookieJWTAuthentication


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


def apply_post_search(queryset, search_query: str):
    if not search_query:
        return queryset

    return queryset.filter(
        Q(title__icontains=search_query)
        | Q(content__icontains=search_query)
        | Q(content_markdown__icontains=search_query)
        | Q(subforum__title__icontains=search_query)
        | Q(subforum__slug__icontains=search_query)
        | Q(author__username__icontains=search_query)
    )


def apply_published_filter(queryset, request):
    """Exclude unpublished posts unless the requester is the author."""
    if request.user.is_authenticated:
        return queryset.filter(Q(published=True) | Q(author=request.user))
    return queryset.filter(published=True)


def apply_post_language(queryset, language: str):
    normalized = (language or "en").strip().lower()
    return queryset.filter(language=normalized if normalized in {"en", "fr"} else "en")

class FilterPreferencesMixin:
    _filter_preferences: dict[str, bool | str] | None = None

    def get_filter_preferences(self) -> dict[str, bool | str]:
        if self._filter_preferences is None:
            try:
                self._filter_preferences = validate_query(self.request.query_params)
            except ValueError as exc:
                raise ValidationError({"detail": str(exc)})
        return self._filter_preferences

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["filter_preferences"] = self.get_filter_preferences()
        return context


class PostTemplateListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            filter_preferences = validate_query(request.query_params)
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)})

        search_query = str(filter_preferences.get("q", "")).strip()
        language = str(filter_preferences.get("language", "en")).strip()

        queryset = apply_published_filter(apply_post_language(
            apply_post_search(Post.objects.all(), search_query),
            language,
        ), self.request).annotate(
            likes_count=Count("likes", distinct=True),
            replies_count=Count("replies", distinct=True),
            user_has_liked=Value(False, output_field=BooleanField()),
        ).order_by("-created_at")

        serializer = PostSerializer(
            queryset,
            many=True,
            context={
                "request": request,
                "filter_preferences": filter_preferences,
            },
        )

        return TemplateResponse(
            request,
            "posts.html",
            {
                "posts": serializer.data,
                "filters": filter_preferences,
            },
        )

# List all posts
class PostListCreateAPIView(FilterPreferencesMixin, generics.ListCreateAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        filter_preferences = self.get_filter_preferences()
        search_query = str(filter_preferences.get("q", "")).strip()
        language = str(filter_preferences.get("language", "en")).strip()

        qs = apply_published_filter(apply_post_language(
            apply_post_search(Post.objects.select_related('author__profile').all(), search_query),
            language,
        ), self.request).annotate(
            likes_count=Count("likes", distinct=True),
            replies_count=Count("replies", distinct=True),
        )

        if self.request.user.is_authenticated:
            qs = qs.annotate(
                user_has_liked=Exists(
                    Like.objects.filter(user=self.request.user, post=OuterRef("pk"))
                )
            )
        else:
            qs = qs.annotate(
                user_has_liked=Value(False, output_field=BooleanField())
            )

        return qs.order_by("-created_at")

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
            language=serializer.validated_data.get("language") or "en",
        )


class PostRetrieveAPIView(FilterPreferencesMixin, generics.RetrieveDestroyAPIView):
    queryset = Post.objects.select_related('author__profile').annotate(
        likes_count=Count("likes", distinct=True),
        replies_count=Count("replies", distinct=True),
    )
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    lookup_field = "id"

    def get_queryset(self):
        qs = apply_published_filter(super().get_queryset(), self.request)
        if self.request.user.is_authenticated:
            qs = qs.annotate(
                user_has_liked=Exists(
                    Like.objects.filter(user=self.request.user, post=OuterRef("pk"))
                )
            )
        else:
            qs = qs.annotate(
                user_has_liked=Value(False, output_field=BooleanField())
            )
        return qs



class CreatePostAttachmentView(generics.CreateAPIView):
    
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]
    
    # exempt from csrf, cannot get the cookie in dev because of CORS and cross-origin (i love cors so much)

    def create(self, request, *args, **kwargs):
        
        upload_token = request.headers.get("X-Upload-Token")
        if not upload_token:
            raise PermissionDenied("No upload token specified")
        
        payload = ObjectStorageTokenService.check_token(upload_token, "post_attachment_upload")
        if not payload:
            raise AuthenticationFailed("Authentication failed")
        
        if not ObjectStorageTokenService.claim_one_time_token(payload):
            raise PermissionDenied("Cannot reuse token")
        
        post_id = payload.get("post_id")
        if not post_id: # todo: will 0 be considered true?
            raise ValidationError("No post ID in token")

        # Ensure the post still exists before attaching a file to it
        post = get_object_or_404(Post, id=post_id)

        file_type = payload.get("type")
        if not file_type:
            raise ValidationError("No file type in token")

        uploaded_file: "File" = request.FILES.get("file")

        limit = 5 * 1024 * 1024
        
        if uploaded_file.size > limit:
            raise ValidationError("File is too large")
        
        w = 0
        h = 0
        
        if file_type == "image":
            
            image_bytes = uploaded_file.read()
            try:
                image_stream = io.BytesIO(image_bytes)
                
                with Image.open(image_stream) as img:
                    if img.format != "AVIF":
                        raise ValidationError("Image format must be AVIF")
                    w = img.width
                    h = img.height
            except Exception as e:
                print(f"Error getting size: {e}")
                raise ValidationError("Image is not valid") from e
        else:
            # todo: support GIF and Videos (maybe?)
            raise ValidationError("Only images are currently supported!")

        ObjectStorageTokenService.claim_one_time_token(payload)

        
        
        # save it!
        cas_storage = ContentAdressableStorage()
        object_id = cas_storage.save_cas(uploaded_file.name, uploaded_file).removesuffix(".bin")

        data = {
            "object_id": object_id,
            "width": w,
            "height": h,
            "post": post.id
        }
        
        serializer = PostAttachmentSerializer(
            data=data,
            context={
                "request": request,
                "post_id": post_id,
                "file_type": file_type
            }
        )
        
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    

# Create a post
class CreatePostView(generics.CreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        attachment_requests = request.data.get("attachments", [])
        
        if not isinstance(attachment_requests, list):
            raise ValidationError("Attachments are invalid")
        
        if len(attachment_requests) > 4:
            raise ValidationError("You can only have up to 4 attachments")
        
        for attachment_request in attachment_requests:
            ObjectStorageTokenService.validate_attachment_request(attachment_request)
            
        # check same type
        if len(attachment_requests) > 0:
            first_type = attachment_requests[0]["type"]
            for attachment_request in attachment_requests:
                if attachment_request["type"] != first_type:
                    raise ValidationError("All attachments must be of the same type")
                if attachment_request["type"] != "image":
                    # todo: add support for GIFs and videos (maybe?)
                    raise ValidationError("Only image attachments are supported")
        
        serializer: PostSerializer = cast(PostSerializer, self.get_serializer(data=request.data))
        serializer.is_valid(raise_exception=True)
        

        
        markdown = serializer.validated_data.get("content_markdown", "")
        plain = serializer.validated_data.get("content", "")
        subforum = serializer.validated_data.get("subforum") or get_general_subforum()
        serializer.save(
            author=self.request.user,
            published=False,
            subforum=subforum,
            content_markdown=markdown or plain,
            content=plain or markdown,
            language=serializer.validated_data.get("language") or "en",
        )
        
        attachment_tokens = []

        for attachment_request in attachment_requests:
            attachment_tokens.append({
                "token": ObjectStorageTokenService.generate_post_upload_token(attachment_request, serializer.data["id"]),
                "request": attachment_request 
            })
        
        response_data = {
            "post": serializer.data,
            "upload_attachments": attachment_tokens
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)

# Publish a post
class PublishPostView(generics.UpdateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthor]
    queryset = Post.objects.all()
    lookup_field = "id"

    def update(self, request, *args, **kwargs):
        post = self.get_object()
        self.check_object_permissions(request, post)
        post.published = True
        post.save(update_fields=["published"])
        serializer = self.get_serializer(post)
        return Response(serializer.data)


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


class ToggleReplyLikeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        reply = get_object_or_404(Reply, id=id)
        like, created = ReplyLike.objects.get_or_create(user=request.user, reply=reply)
        likes_count = reply.likes.count()
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
        qs = Reply.objects.filter(post_id=self.kwargs["id"]).select_related("author__profile").order_by("created_at")
        if self.request.user.is_authenticated:
            qs = qs.annotate(
                likes_count=Count("likes", distinct=True),
                user_has_liked=Exists(
                    ReplyLike.objects.filter(user=self.request.user, reply=OuterRef("pk"))
                ),
            )
        else:
            qs = qs.annotate(
                likes_count=Count("likes", distinct=True),
                user_has_liked=Value(False, output_field=BooleanField()),
            )
        return qs

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


class SubforumListCreateAPIView(FilterPreferencesMixin, generics.ListCreateAPIView):
    queryset = Subforum.objects.prefetch_related("posts").all().order_by("title")
    serializer_class = SubforumSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class SubforumRetrieveUpdateDestroyAPIView(FilterPreferencesMixin, generics.RetrieveUpdateDestroyAPIView):
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


class SubforumListOnlyAPIView(generics.ListAPIView):
    queryset = Subforum.objects.annotate(
        number_of_posts=Count("posts", distinct=True),
    ).order_by("title")
    serializer_class = SubforumListSerializer
    permission_classes = [permissions.AllowAny]


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
            language=serializer.validated_data.get("language") or "en",
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
