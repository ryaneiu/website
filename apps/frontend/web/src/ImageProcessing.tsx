import { useImageProgressStore } from "./stores/ImageEncodingProgress";
import { Progress } from "./stores/ImageEncodingProgressState";

import defaultOptions from "@saschazar/wasm-avif/options";

const dataImageRegex =
    /^data:image\/(png|jpe?g|webp|bmp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;
const supportedExtensions = ["png", "jpg", "jpeg", "gif", "avif", "webp"];

export function isValidDataImage(input: string): boolean {
    return dataImageRegex.test(input);
}

export function canLoadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

async function blobDataToUrl(b: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(b);
    });
}

export function killEncoding(activeWorker: Worker) {
    activeWorker.terminate();
}

// Singleton background worker for AVIF encoding.
// Using a single worker with a request queue avoids race conditions
// in @saschazar/wasm-avif's WASM initialization when multiple
// workers try to load+compile the module concurrently.

let avifWorker: Worker | null = null;
let nextRequestId = 0;
type PendingRequest = {
    resolve: (url: string) => void;
    reject: (err: unknown) => void;
};
const pendingRequests = new Map<number, PendingRequest>();

function getOrCreateWorker(): Worker {
    if (!avifWorker) {
        avifWorker = new Worker(
            new URL("./workers/AvifEncoding.worker.ts", import.meta.url),
            { type: "module" },
        );

        avifWorker.onmessage = async (e) => {
            const { id, avifData, error } = e.data;
            const pending = pendingRequests.get(id);
            if (!pending) return;
            pendingRequests.delete(id);

            if (error) {
                pending.reject(new Error(error));
                return;
            }

            try {
                const blob = new Blob([avifData], { type: "image/avif" });
                const url = await blobDataToUrl(blob);
                pending.resolve(url);
            } catch (err) {
                pending.reject(err);
            }
        };

        avifWorker.onerror = (err) => {
            console.error("AVIF worker error:", err);
            // Reject all pending requests
            for (const [, pending] of pendingRequests) {
                pending.reject(new Error("AVIF worker crashed"));
            }
            pendingRequests.clear();
            avifWorker = null;
        };
    }
    return avifWorker;
}

export function terminateWorker() {
    if (avifWorker) {
        for (const [, pending] of pendingRequests) {
            pending.reject(new Error("AVIF worker terminated"));
        }
        pendingRequests.clear();
        avifWorker.terminate();
        avifWorker = null;
    }
}

export async function dataToAvif(
    dataUrl: string,
    updateState: boolean = true,
): Promise<string> {
    if (!isValidDataImage(dataUrl)) {
        return dataUrl;
    }

    if (updateState) {
        useImageProgressStore.setState({
            progress: Progress.DOWNLOADING_ENCODER,
        });
    }

    // --- Load the image and get raw RGBA pixels via canvas ---
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) {
        throw new Error("Invalid image dimensions");
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get 2d context on canvas");
    }

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const rgbaPixels = imageData.data;

    if (updateState) {
        useImageProgressStore.setState({ progress: Progress.ENCODING });
    }

    const customOptions = {
        ...defaultOptions,
        minQuantizer: 32,
        maxQuantizer: 32,
        speed: 6,
    };

    const id = nextRequestId++;
    const worker = getOrCreateWorker();

    return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        worker.postMessage(
            { id, rgbaPixels, width, height, customOptions },
            [rgbaPixels.buffer],
        );
    });
}

export function hasSupportedImageExtension(url: string): boolean {
    try {
        const pathname = new URL(url).pathname;
        const ext = pathname.split(".").pop()?.toLowerCase();
        return !!ext && supportedExtensions.includes(ext);
    } catch {
        return false;
    }
}
