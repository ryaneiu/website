"""Middleware to exempt allauth OAuth URLs from CSRF protection.

The SPA submits a dynamically-created <form> to /accounts/google/login/
without a CSRF token. Since allauth views are third-party, we can't
decorate them individually. This middleware sets the Django-internal
flag that csrf_exempt normally sets, for all /accounts/ paths.
"""


class CsrfExemptAccountsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/accounts/google/"):
            setattr(request, "_dont_enforce_csrf_checks", True)
        return self.get_response(request)
