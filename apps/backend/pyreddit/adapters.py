"""Custom allauth social account adapter for intercepting new OAuth signups.

Uses TWO hooks for belt-and-suspenders reliability:

1. `pre_social_login` - fires BEFORE user is saved. If reached, raises
   ImmediateHttpResponse to redirect to username page. User never created.

2. `save_user` - fires DURING user creation (fallback if pre_social_login
   doesn't fire in the browser). Sets a sentinel username that
   OAuthCompleteView detects and then deletes the auto-created user.
"""

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialAccount
from allauth.core.exceptions import ImmediateHttpResponse
from django.conf import settings
from django.http import HttpResponseRedirect
from urllib.parse import urlencode

import logging
logger = logging.getLogger(__name__)

SENTINEL_USERNAME = "__oauth_pending__"


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """Intercepts the social login flow before/during account creation."""

    def pre_social_login(self, request, sociallogin):
        provider = sociallogin.account.provider
        uid = sociallogin.account.uid

        logger.info("[Adapter] pre_social_login called: provider=%s uid=%s...", provider, uid[:8])

        # If user is already logged into Django session, this is a connect flow
        # (linking Google to an existing account from the profile page).
        # Let allauth handle the connection normally.
        if request.user.is_authenticated:
            logger.info("[Adapter] User already authenticated — connect flow, passing through")
            return

        if SocialAccount.objects.filter(provider=provider, uid=uid).exists():
            logger.info("[Adapter] Returning user - passing through")
            return

        extra_data = sociallogin.account.extra_data or {}
        email = extra_data.get('email', '')
        first_name = extra_data.get('given_name', '')
        suggested = email.split('@')[0].lower() if email else ''

        logger.info("[Adapter] NEW user (email=%s) - storing session, redirecting", email)

        request.session['pending_oauth'] = {
            'email': email,
            'provider': provider,
            'uid': uid,
            'extra_data': extra_data,
            'first_name': first_name,
        }

        spa_url = getattr(settings, "SPA_URL", "/")
        params = {"action": "social_signup"}
        if suggested:
            params["suggested_username"] = suggested

        redirect_url = f"{spa_url.rstrip('/')}/auth?{urlencode(params)}"
        raise ImmediateHttpResponse(HttpResponseRedirect(redirect_url))

    def save_user(self, request, sociallogin, form=None):
        """Save user with a sentinel username so OAuthCompleteView can detect it."""
        from allauth.account.adapter import get_adapter as get_account_adapter

        u = sociallogin.user
        u.set_unusable_password()
        account_adapter = get_account_adapter()
        if form:
            account_adapter.save_user(request, u, form)
        else:
            account_adapter.populate_username(request, u)

        original = u.username
        u.username = SENTINEL_USERNAME
        logger.info("[Adapter] save_user: overriding username '%s' -> sentinel", original)

        sociallogin.save(request)
        return u
