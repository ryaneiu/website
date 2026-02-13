
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from rest_framework import routers
from pyreddit.views import SignupView, LoginView
from . import backend_views
from .views import ActualWebsiteView, LoginView
from .views import PostViewSet, CommentViewSet
from . import views

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path("auth/signup/", SignupView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path('', include(router.urls)),
           # router handles /posts/ and /comments/
]

router = routers.DefaultRouter()
router.register(r'posts', views.PostViewSet)
router.register(r'comments', views.CommentViewSet)



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