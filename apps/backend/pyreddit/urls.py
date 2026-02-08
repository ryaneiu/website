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
import pyreddit # Ensure this is imported to register the viewsets with the router
    

urlpatterns = [
    path("auth/signup/", SignupView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path('', include(router.urls)),
           # router handles /posts/ and /comments/
]
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'posts', views.PostViewSet)
router.register(r'comments', views.CommentViewSet)

from django.urls import path, re_path
from django.views.generic import TemplateView

urlpatterns += [
    # API endpoints go here first
    # path("api/...", ...),

    # React SPA
    path("actual_website/", ActualWebsiteView.as_view(template_name="index.html"), name="actual-website"),

    # Login SPA
    path("auth?action=login/", LoginView.as_view(template_name="index.html"), name="login-spa"),

    # Catch-all for frontend routing (optional)
    re_path(r'^actual_website/.*$', ActualWebsiteView.as_view(template_name="index.html")),
]