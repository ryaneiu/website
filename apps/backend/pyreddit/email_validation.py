from __future__ import annotations

from functools import lru_cache
import socket

from django.core.exceptions import ValidationError
from django.core.validators import validate_email


@lru_cache(maxsize=1024)
def domain_exists(domain: str) -> bool:
    if not domain:
        return False

    candidate = domain.strip().lower().rstrip(".")
    if not candidate or "." not in candidate:
        return False

    try:
        ascii_domain = candidate.encode("idna").decode("ascii")
    except UnicodeError:
        return False

    try:
        socket.getaddrinfo(ascii_domain, 80, type=socket.SOCK_STREAM)
        return True
    except OSError:
        return False


def normalize_and_validate_email(email: str | None) -> tuple[str | None, str | None]:
    normalized = (email or "").strip().lower()

    if not normalized:
        return None, "Email is required."

    if "@" not in normalized:
        return None, "Email must include '@'."

    try:
        validate_email(normalized)
    except ValidationError:
        return None, "Email format is invalid."

    _, _, domain = normalized.rpartition("@")
    if not domain_exists(domain):
        return None, "Email domain does not exist."

    return normalized, None


def is_user_email_valid(email: str | None) -> bool:
    normalized, error = normalize_and_validate_email(email)
    return normalized is not None and error is None
