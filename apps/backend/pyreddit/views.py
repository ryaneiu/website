from django.shortcuts import render
from urllib3 import request

# Create your views here
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# -------------------------
# REGISTER (SIGNUP)
# -------------------------
@api_view(['POST'])
def signup(request):
    username = request.data.get('username')
    password = request.data.get('password')

    # Check fields
    if not username or not password:
        return Response({'error': 'Missing username or password'}, status=400)

    # Check if user exists
    if User.objects.filter(username=username).exists():
        return Response({'error': 'User already exists'}, status=400)

    # Create user (Django automatically hashes password with Argon2)
    User.objects.create_user(username=username, password=password)

    return Response({'message': 'User created successfully'}, status=201)


# -------------------------
# PROTECTED ROUTE (AUTH TEST)
# -------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected(request):
    # This route only works if user sends valid access token
    return Response({'message': f'Hello {request.user.username}, you are logged in!'})



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


@api_view(['POST'])
def signup(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Missing fields'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'User exists'}, status=400)

    User.objects.create_user(username=username, password=password)
    return Response({'message': 'User created'}, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def secret(request):
    return Response({'msg': 'You are logged in'})