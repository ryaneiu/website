"""Content censorship and NSFW image processing utilities."""

from __future__ import annotations

import re
from urllib.parse import urlparse


NSFW_PATTERN_SOURCES = [
    r"\bnsfw\b",
    r"\bporn(?:ography)?\b",
    r"\bxxx\b",
    r"\bnud(?:e|ity|es)\b",
    r"\bsex(?:ual)?\b",
    r"\bonlyfans\b",
    r"\bhentai\b",
    r"\bfetish\b",
]

SWEAR_PATTERN_SOURCES = [
    r"\bfuck(?:ing|ed|er|ers)?\b",
    r"\bshit(?:ty|ting)?\b",
    r"\bbitch(?:es)?\b",
    r"\basshole(?:s)?\b",
    r"\bbastard(?:s)?\b",
    r"\bdamn\b",
    r"\bcrap\b",
    r"\bmerde(?:ux|use|uses|s)?\b",
    r"\bputain(?:s)?\b",
    r"\bencul[ée](?:s)?\b",
    r"\bconnard(?:e|es|s)?\b",
    r"\bconne?(?:s)?\b",
    r"\btabarn(?:ak|ac|aque|akk|ouche|ouette)s?\b",
    r"\bc(?:â|a)?liss(?:e|es)?\b",
    r"\bcalice(?:s)?\b",
    r"\bcriss(?:e|es|er)?\b",
    r"\b(?:osti|ostie|hostie|esti|estie)s?\b",
    r"\bsacr(?:ament|amant)(?:s)?\b",
    r"\bviarge(?:s)?\b",
    r"\bciboir(?:e|es)?\b",
]

NSFW_PATTERNS = [re.compile(pattern, re.IGNORECASE) for pattern in NSFW_PATTERN_SOURCES]
SWEAR_PATTERNS = [re.compile(pattern, re.IGNORECASE) for pattern in SWEAR_PATTERN_SOURCES]

MARKDOWN_IMAGE_PATTERN = re.compile(r"!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
DIRECT_IMAGE_URL_PATTERN = re.compile(
    r"(https?://[^\s]+?\.(?:png|jpe?g|gif|webp|avif))",
    re.IGNORECASE,
)


def classify_post_content(title: str, content: str, content_markdown: str) -> tuple[bool, bool]:
    combined_text = " ".join(part for part in [title, content, content_markdown] if part)
    is_nsfw = any(pattern.search(combined_text) for pattern in NSFW_PATTERNS)
    has_swears = any(pattern.search(combined_text) for pattern in SWEAR_PATTERNS)
    return is_nsfw, has_swears


def censor_text(text: str, enabled: bool) -> str:
    if enabled or not text:
        return text

    censored = text
    for pattern in SWEAR_PATTERNS:
        censored = pattern.sub("****", censored)
    return censored


def _is_safe_http_url(url: str) -> bool:
    parsed_url = urlparse(url.strip())
    return parsed_url.scheme in {"http", "https"} and bool(parsed_url.netloc)


def extract_first_image_url(text: str) -> str | None:
    if not text:
        return None

    markdown_match = MARKDOWN_IMAGE_PATTERN.search(text)
    if markdown_match:
        candidate = markdown_match.group(1).strip()
        if _is_safe_http_url(candidate):
            return candidate

    direct_match = DIRECT_IMAGE_URL_PATTERN.search(text)
    if direct_match:
        candidate = direct_match.group(1).strip()
        if _is_safe_http_url(candidate):
            return candidate

    return None


def process_image(
    image_url: str | None,
    nsfw_enabled: bool,
    *,
    is_nsfw: bool = False,
) -> dict[str, str | bool] | None:
    if image_url is None or not _is_safe_http_url(image_url):
        return None

    return {
        "url": image_url,
        "isBlurred": (not nsfw_enabled) and is_nsfw,
    }
