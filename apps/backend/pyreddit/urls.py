from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import signup, protected
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet
router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [



    path('signup/', signup),
    path('login/', TokenObtainPairView.as_view()),   # token login
    path('refresh/', TokenRefreshView.as_view()),    # token refresh
    path('protected/', protected),

    path('', include(router.urls)),  # router handles /posts/ and /comments/
]