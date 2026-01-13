from django.shortcuts import render

# Create your views here
from rest_framework import viewsets
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer



class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        post = self.get_object()
        post.votes += 1
        post.save()
        return Response({'votes': post.votes})

    @action(detail=True, methods=['post'])
    def downvote(self, request, pk=None):
        post = self.get_object()
        post.votes -= 1
        post.save()
        return Response({'votes': post.votes})