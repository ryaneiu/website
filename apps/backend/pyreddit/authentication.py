"""Authentication helpers for JWT cookies."""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Authenticate with Authorization header first, then access-token cookie."""

    def authenticate(self, request):
        header = self.get_header(request)
        raw_token = self.get_raw_token(header) if header is not None else None

        if raw_token is None:
            cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE", "access_token")
            raw_token = request.COOKIES.get(cookie_name)
            if raw_token is None:
                return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
