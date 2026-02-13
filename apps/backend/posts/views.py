"""
Docstring for apps.backend.posts.views
"""
# Create your views here.
from rest_framework import generics, permissions
from .models import Post
from .serializers import PostSerializer

class CreatePostView(generics.CreateAPIView):
    """
    Docstring for CreatePostView
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, published=False)

class PublishPostView(generics.UpdateAPIView):
    """
    Docstring for PublishPostView
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Post.objects.all()
    lookup_field = "id"

    def perform_update(self, serializer):
        serializer.save(published=True)
