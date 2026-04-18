import logging
import os
import sys

from django.conf import settings
from django.contrib.auth.models import User
from django.db import OperationalError, ProgrammingError, transaction

from posts.models import DeploymentResetMarker, Like, Post, Reply, Subforum
from pyreddit.models import Comment as LegacyComment
from pyreddit.models import Post as LegacyPost
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

logger = logging.getLogger(__name__)
MARKER_NAME = "production_api_reset"
_has_checked_reset = False


def _is_production() -> bool:
    env = os.getenv("DJANGO_ENV", "").strip().lower()
    return env == "production" or not settings.DEBUG


def _should_skip_for_command() -> bool:
    blocked_commands = {
        "makemigrations",
        "migrate",
        "collectstatic",
        "test",
        "shell",
        "createsuperuser",
    }
    return any(arg in blocked_commands for arg in sys.argv)


def maybe_reset_api_on_deploy() -> None:
    global _has_checked_reset

    if _has_checked_reset:
        return
    _has_checked_reset = True

    if not _is_production() or _should_skip_for_command():
        return

    if os.getenv("PYRED_RESET_ON_DEPLOY", "0") != "1":
        return

    deploy_id = os.getenv("PYRED_DEPLOY_ID", "").strip()
    if not deploy_id:
        logger.warning("PYRED_DEPLOY_ID is empty; skipping production API reset.")
        return

    try:
        marker, _ = DeploymentResetMarker.objects.get_or_create(name=MARKER_NAME)
        if marker.value == deploy_id:
            return

        with transaction.atomic():
            BlacklistedToken.objects.all().delete()
            OutstandingToken.objects.all().delete()
            Like.objects.all().delete()
            Reply.objects.all().delete()
            Post.objects.all().delete()
            Subforum.objects.all().delete()
            LegacyComment.objects.all().delete()
            LegacyPost.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

            marker.value = deploy_id
            marker.save(update_fields=["value", "updated_at"])

        logger.warning("Production API data reset executed for deploy_id=%s", deploy_id)
    except (OperationalError, ProgrammingError):
        logger.exception("Skipping deploy reset because tables are not ready.")
