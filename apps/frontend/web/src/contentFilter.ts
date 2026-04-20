export type PostImage = {
    url: string;
    isBlurred: boolean;
};

export type ContentFilterPreferences = {
    includeNsfw: boolean;
    includeSwears: boolean;
};

export type PostLanguage = "en" | "fr";

export type PostFilterFlags = {
    is_nsfw?: boolean;
    has_swears?: boolean;
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
    /\bmerde(?:ux|use|uses|s)?\b/gi,
    /\bputain(?:s)?\b/gi,
    /\bencul[ée](?:s)?\b/gi,
    /\bconnard(?:e|es|s)?\b/gi,
    /\bconne?(?:s)?\b/gi,
    /\btabarn(?:ak|ac|aque|akk|ouche|ouette)s?\b/gi,
    /\bc(?:â|a)?liss(?:e|es)?\b/gi,
    /\bcalice(?:s)?\b/gi,
    /\bcriss(?:e|es|er)?\b/gi,
    /\b(?:osti|ostie|hostie|esti|estie)s?\b/gi,
    /\bsacr(?:ament|amant)(?:s)?\b/gi,
    /\bviarge(?:s)?\b/gi,
    /\bciboir(?:e|es)?\b/gi,
];

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/i;
const DIRECT_IMAGE_URL_PATTERN = /(https?:\/\/[^\s]+?\.(?:png|jpe?g|gif|webp|avif))/i;
const PLAIN_HTTP_URL_PATTERN = /(https?:\/\/[^\s<>")']+)/i;
const HTML_IMAGE_SRC_PATTERN = /<img[^>]+src=["']([^"']+)["']/i;
const IMAGE_DATA_URL_PATTERN = /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$/i;

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

function isSafeImageDataUrl(url: string): boolean {
    return IMAGE_DATA_URL_PATTERN.test(url.trim());
}

function isSafeImageUrl(url: string): boolean {
    return isSafeHttpUrl(url) || isSafeImageDataUrl(url);
}

function readImageFileAsDataUrl(file: File): Promise<string | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : null;
            resolve(result != null && isSafeImageDataUrl(result) ? result : null);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
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
    language: PostLanguage = "en",
): string {
    const query = new URLSearchParams();
    query.set("include_nsfw", preferences.includeNsfw ? "true" : "false");
    query.set("include_swears", preferences.includeSwears ? "true" : "false");
    query.set("language", language);

    const trimmedSearchText = (searchText ?? "").trim();
    if (trimmedSearchText.length > 0) {
        query.set("q", trimmedSearchText);
    }

    return query.toString();
}

export function getHiddenPostMessage(
    post: PostFilterFlags,
    preferences: ContentFilterPreferences,
): string | null {
    const nsfwBlocked = Boolean(post.is_nsfw) && !preferences.includeNsfw;
    const swearsBlocked = Boolean(post.has_swears) && !preferences.includeSwears;

    if (nsfwBlocked && swearsBlocked) {
        return "Activate NSFW and swears toggles to show this post.";
    }

    if (nsfwBlocked) {
        return "Activate NSFW toggle to show NSFW posts.";
    }

    if (swearsBlocked) {
        return "Activate swears toggle to show posts with swears.";
    }

    return null;
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
        if (candidate.length > 0 && isSafeImageUrl(candidate)) {
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

export function normalizeAttachedImageUrl(rawUrl: string): string | null {
    const trimmedUrl = rawUrl.trim();
    if (trimmedUrl.length === 0) {
        return null;
    }

    return isSafeImageUrl(trimmedUrl) ? trimmedUrl : "invalid";
}

export async function extractImageReferenceFromClipboardData(
    clipboardData: DataTransfer | null,
): Promise<string | null> {
    if (clipboardData == null) {
        return null;
    }

    for (const item of Array.from(clipboardData.items)) {
        if (item.kind !== "file" || !item.type.startsWith("image/")) {
            continue;
        }

        const file = item.getAsFile();
        if (file == null) {
            continue;
        }

        const dataUrl = await readImageFileAsDataUrl(file);
        if (dataUrl != null) {
            return dataUrl;
        }
    }

    return extractImageUrlFromClipboardData(clipboardData);
}

export function extractImageUrlFromClipboardData(
    clipboardData: DataTransfer | null,
): string | null {
    if (clipboardData == null) {
        return null;
    }

    const htmlContent = clipboardData.getData("text/html").trim();
    if (htmlContent.length > 0) {
        const htmlImageMatch = HTML_IMAGE_SRC_PATTERN.exec(htmlContent);
        const htmlImageUrl = htmlImageMatch?.[1]?.trim() ?? "";
        if (isSafeImageUrl(htmlImageUrl)) {
            return htmlImageUrl;
        }
    }

    const plainText = clipboardData.getData("text/plain").trim();
    if (plainText.length === 0) {
        return null;
    }

    const markdownImageMatch = MARKDOWN_IMAGE_PATTERN.exec(plainText);
    const markdownImageUrl = markdownImageMatch?.[1]?.trim() ?? "";
    if (isSafeImageUrl(markdownImageUrl)) {
        return markdownImageUrl;
    }

    const plainUrlMatch = PLAIN_HTTP_URL_PATTERN.exec(plainText);
    const plainUrl = plainUrlMatch?.[1]?.trim() ?? "";
    if (isSafeHttpUrl(plainUrl)) {
        return plainUrl;
    }

    return null;
}

export function appendAttachedImageToContent(
    content: string,
    imageUrl: string | null,
): string {
    const trimmedContent = content.trim();
    if (imageUrl == null || imageUrl == '') {
        return trimmedContent;
    }

    const imageMarkdown = `![Attached image](${imageUrl})`;
    if (trimmedContent.length === 0) {
        return imageMarkdown;
    }

    if (trimmedContent.includes(imageMarkdown)) {
        return trimmedContent;
    }

    return `${trimmedContent}\n\n${imageMarkdown}`;
}

export function resolvePostImage(
    image: PostImage | null | undefined,
    text: string,
    includeNsfw: boolean,
    isNsfw: boolean | undefined,
): PostImage | null {
    if (image != null && isSafeImageUrl(image.url)) {
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
