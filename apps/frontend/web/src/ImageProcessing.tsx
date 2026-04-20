import { useImageProgressStore } from "./stores/ImageEncodingProgress";
import { Progress } from "./stores/ImageEncodingProgressState";

let activeWorker: Worker | null = null;

// The actual options accepted by the factory function include Emscripten's `locateFile`
// FFmpeg imports are no longer required for the new AVIF encoding path.
// Keep them commented if you plan to revert or use elsewhere.
// import coreURL from "@ffmpeg/core?url";
// import wasmURL from "@ffmpeg/core/wasm?url";

// --- NEW IMPORTS FOR SASCHAZAR WASM-AVIF ---
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

export function killEncoding() {
    if (activeWorker) {
        console.log("Terminating encoding worker");
        activeWorker.terminate();
        activeWorker = null;
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
        speed: 6, // Optional: Higher speed = faster encode but slightly larger file
    };

    return new Promise((resolve, reject) => {
        killEncoding();

        try {
            useImageProgressStore.setState({
                progress: Progress.DOWNLOADING_ENCODER,
            });
            activeWorker = new Worker(
                new URL("./workers/AvifEncoding.worker.ts", import.meta.url),
                { type: "module" },
            );

            activeWorker.onmessage = async (e) => {
                if (e.data.error) {
                    killEncoding();
                    return reject(e.data.error);
                }

                console.log("Received: ", e.data.avifData.length, " length");

                const blob = new Blob([e.data.avifData], {
                    type: "image/avif",
                });
                const url = await blobDataToUrl(blob);

                killEncoding();

                console.log("URL length is: ", url.length);
                resolve(url);
            };

            console.log("Posting message to web worker");

            useImageProgressStore.setState({ progress: Progress.ENCODING });
            activeWorker.postMessage({ rgbaPixels, width, height, customOptions }, [
                rgbaPixels.buffer,
            ]);
        } catch (e) {
            reject(e);
        }
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
