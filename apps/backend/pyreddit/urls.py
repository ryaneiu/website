from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet
from django.urls import path
from .views import signup, protected
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet
router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [



    

    path('', include(router.urls)),  # router handles /posts/ and /comments/
]