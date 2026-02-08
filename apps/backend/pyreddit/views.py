

# Create your views here
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from django.views.generic import TemplateView

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        username = request.data.get("username")
        password = request.data.get("password")

        if not email or not username or not password:
            return Response({"detail": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"detail": "Username taken"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"detail": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)

        return Response({"detail": "Signup successful"}, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=user_obj.username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        response = Response({"detail": "Login successful"})

        # Set cookies
        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            secure=False,  # True in production
            samesite="Lax",
        )
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=False,  # True in production
            samesite="Lax",
        )

        return response





class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        post = self.get_object()
        post.votes += 1
        post.save()
        return Response({'id': post.id, 'votes': post.votes})

    @action(detail=True, methods=['post'])
    def downvote(self, request, pk=None):
        post = self.get_object()
        post.votes -= 1
        post.save()
        return Response({'id': post.id, 'votes': post.votes})

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        comment = self.get_object()
        comment.votes += 1
        comment.save()
        return Response({'id': comment.id, 'votes': comment.votes})

    @action(detail=True, methods=['post'])
    def downvote(self, request, pk=None):
        comment = self.get_object()
        comment.votes -= 1
        comment.save()
        return Response({'id': comment.id, 'votes': comment.votes})
from django.views.generic import TemplateView
from django.conf import settings

# Main website frontend
class ActualWebsiteView(TemplateView):
    template_name = str(settings.ACTUAL_WEBSITE_DIR / "index.html")

# Login SPA
class LoginView(TemplateView):
    template_name = str(settings.LOGIN_DIR / "index.html")
