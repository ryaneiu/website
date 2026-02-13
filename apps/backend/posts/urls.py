
#usual django paths
from django.urls import path
from django.urls import path, include
from .views import CreatePostView, PublishPostView

urlpatterns = [
    path('create/', CreatePostView.as_view(), name='create-post'),
    path('publish/<int:id>/', PublishPostView.as_view(), name='publish-post'),
]