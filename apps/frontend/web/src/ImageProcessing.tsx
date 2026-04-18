import { useImageProgressStore } from "./stores/ImageEncodingProgress";
import { Progress } from "./stores/ImageEncodingProgressState";
import type { AVIFModule } from "@saschazar/wasm-avif";

// The actual options accepted by the factory function include Emscripten's `locateFile`
type AVIFModuleOptions = Partial<AVIFModule> & {
    locateFile?: (path: string) => string;
};

// FFmpeg imports are no longer required for the new AVIF encoding path.
// Keep them commented if you plan to revert or use elsewhere.
// import coreURL from "@ffmpeg/core?url";
// import wasmURL from "@ffmpeg/core/wasm?url";

// --- NEW IMPORTS FOR SASCHAZAR WASM-AVIF ---
import wasm_avif from "@saschazar/wasm-avif";
import defaultOptions from "@saschazar/wasm-avif/options";
import wasmAvifURL from "@saschazar/wasm-avif/wasm_avif.wasm?url";

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
    const rgbaPixels = new Uint8Array(imageData.data.buffer);

    if (updateState) {
        useImageProgressStore.setState({ progress: Progress.ENCODING });
    }

    try {
        // Initialize the WASM module. `locateFile` is used to provide the wasm file URL.
        // The type definitions are incomplete, so we use `as any` to bypass the error.
        const avifModule = await wasm_avif({
            locateFile: () => wasmAvifURL,
        } as AVIFModuleOptions);

        const customOptions = {
            ...defaultOptions,
            minQuantizer: 32,
            maxQuantizer: 32,
            speed: 6, // Optional: Higher speed = faster encode but slightly larger file
        };

        // Encode: (pixels, width, height, channels, options, chroma subsampling)
        // 4 channels = RGBA, 3 = 4:2:0 chroma subsampling.
        const avifData = avifModule.encode(
            rgbaPixels,
            width,
            height,
            4,
            customOptions,
            3,
        );

        // The module may return an error object instead of a Uint8Array.
        if (
            !avifData ||
            (typeof avifData === "object" && "error" in avifData)
        ) {
            throw new Error(
                `AVIF encoding failed: ${avifData.error || "Unknown error"}`,
            );
        }

        // Ensure we have a Uint8Array before slicing.
        const encodedBuffer = avifData as Uint8Array;
        const avifBlob = new Blob([encodedBuffer.slice()], {
            type: "image/avif",
        });

        // Free the C++ module memory
        avifModule.free();

        const blobUrl = await blobDataToUrl(avifBlob);
        return blobUrl;
    } catch (error) {
        // Ensure we reset progress state on failure
        throw new Error(`Failed to encode: ${error}`);
    } finally {
        if (updateState) {
            useImageProgressStore.setState({ progress: Progress.NONE });
        }
    }
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
