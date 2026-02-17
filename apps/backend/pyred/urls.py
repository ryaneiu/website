"""
URL configuration for pyred project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.static import serve
from pathlib import Path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from pyreddit.views import LoginAPIView, SignupView
from pyreddit.views import PostViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)

# Get the frontend dist directory
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "../frontend/web/dist"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# API endpointsx
urlpatterns += [
    path("api/", include(router.urls)),
    path("api/signup/", SignupView.as_view(), name="signup"),
    path("api/login/", LoginAPIView.as_view(), name="login"),
    path('api/posts/', include('posts.urls')),
]

# Serve static files from dist

# Catch-all: serve index.html for all non-API routes (SPA)
from django.urls import re_path
from pyreddit.views import spa

urlpatterns = [
    re_path(r"^.*$", spa),  # all URLs go to React
]