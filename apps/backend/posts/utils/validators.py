"""Strict query parameter validation for posts filtering."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any


ALLOWED_FILTER_QUERY_KEYS = frozenset({"include_nsfw", "include_swears", "q"})


def validate_bool(param: str) -> bool:
    if not isinstance(param, str):
        raise ValueError("Boolean query parameters must be strings.")

    normalized = param.strip().lower()
    if normalized not in {"true", "false"}:
        raise ValueError("Boolean query parameters must be 'true' or 'false'.")

    return normalized == "true"


def _get_single_value(args: Mapping[str, Any], key: str) -> str | None:
    getlist = getattr(args, "getlist", None)
    if callable(getlist):
        values = getlist(key)
        if len(values) > 1:
            raise ValueError(f"Query parameter '{key}' must be provided once.")
        if len(values) == 0:
            return None
        value = values[0]
    else:
        value = args.get(key)

    if value is None:
        return None

    value_as_text = str(value).strip()
    return value_as_text if value_as_text != "" else None


def validate_query(args: Mapping[str, Any]) -> dict[str, bool | str]:
    unexpected_keys = sorted(key for key in args.keys() if key not in ALLOWED_FILTER_QUERY_KEYS)
    if unexpected_keys:
        keys = ", ".join(unexpected_keys)
        raise ValueError(f"Unsupported query parameter(s): {keys}.")

    include_nsfw_value = _get_single_value(args, "include_nsfw")
    include_swears_value = _get_single_value(args, "include_swears")
    search_value = _get_single_value(args, "q")

    return {
        "include_nsfw": validate_bool(include_nsfw_value) if include_nsfw_value is not None else False,
        "include_swears": validate_bool(include_swears_value) if include_swears_value is not None else False,
        "q": search_value or "",
    }
