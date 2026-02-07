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
from django.urls import path
from pyreddit.views import SignupView, LoginView
from django.urls import path, re_path
from .views import ActualWebsiteView, LoginView
from . import backend_views  # your existing backend endpoint

    

urlpatterns = [
    # Frontend SPAs (catch-all for routing)
    re_path(r'^actual_website/.*$', ActualWebsiteView.as_view(), name='actual-website-spa'),
    re_path(r'^login/.*$', LoginView.as_view(), name='login-spa'),
    path("auth/signup/", SignupView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path('', include(router.urls)),
           # router handles /posts/ and /comments/
]
