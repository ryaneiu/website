"""
Views
"""

# Create your views here
import re
from urllib.parse import urlencode, urlparse
from typing import cast
from io import BytesIO
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Q
from django.views.generic import TemplateView
from django.contrib.auth import authenticate, login
from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.authentication import SessionAuthentication
from PIL import Image

from .models import Post, Comment, UserProfile
from .serializers import PostSerializer, CommentSerializer
from .email_validation import normalize_and_validate_email, is_user_email_valid
from .adapters import SENTINEL_USERNAME
from allauth.socialaccount.models import SocialAccount
from django.core.files.base import ContentFile
from cas_storage.storage import ContentAdressableStorage


# ── Username validation (mirrors frontend UsernameChecker.ts) ────────────

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*( [A-Za-z0-9_.]+)*$")
ALLOWED_CHARS_PATTERN = re.compile(r"^[A-Za-z0-9_. ]+$")


def _validate_username(value: str) -> str | None:
    """Return an error message if the username is invalid, or None if valid."""
    if not value:
        return "Username is required."
    if re.search(r"\s{2,}", value):
        return "Only single spaces allowed."
    if re.search(r"\.{2,}", value):
        return "Periods cannot be repeated."
    if value.startswith(".") or value.endswith("."):
        return "Periods must be in the middle."
    if not ALLOWED_CHARS_PATTERN.match(value):
        return "Only letters, numbers, _, ., and spaces allowed."
    if not USERNAME_PATTERN.match(value):
        return "Invalid username format."
    return None


# ── Social signup completion view ──────────────────────────────────────────

