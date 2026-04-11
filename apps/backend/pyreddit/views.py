"""
Views
"""

# Create your views here
from typing import cast
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth.models import User
from django.views.generic import TemplateView
from django.contrib.auth import authenticate
from django.conf import settings
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer


def set_jwt_cookies(
    response: Response,
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> None:
    """Attach JWT access/refresh cookies using project security settings."""
    access_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE", "access_token")
    refresh_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE_REFRESH", "refresh_token")
    secure = settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", True)
    httponly = settings.SIMPLE_JWT.get("AUTH_COOKIE_HTTP_ONLY", True)
    samesite = settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax")

    access_token_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME")
    refresh_token_lifetime = settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME")

    access_max_age = int(access_token_lifetime.total_seconds()) if access_token_lifetime else None
    refresh_max_age = int(refresh_token_lifetime.total_seconds()) if refresh_token_lifetime else None

    if access_token:
        response.set_cookie(
            key=access_cookie_name,
            value=access_token,
            httponly=httponly,
            secure=secure,
            samesite=samesite,
            max_age=access_max_age,
            path="/",
        )

    if refresh_token:
        response.set_cookie(
            key=refresh_cookie_name,
            value=refresh_token,
            httponly=httponly,
            secure=secure,
            samesite=samesite,
            max_age=refresh_max_age,
            path="/",
        )


class CookieTokenObtainPairView(TokenObtainPairView):
    """Issue JWTs in response body and secure HttpOnly cookies."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            set_jwt_cookies(
                response,
                access_token=response.data.get("access"),
                refresh_token=response.data.get("refresh"),
            )

        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Refresh access JWT using refresh token from body or cookie."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if not data.get("refresh"):
            refresh_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE_REFRESH", "refresh_token")
            cookie_refresh_token = request.COOKIES.get(refresh_cookie_name)
            if cookie_refresh_token:
                data["refresh"] = cookie_refresh_token

        serializer = self.get_serializer(data=data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(exc.args[0]) from exc

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        set_jwt_cookies(
            response,
            access_token=serializer.validated_data.get("access"),
            refresh_token=serializer.validated_data.get("refresh"),
        )
        return response




class SignupView(APIView):
    """
    Sign up view
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Docstring for post
        
        :param self: Description
        :param request: Description
        """
        email = request.data.get("email")
        username = request.data.get("username")
        password = request.data.get("password")

        if not email or not username or not password:
            return Response({"detail": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"detail": "Username taken"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"detail": "Email already registered"},
                            status=status.HTTP_400_BAD_REQUEST)

        User.objects.create_user(username=username, email=email, password=password)

        return Response({"detail": "Signup successful"}, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    """
    Login API view
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Docstring for post
        
        :param self: Description
        :param request: Description
        """
        email: str = cast(str, cast(dict, request.data).get("email"))
        password: str = cast(str, cast(dict, request.data).get("password"))

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist: # type: ignore
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=user_obj.username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        response = Response({"detail": "Login successful"})

        set_jwt_cookies(
            response,
            access_token=str(refresh.access_token),
            refresh_token=str(refresh),
        )

        return response





class PostViewSet(viewsets.ModelViewSet):
    """
    Post view set
    """
    queryset = Post.objects.all().order_by('-created_at') # type: ignore
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def upvote(self, _request, _pk=None):
        """
        Docstring for upvote
        
        :param self: Description
        :param request: Description
        :param pk: Description
        """
        post = self.get_object()
        post.votes += 1
        post.save()
        return Response({'id': post.id, 'votes': post.votes})

    @action(detail=True, methods=['post'])
    def downvote(self, _request, _pk=None):
        """
        Docstring for downvote
        
        :param self: Description
        :param request: Description
        :param pk: Description
        """
        post = self.get_object()
        post.votes -= 1
        post.save()
        return Response({'id': post.id, 'votes': post.votes})

class CommentViewSet(viewsets.ModelViewSet):
    """
    Comment view
    """
    queryset = Comment.objects.all().order_by('-created_at') # type: ignore
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def upvote(self, _request, _pk=None):
        """
        Docstring for upvote
        
        :param self: Description
        :param request: Description
        :param pk: Description
        """
        comment = self.get_object()
        comment.votes += 1
        comment.save()
        return Response({'id': comment.id, 'votes': comment.votes})

    @action(detail=True, methods=['post'])
    def downvote(self, _request, _pk=None):
        """
        Docstring for downvote
        
        :param self: Description
        :param request: Description
        :param pk: Description
        """
        comment = self.get_object()
        comment.votes -= 1
        comment.save()
        return Response({'id': comment.id, 'votes': comment.votes})


# Main website frontend
class ActualWebsiteView(TemplateView):
    """
    Docstring for ActualWebsiteView
    """
    template_name = "index.html"

# Login SPA
class LoginView(TemplateView):
    """
    Docstring for LoginView
    """
    template_name = "index.html"
