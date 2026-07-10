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
    LinkGoogleInitiateView,
    LoginAPIView,
    OAuthCompleteView,
    OAuthConnectCompleteView,
    ProfileImageUploadView,
    SignupView,
    SocialSignupCompleteView,
    UnlinkGoogleView,
    UserSearchAPIView,
    google_callback_interceptor,
)
from pyreddit.views import PostViewSet, CommentViewSet
from cas_storage.views import FileUploadView

router = DefaultRouter()
router.register(r'legacy-posts', PostViewSet)
router.register(r'legacy-comments', CommentViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    
    # Google OAuth – interceptor wraps allauth's callback to catch new users
    path(
        'accounts/google/login/callback/',
        google_callback_interceptor,
        name='google_callback',
    ),
    
    # Google provider URLs (login + callback) — provider internally prefixes with 'google/'
    path('accounts/', include('allauth.socialaccount.providers.google.urls')),
    
    # Social account management (needed by allauth internally)
    path('accounts/', include('allauth.socialaccount.urls')),
]

urlpatterns += [
    path('api/posts/', include('posts.urls')),
    path("api/", include(router.urls)),
    path("api/users/search/", UserSearchAPIView.as_view(), name="user-search"),
    path("api/profile/me/", CurrentUserProfileAPIView.as_view(), name="profile-me"),
    path("api/signup/", SignupView.as_view(), name="signup"),
    path("api/login/", LoginAPIView.as_view(), name="login"),
    path('api/objects/upload', FileUploadView.as_view(), name='cas-upload'),
    path('api/auth/oauth-complete/', OAuthCompleteView.as_view(), name='oauth-complete'),
    path('api/auth/oauth-connect-complete/', OAuthConnectCompleteView.as_view(), name='oauth-connect-complete'),
    path('api/auth/social-signup-complete/', SocialSignupCompleteView.as_view(), name='social-signup-complete'),
    path('api/profile/upload-image/', ProfileImageUploadView.as_view(), name='profile-upload-image'),
    path('api/profile/link-google/', LinkGoogleInitiateView.as_view(), name='link-google'),
    path('api/profile/unlink-google/', UnlinkGoogleView.as_view(), name='unlink-google'),
]


urlpatterns += [
    re_path(
    r'^(?!api/|admin/|token/|objects/|accounts/).*$', 
    TemplateView.as_view(template_name="index.html"), 
    name="spa"
    ),
    path("", TemplateView.as_view(template_name="index.html"), name="index"),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    # CAS objects stuff
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
