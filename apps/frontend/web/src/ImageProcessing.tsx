import { useImageProgressStore } from "./stores/ImageEncodingProgress";
import { Progress } from "./stores/ImageEncodingProgressState";

const dataImageRegex =
    /^data:image\/(png|jpe?g|webp|bmp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;
const supportedExtensions = ["png", "jpg", "jpeg", "gif", "avif", "webp"];

let libavifModule: Promise<typeof import("@jsquash/avif")> | null = null;

async function loadLibavif() {
    if (!libavifModule) {
        libavifModule = import("@jsquash/avif");
    }
    return libavifModule;
}

async function blobDataToUrl(b: Blob): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(b);
    });
}




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

// Converts image into a more efficient
// AV1 format
export async function dataToAvif(
    dataUrl: string,
    updateState: boolean = true,
): Promise<string> {
    if (!isValidDataImage(dataUrl)) {
        return dataUrl;
    }

    if (updateState)
        useImageProgressStore.setState({
            progress: Progress.DOWNLOADING_ENCODER,
        });

    const { encode } = await loadLibavif();

    if (updateState)
        useImageProgressStore.setState({ progress: Progress.PREPROCESSING });

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

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (updateState)
        useImageProgressStore.setState({ progress: Progress.ENCODING });

    const avifBuffer = await encode(imageData, {
        quality: 50,
        bitDepth: 8,
    });

    const avifBlob = new Blob([avifBuffer], { type: "image/avif" });

    const blobUrl = await blobDataToUrl(avifBlob);

    if (updateState)
        useImageProgressStore.setState({ progress: Progress.NONE });

    return blobUrl;
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
