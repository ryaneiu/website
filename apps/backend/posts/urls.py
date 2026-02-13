"""
Docstring for apps.backend.posts.urls
"""

#usual django paths
from django.urls import path
from .views import CreatePostView, PublishPostView

urlpatterns = [
    path('create/', CreatePostView.as_view(), name='create-post'),
    path('publish/<int:id>/', PublishPostView.as_view(), name='publish-post'),
]
from django.urls import path
from .views import PostListCreateAPIView

urlpatterns += [
    path("", PostListCreateAPIView.as_view()),
]
