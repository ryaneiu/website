from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from pyreddit.views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    CurrentUserProfileAPIView,
    LoginAPIView,
    SignupView,
    UserSearchAPIView,
)
from pyreddit.views import PostViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'legacy-posts', PostViewSet)
router.register(r'legacy-comments', CommentViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns += [
    path('api/posts/', include('posts.urls')),
    path("api/", include(router.urls)),
    path("api/users/search/", UserSearchAPIView.as_view(), name="user-search"),
    path("api/profile/me/", CurrentUserProfileAPIView.as_view(), name="profile-me"),
    path("api/signup/", SignupView.as_view(), name="signup"),
    path("api/login/", LoginAPIView.as_view(), name="login"),
]

urlpatterns += [
    re_path(
    r'^(?!api/|admin/|token/).*$', 
    TemplateView.as_view(template_name="index.html"), 
    name="spa"
    ),
    path("", TemplateView.as_view(template_name="index.html"), name="index"),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
