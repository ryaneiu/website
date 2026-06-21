"""
Docstring for apps.backend.posts.urls
"""

#usual django paths
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    CreatePostView,
    PublishPostView,
    PostListCreateAPIView,
    PostRetrieveAPIView,
    PostTemplateListView,
    ToggleLikeAPIView,
    ReplyListCreateAPIView,
    SubforumListCreateAPIView,
    SubforumListOnlyAPIView,
    SubforumRetrieveUpdateDestroyAPIView,
    SubforumPostCreateAPIView,
    PostSubforumUpdateAPIView,
    CreatePostAttachmentView
)

urlpatterns = [
    path('rendered/', PostTemplateListView.as_view(), name='posts-rendered-template'),
    path('create/', CreatePostView.as_view(), name='create-post'),
    path('publish/<int:id>/', PublishPostView.as_view(), name='publish-post'),
    path('<int:id>/', PostRetrieveAPIView.as_view(), name='retrieve-post'),
    path('<int:id>/like/', ToggleLikeAPIView.as_view(), name='toggle-like'),
    path('<int:id>/replies/', ReplyListCreateAPIView.as_view(), name='post-replies'),
    path('<int:id>/subforum/', PostSubforumUpdateAPIView.as_view(), name='post-subforum-update'),
    path('subforums/', SubforumListCreateAPIView.as_view(), name='subforums'),
    path('subforums/list/', SubforumListOnlyAPIView.as_view(), name='subforums-list'),
    path('subforums/<slug:slug>/', SubforumRetrieveUpdateDestroyAPIView.as_view(), name='subforum-detail'),
    path('subforums/<slug:slug>/posts/', SubforumPostCreateAPIView.as_view(), name='subforum-post-create'),
    path("attachment/upload", csrf_exempt(CreatePostAttachmentView.as_view()), name="attachment-upload")
]

urlpatterns += [
    path("", PostListCreateAPIView.as_view()),
]
