"""
Docstring for apps.backend.posts.urls
"""

#usual django paths
from django.urls import path
from .views import (
    CreatePostView,
    PublishPostView,
    PostListCreateAPIView,
    PostRetrieveAPIView,
    ToggleLikeAPIView,
    ReplyListCreateAPIView,
    SubforumListCreateAPIView,
)

urlpatterns = [
    path('create/', CreatePostView.as_view(), name='create-post'),
    path('publish/<int:id>/', PublishPostView.as_view(), name='publish-post'),
    path('<int:id>/', PostRetrieveAPIView.as_view(), name='retrieve-post'),
    path('<int:id>/like/', ToggleLikeAPIView.as_view(), name='toggle-like'),
    path('<int:id>/replies/', ReplyListCreateAPIView.as_view(), name='post-replies'),
    path('subforums/', SubforumListCreateAPIView.as_view(), name='subforums'),
]

urlpatterns += [
    path("", PostListCreateAPIView.as_view()),
]
