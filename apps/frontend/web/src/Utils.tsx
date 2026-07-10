import { extractFirstImageUrl, normalizeAttachedImageUrl } from "./contentFilter";
import { API_ENDPOINT } from "./Config";

export async function extractDetailFromErrorResponse(res: Response) {
    const extractFirstReadableMessage = (value: unknown): string | null => {
        if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : null;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                const message = extractFirstReadableMessage(item);
                if (message) return message;
            }
            return null;
        }

        if (value && typeof value === "object") {
            for (const nested of Object.values(value as Record<string, unknown>)) {
                const message = extractFirstReadableMessage(nested);
                if (message) return message;
            }
        }

        return null;
    };

    try {
        const data = await res.json();

        if (data != null && typeof data === "object") {
            const detailMessage = extractFirstReadableMessage(
                (data as { detail?: unknown }).detail,
            );
            if (detailMessage) {
                return detailMessage;
            }
        }

        return extractFirstReadableMessage(data);
    } catch {
        try {
            const rawText = (await res.text()).trim();
            return rawText.length > 0 ? rawText : null;
        } catch {
            return null;
        }
    }
}

export function timeAgo(isoDate: string): string {
    const now = new Date();
    const date = new Date(isoDate);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;

    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
}

const CAS_OBJECT_URL_PATTERN = /^\/objects\/([a-f0-9]{64})\.bin$/;

export function resolveProfileImageInput(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return null;
    }

    // CAS object URL: /objects/{hash}.bin
    if (CAS_OBJECT_URL_PATTERN.test(trimmed)) {
        return `${API_ENDPOINT}${trimmed}`;
    }

    // Already a full URL starting with the API endpoint + /objects/
    if (trimmed.startsWith(API_ENDPOINT + "/objects/")) {
        return trimmed;
    }

    const markdownImage = extractFirstImageUrl(trimmed);
    if (markdownImage != null) {
        return markdownImage;
    }

    return normalizeAttachedImageUrl(trimmed);
}