class SocialSignupCompleteView(APIView):
    """
    Creates the real User + SocialAccount after the user picks a username.

    At this point NO user exists — the google_callback_interceptor (or
    OAuthCompleteView as fallback) deleted the auto-created account and
    stored the Google data in the session. This view creates the final
    account and returns JWT tokens.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = str(request.data.get("username", "")).strip()

        username_error = _validate_username(username)
        if username_error:
            return Response(
                {"detail": username_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "Username is already taken."},
                status=status.HTTP_409_CONFLICT,
            )

        # Retrieve stored Google data from the session
        oauth_data = request.session.get('pending_oauth')
        if not oauth_data:
            return Response(
                {"detail": "No pending OAuth signup. Please start over."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = oauth_data['email']

        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "Email already registered."},
                status=status.HTTP_409_CONFLICT,
            )

        # Create the real user
        user = User.objects.create_user(username=username, email=email)
        user.first_name = oauth_data.get('first_name', '')
        user.save()

        # Create the SocialAccount link
        SocialAccount.objects.create(
            user=user,
            provider=oauth_data['provider'],
            uid=oauth_data['uid'],
            extra_data=oauth_data.get('extra_data', {}),
        )

        # Clean up session
        del request.session['pending_oauth']

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token_str = str(refresh)

        # NOTE: JWT tokens are returned in the body for localStorage (needed by
        # the SPA's Authorization header flow). HttpOnly cookies are also set as
        # defense-in-depth. A full fix requires frontend refactoring to rely
        # solely on cookies.
        response = Response({
            "detail": "Signup complete",
            "access": access,
            "refresh": refresh_token_str,
        })
        set_jwt_cookies(
            response,
            access_token=access,
            refresh_token=refresh_token_str,
        )
        response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")

        return response


MARKDOWN_IMAGE_PATTERN = re.compile(r"!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
IMAGE_DATA_URL_PATTERN = re.compile(r"^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$", re.IGNORECASE)
CAS_OBJECT_ID_PATTERN = re.compile(r"^[a-f0-9]{64}$")
CAS_OBJECT_URL_PATTERN = re.compile(r"^/objects/([a-f0-9]{64})\.bin$")

PROFILE_IMAGE_MAX_SIZE = 256


def _make_cas_profile_url(object_id: str) -> str:
    """Build the URL for a CAS-stored profile image."""
    if not object_id:
        return ""
    # If it's already a full URL or data URL, return as-is (legacy / external)
    if object_id.startswith(("http://", "https://", "data:")):
        return object_id
    return f"/objects/{object_id}.bin"


def _is_cas_object_id(value: str) -> bool:
    """Check if a string looks like a CAS object ID (64-char hex)."""
    return bool(CAS_OBJECT_ID_PATTERN.match(value))


def _is_safe_http_url(url: str) -> bool:
    parsed = urlparse(url.strip())
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _normalize_profile_image(value: str) -> str | None:
    trimmed = value.strip()
    if not trimmed:
        return None

    # CAS object ID (64-char hex from upload endpoint)
    if _is_cas_object_id(trimmed):
        return trimmed

    # CAS object URL /objects/{hash}.bin (sent back from frontend after upload)
    cas_url_match = CAS_OBJECT_URL_PATTERN.match(trimmed)
    if cas_url_match:
        return cas_url_match.group(1)

    markdown_match = MARKDOWN_IMAGE_PATTERN.search(trimmed)
    candidate = markdown_match.group(1).strip() if markdown_match else trimmed

    if _is_safe_http_url(candidate):
        return candidate
    if IMAGE_DATA_URL_PATTERN.match(candidate):
        return candidate

    return ""


def set_jwt_cookies(
    response: Response,
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> None:
    """Attach JWT access/refresh cookies using project security settings."""
    access_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE", "access_token")
    refresh_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE_REFRESH", "refresh_token")
    secure = settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", True)
    httponly = settings.SIMPLE_JWT.get("AUTH_COOKIE_HTTP_ONLY", True)
    samesite = settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax")

    access_token_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME")
    refresh_token_lifetime = settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME")

    access_max_age = int(access_token_lifetime.total_seconds()) if access_token_lifetime else None
    refresh_max_age = int(refresh_token_lifetime.total_seconds()) if refresh_token_lifetime else None

    if access_token:
        response.set_cookie(
            key=access_cookie_name,
            value=access_token,
            httponly=httponly,
            secure=secure,
            samesite=samesite,
            max_age=access_max_age,
            path="/",
        )

    if refresh_token:
        response.set_cookie(
            key=refresh_cookie_name,
            value=refresh_token,
            httponly=httponly,
            secure=secure,
            samesite=samesite,
            max_age=refresh_max_age,
            path="/",
        )


def clear_jwt_cookies(response: Response) -> None:
    access_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE", "access_token")
    refresh_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE_REFRESH", "refresh_token")

    response.delete_cookie(access_cookie_name, path="/")
    response.delete_cookie(refresh_cookie_name, path="/")


def build_relogin_response(detail: str) -> Response:
    response = Response({"detail": detail}, status=status.HTTP_401_UNAUTHORIZED)
    clear_jwt_cookies(response)
    return response


def get_user_from_refresh_token(refresh_token: str | None) -> User | None:
    if not refresh_token:
        return None

    try:
        token = RefreshToken(refresh_token)
    except TokenError:
        return None

    user_id = token.get("user_id")
    if user_id is None:
        return None

    return User.objects.filter(id=user_id).first()


class CookieTokenObtainPairView(TokenObtainPairView):
    """Issue JWTs in response body and secure HttpOnly cookies."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            refresh_token = response.data.get("refresh")
            user = get_user_from_refresh_token(
                refresh_token if isinstance(refresh_token, str) else None,
            )

            if user is None:
                return build_relogin_response(
                    "Invalid authentication session. Please log in again.",
                )

            if not is_user_email_valid(user.email):
                return build_relogin_response(
                    "Your account email is invalid. Please log in again with a valid email.",
                )

            set_jwt_cookies(
                response,
                access_token=response.data.get("access"),
                refresh_token=response.data.get("refresh"),
            )

        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Refresh access JWT using refresh token from body or cookie."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if not data.get("refresh"):
            refresh_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE_REFRESH", "refresh_token")
            cookie_refresh_token = request.COOKIES.get(refresh_cookie_name)
            if cookie_refresh_token:
                data["refresh"] = cookie_refresh_token

        serializer = self.get_serializer(data=data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(exc.args[0]) from exc

        refresh_token = data.get("refresh")
        user = get_user_from_refresh_token(str(refresh_token) if refresh_token else None)
        if user is None:
            return build_relogin_response(
                "Invalid authentication session. Please log in again.",
            )

        if not is_user_email_valid(user.email):
            return build_relogin_response(
                "Your account email is invalid. Please log in again with a valid email.",
            )

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        set_jwt_cookies(
            response,
            access_token=serializer.validated_data.get("access"),
            refresh_token=serializer.validated_data.get("refresh"),
        )
        return response




class SignupView(APIView):
    """
    Sign up view
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Docstring for post
        
        :param self: Description
        :param request: Description
        """
        email = request.data.get("email")
        username = str(request.data.get("username", "")).strip()
        password = str(request.data.get("password", ""))

        if not email or not username or not password:
            return Response({"detail": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        username_error = _validate_username(username)
        if username_error:
            return Response(
                {"detail": username_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        normalized_email, email_error = normalize_and_validate_email(str(email))
        if email_error is not None or normalized_email is None:
            return Response({"detail": email_error}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"detail": "Username taken"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=normalized_email).exists():
            return Response({"detail": "Email already registered"},
                            status=status.HTTP_400_BAD_REQUEST)

        User.objects.create_user(username=username, email=normalized_email, password=password)

        return Response({"detail": "Signup successful"}, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    """
    Login API view
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Docstring for post
        
        :param self: Description
        :param request: Description
        """
        email: str = str(cast(dict, request.data).get("email", "")).strip()
        password: str = str(cast(dict, request.data).get("password", ""))

        if not email or not password:
            return Response({"detail": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        normalized_email, email_error = normalize_and_validate_email(email)
        if email_error is not None or normalized_email is None:
            return Response({"detail": email_error}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_obj = User.objects.get(email=normalized_email)
        except User.DoesNotExist: # type: ignore
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if not is_user_email_valid(user_obj.email):
            return build_relogin_response(
                "Your account email is invalid. Please log in again with a valid email.",
            )

        user = authenticate(username=user_obj.username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        response = Response({"detail": "Login successful"})

        set_jwt_cookies(
            response,
            access_token=str(refresh.access_token),
            refresh_token=str(refresh),
        )

        return response



class UserSearchAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = str(request.query_params.get("q", "")).strip()
        if not query:
            return Response([], status=status.HTTP_200_OK)

        users = User.objects.filter(
            Q(username__icontains=query)
            | Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
        ).order_by("username")[:25]

        payload = [
            {
                "id": user.id,
                "username": user.username,
            }
            for user in users
        ]

        return Response(payload, status=status.HTTP_200_OK)


class CurrentUserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _serialize_profile(user: User) -> dict:
        profile = UserProfile.objects.filter(user=user).first()
        raw_image = profile.image_url if profile and profile.image_url else None
        profile_image = _make_cas_profile_url(raw_image) if raw_image else None
        display_name = profile.display_name if profile else ""
        linked_providers = list(
            SocialAccount.objects.filter(user=user).values_list("provider", flat=True)
        )
        return {
            "username": user.username,
            "email": user.email,
            "bio": user.last_name or "",
            "profile_image": profile_image,
            "display_name": display_name,
            "linked_providers": linked_providers,
        }

    def get(self, request):
        user = request.user
        return Response(self._serialize_profile(user), status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user
        username = request.data.get("username")
        email = request.data.get("email")
        bio = request.data.get("bio")
        profile_image = request.data.get("profile_image")
        display_name = request.data.get("display_name")

        if username is not None:
            normalized_username = str(username).strip()
            username_error = _validate_username(normalized_username)
            if username_error:
                return Response(
                    {"detail": username_error},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if User.objects.filter(username=normalized_username).exclude(id=user.id).exists():
                return Response(
                    {"detail": "Username taken"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.username = normalized_username

        if email is not None:
            normalized_email, email_error = normalize_and_validate_email(str(email))
            if email_error is not None or normalized_email is None:
                return Response(
                    {"detail": email_error},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if User.objects.filter(email=normalized_email).exclude(id=user.id).exists():
                return Response(
                    {"detail": "Email already registered"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.email = normalized_email

        if bio is not None:
            normalized_bio = str(bio).strip()
            if len(normalized_bio) > 150:
                return Response(
                    {"detail": "Bio cannot exceed 150 characters."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.last_name = normalized_bio

        if display_name is not None:
            normalized_display_name = str(display_name).strip()
            if len(normalized_display_name) > 32:
                return Response(
                    {"detail": "Display name cannot exceed 32 characters."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            profile_obj, _ = UserProfile.objects.get_or_create(user=user)
            profile_obj.display_name = normalized_display_name
            profile_obj.save(update_fields=["display_name"])

        if profile_image is not None:
            normalized_profile_image = str(profile_image).strip()
            parsed_profile_image = _normalize_profile_image(normalized_profile_image)
            if parsed_profile_image == "":
                return Response(
                    {
                        "detail": (
                            "Profile image must be a valid markdown image or direct image URL."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            profile_obj, _ = UserProfile.objects.get_or_create(user=user)
            profile_obj.image_url = parsed_profile_image or ""
            profile_obj.save(update_fields=["image_url"])

        user.save()

        return Response(self._serialize_profile(user), status=status.HTTP_200_OK)



class ProfileImageUploadView(APIView):
    """
    Upload a profile image. Accepts multipart image, downscales to 256x256,
    stores via CAS, and updates the user's profile.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"detail": "No file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if uploaded_file.size > 5 * 1024 * 1024:
            return Response(
                {"detail": "File too large. Maximum 5 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            image_bytes = uploaded_file.read()
            image_stream = BytesIO(image_bytes)
            with Image.open(image_stream) as img:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGBA")
                    background = Image.new("RGBA", img.size, (255, 255, 255, 255))
                    img = Image.alpha_composite(background, img).convert("RGB")
                elif img.mode != "RGB":
                    img = img.convert("RGB")

                w, h = img.size
                if w > PROFILE_IMAGE_MAX_SIZE or h > PROFILE_IMAGE_MAX_SIZE:
                    ratio = min(PROFILE_IMAGE_MAX_SIZE / w, PROFILE_IMAGE_MAX_SIZE / h)
                    img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

                output = BytesIO()
                img.save(output, format="AVIF")
                output.seek(0)
                processed_bytes = output.read()
        except Exception as e:
            return Response(
                {"detail": f"Invalid image: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cas = ContentAdressableStorage()
        cas_file = ContentFile(processed_bytes, name="profile.avif")
        filename = cas.save_cas("profile.avif", cas_file)
        object_id = filename.removesuffix(".bin")

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.image_url = object_id
        profile.save(update_fields=["image_url"])

        return Response(
            {"object_id": object_id, "profile_image": _make_cas_profile_url(object_id)},
            status=status.HTTP_200_OK,
        )



# ── Google OAuth linking (connect to existing account) ──────────────────

class LinkGoogleInitiateView(APIView):
    """
    Logs the JWT-authenticated user into a Django session and redirects
    to Google OAuth with process=connect so allauth links the Google
    account to the existing user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Log the JWT user into the Django session so allauth knows who to link to
        login(request, request.user, backend="django.contrib.auth.backends.ModelBackend")

        next_url = "/api/auth/oauth-connect-complete/"
        redirect_url = f"/accounts/google/login/?process=connect&next={next_url}"
        return HttpResponseRedirect(redirect_url)


class OAuthConnectCompleteView(APIView):
    """
    Called after Google OAuth connect flow completes.
    Allauth has already created the SocialAccount for the session user.
    Redirects back to the profile page with a status parameter.
    """
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        spa_url = getattr(settings, "SPA_URL", "/")

        if not request.user.is_authenticated:
            return HttpResponseRedirect(
                f"{spa_url.rstrip('/')}/profile?link=error"
            )

        # Verify the SocialAccount was actually created
        has_google = SocialAccount.objects.filter(
            user=request.user, provider="google"
        ).exists()

        status_param = "success" if has_google else "error"
        response = HttpResponseRedirect(
            f"{spa_url.rstrip('/')}/profile?link={status_param}"
        )
        # Clear the session cookie — user should use JWT tokens going forward
        response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")
        return response


class UnlinkGoogleView(APIView):
    """
    Removes the Google SocialAccount link for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        if not request.user.has_usable_password():
            return Response(
                {
                    "detail": (
                        "You must set a password before unlinking your Google account. "
                        "Otherwise you will not be able to log in."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted_count, _ = SocialAccount.objects.filter(
            user=request.user, provider="google"
        ).delete()

        if deleted_count == 0:
            return Response(
                {"detail": "No Google account linked."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"detail": "Google account unlinked successfully."},
            status=status.HTTP_200_OK,
        )


class PostViewSet(viewsets.ModelViewSet):
    """
    Post view set
    """
    queryset = Post.objects.all().order_by('-created_at') # type: ignore
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def upvote(self, _request, _pk=None):
        """
        Docstring for upvote
        
        :param self: Description
        :param request: Description
        :param pk: Description
        """
        post = self.get_object()
        post.votes += 1
        post.save()
        return Response({'id': post.id, 'votes': post.votes})

    @action(detail=True, methods=['post'])
    def downvote(self, _request, _pk=None):
        """
        Docstring for downvote
        
        :param self: Description
        :param request: Description
        :param pk: Description
        """
        post = self.get_object()
        post.votes -= 1
        post.save()
        return Response({'id': post.id, 'votes': post.votes})

class CommentViewSet(viewsets.ModelViewSet):
    """
    Comment view
    """
    queryset = Comment.objects.all().order_by('-created_at') # type: ignore
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def upvote(self, _request, _pk=None):
        """
        Docstring for upvote
        
        :param self: Description
        :param request: Description
        :param pk: Description
        """
        comment = self.get_object()
        comment.votes += 1
        comment.save()
        return Response({'id': comment.id, 'votes': comment.votes})

    @action(detail=True, methods=['post'])
    def downvote(self, _request, _pk=None):
        """
        Docstring for downvote
        
        :param self: Description
        :param request: Description
        :param pk: Description
        """
        comment = self.get_object()
        comment.votes -= 1
        comment.save()
        return Response({'id': comment.id, 'votes': comment.votes})


class OAuthCompleteView(APIView):
    """
    Called by allauth after a successful Google OAuth login.

    Primary interception is done by google_callback_interceptor which catches
    new users BEFORE allauth creates them. This view handles two fallback cases:

    1. The interceptor worked → only returning users reach here → issue JWTs.
    2. The interceptor failed but the adapter's save_user set the sentinel
       username → delete auto-created user, redirect to username page.
    """
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        print(f"[OAuthCompleteView] CALLED: is_authenticated={request.user.is_authenticated}",
              flush=True)

        if not request.user.is_authenticated:
            spa_url = getattr(settings, "SPA_URL", "/")
            return HttpResponseRedirect(
                f"{spa_url.rstrip('/')}/auth?action=signup&error=oauth_session_lost"
            )

        # Fallback: detect auto-created users via the sentinel username
        # (set by SocialAccountAdapter.save_user if pre_social_login didn't fire)
        if request.user.username == SENTINEL_USERNAME:
            return self._handle_new_oauth_user(request)

        # Returning user — issue JWT tokens and redirect home
        return self._returning_user_redirect(request)

    def _handle_new_oauth_user(self, request):
        """Delete the auto-created user and redirect to the username picker."""
        email = request.user.email or ""
        suggested = email.split('@')[0].lower() if email else ""
        social = SocialAccount.objects.filter(user=request.user).first()

        # Fallback uid: Google's unique user ID is stored in extra_data.sub
        fallback_uid = (
            social.extra_data.get('sub', '') if social and social.extra_data else ''
        )

        oauth_data = {
            'email': email,
            'provider': social.provider if social else 'google',
            'uid': social.uid if social else fallback_uid,
            'extra_data': social.extra_data if social else {},
            'first_name': request.user.first_name or '',
        }

        # Delete auto-created user (cascades to SocialAccount)
        request.user.delete()

        # Store Google data for the completion endpoint
        request.session['pending_oauth'] = oauth_data

        spa_url = getattr(settings, "SPA_URL", "/")
        params = {"action": "social_signup"}
        if suggested:
            params["suggested_username"] = suggested
        redirect_url = f"{spa_url.rstrip('/')}/auth?{urlencode(params)}"
        print("[OAuthCompleteView] Sentinel user detected — deleted, redirecting to username page",
              flush=True)
        return HttpResponseRedirect(redirect_url)

    def _returning_user_redirect(self, request):
        refresh = RefreshToken.for_user(request.user)
        access = str(refresh.access_token)
        refresh_token_str = str(refresh)

        spa_url = getattr(settings, "SPA_URL", "/")
        fragment = urlencode({"access_token": access, "refresh_token": refresh_token_str})
        redirect_url = f"{spa_url.rstrip('/')}/#{fragment}"
        print(f"[OAuthCompleteView] Returning user={request.user.username}, JWT tokens set",
              flush=True)

        response = HttpResponseRedirect(redirect_url)
        set_jwt_cookies(response, access_token=access, refresh_token=refresh_token_str)
        response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")
        return response


# ── Google callback interceptor ────────────────────────────────────────
# Intercepts the Google OAuth callback URL BEFORE allauth processes it.
# This is the most reliable approach — no adapter hooks needed.
#
# For NEW users (just created by allauth):
#   → deletes auto-created user, stores Google data in session,
#     redirects to username selection page
#
# For RETURNING users:
#   → lets allauth's response pass through (goes to OAuthCompleteView
#     for JWT token issuance, then redirects home)

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.views import OAuth2CallbackView

_allauth_google_callback = OAuth2CallbackView.adapter_view(GoogleOAuth2Adapter)


def google_callback_interceptor(request):
    """Wrap allauth's Google callback: detect new users, delete them, redirect."""
    print("[Interceptor] Google callback received", flush=True)

    # Let allauth process the callback (creates user + SocialAccount + session)
    response = _allauth_google_callback(request)

    if not request.user.is_authenticated:
        print("[Interceptor] NOT authenticated — passing through", flush=True)
        return response

    user = request.user
    social = SocialAccount.objects.filter(user=user).first()

    if not social:
        print("[Interceptor] No SocialAccount — passing through", flush=True)
        return response

    # Detect NEW users via the sentinel username set by our adapter's save_user.
    # This is 100% reliable — the sentinel is ONLY set for auto-created users.
    is_new = user.username == SENTINEL_USERNAME

    print(f"[Interceptor] user={user.username} is_new={is_new}", flush=True)

    if not is_new:
        print("[Interceptor] Returning user — passing through to OAuthCompleteView", flush=True)
        return response

    # ── New user: delete auto-created account, store data, redirect ────
    email = user.email or social.extra_data.get('email', '')
    suggested = email.split('@')[0].lower() if email else ''

    print(f"[Interceptor] NEW user (email={email}) — deleting and redirecting to username page",
          flush=True)

    oauth_data = {
        'email': email,
        'provider': social.provider,
        'uid': social.uid,
        'extra_data': social.extra_data,
        'first_name': user.first_name or social.extra_data.get('given_name', ''),
    }

    # Delete auto-created user (cascades SocialAccount)
    user.delete()

    # Store in session for SocialSignupCompleteView
    request.session['pending_oauth'] = oauth_data

    spa_url = getattr(settings, "SPA_URL", "/")
    params = {"action": "social_signup"}
    if suggested:
        params["suggested_username"] = suggested
    redirect_url = f"{spa_url.rstrip('/')}/auth?{urlencode(params)}"

    return HttpResponseRedirect(redirect_url)


# Main website frontend
class ActualWebsiteView(TemplateView):
    """
    Docstring for ActualWebsiteView
    """
    template_name = "index.html"

# Login SPA
class LoginView(TemplateView):
    """
    Docstring for LoginView
    """
    template_name = "index.html"
