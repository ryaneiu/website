export type PostImage = {
    url: string;
    isBlurred: boolean;
};

export type ContentFilterPreferences = {
    includeNsfw: boolean;
    includeSwears: boolean;
};

const INCLUDE_NSFW_STORAGE_KEY = "includeNsfw";
const INCLUDE_SWEARS_STORAGE_KEY = "includeSwears";
const LEGACY_INCLUDE_NSFW_STORAGE_KEY = "posts_include_nsfw";
const LEGACY_INCLUDE_SWEARS_STORAGE_KEY = "posts_include_swears";

const SWEAR_PATTERNS = [
    /\bfuck(?:ing|ed|er|ers)?\b/gi,
    /\bshit(?:ty|ting)?\b/gi,
    /\bbitch(?:es)?\b/gi,
    /\basshole(?:s)?\b/gi,
    /\bbastard(?:s)?\b/gi,
    /\bdamn\b/gi,
    /\bcrap\b/gi,
];

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/i;
const DIRECT_IMAGE_URL_PATTERN = /(https?:\/\/[^\s]+?\.(?:png|jpe?g|gif|webp|avif))/i;

function readStoredBoolean(primaryKey: string, legacyKey: string): boolean {
    const storedValue =
        localStorage.getItem(primaryKey) ?? localStorage.getItem(legacyKey);
    return storedValue === "true";
}

function storeBoolean(primaryKey: string, legacyKey: string, value: boolean) {
    const serialized = value ? "true" : "false";
    localStorage.setItem(primaryKey, serialized);
    localStorage.setItem(legacyKey, serialized);
}

function isSafeHttpUrl(url: string): boolean {
    try {
        const parsed = new URL(url.trim());
        return (
            (parsed.protocol === "http:" || parsed.protocol === "https:") &&
            parsed.host.length > 0
        );
    } catch {
        return false;
    }
}

export function getStoredContentFilterPreferences(): ContentFilterPreferences {
    return {
        includeNsfw: readStoredBoolean(
            INCLUDE_NSFW_STORAGE_KEY,
            LEGACY_INCLUDE_NSFW_STORAGE_KEY,
        ),
        includeSwears: readStoredBoolean(
            INCLUDE_SWEARS_STORAGE_KEY,
            LEGACY_INCLUDE_SWEARS_STORAGE_KEY,
        ),
    };
}

export function persistContentFilterPreferences(
    preferences: ContentFilterPreferences,
) {
    storeBoolean(
        INCLUDE_NSFW_STORAGE_KEY,
        LEGACY_INCLUDE_NSFW_STORAGE_KEY,
        preferences.includeNsfw,
    );
    storeBoolean(
        INCLUDE_SWEARS_STORAGE_KEY,
        LEGACY_INCLUDE_SWEARS_STORAGE_KEY,
        preferences.includeSwears,
    );
}

export function buildContentFilterQuery(
    preferences: ContentFilterPreferences,
    searchText?: string,
): string {
    const query = new URLSearchParams();
    query.set("include_nsfw", preferences.includeNsfw ? "true" : "false");
    query.set("include_swears", preferences.includeSwears ? "true" : "false");

    const trimmedSearchText = (searchText ?? "").trim();
    if (trimmedSearchText.length > 0) {
        query.set("q", trimmedSearchText);
    }

    return query.toString();
}

export function censorText(text: string, includeSwears: boolean): string {
    if (includeSwears || text.length === 0) {
        return text;
    }

    let censored = text;
    SWEAR_PATTERNS.forEach((pattern) => {
        censored = censored.replace(pattern, "****");
    });
    return censored;
}

export function extractFirstImageUrl(text: string): string | null {
    if (!text) {
        return null;
    }

    const markdownMatch = MARKDOWN_IMAGE_PATTERN.exec(text);
    if (markdownMatch != null) {
        const candidate = markdownMatch[1]?.trim() ?? "";
        if (candidate.length > 0 && isSafeHttpUrl(candidate)) {
            return candidate;
        }
    }

    const directMatch = DIRECT_IMAGE_URL_PATTERN.exec(text);
    if (directMatch != null) {
        const candidate = directMatch[1]?.trim() ?? "";
        if (candidate.length > 0 && isSafeHttpUrl(candidate)) {
            return candidate;
        }
    }

    return null;
}

export function resolvePostImage(
    image: PostImage | null | undefined,
    text: string,
    includeNsfw: boolean,
    isNsfw: boolean | undefined,
): PostImage | null {
    if (image != null && isSafeHttpUrl(image.url)) {
        return image;
    }

    const fallbackImageUrl = extractFirstImageUrl(text);
    if (fallbackImageUrl == null) {
        return null;
    }

    return {
        url: fallbackImageUrl,
        isBlurred: !includeNsfw && Boolean(isNsfw),
    };
}
