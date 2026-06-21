/// <reference lib="webworker" />

import wasm_avif, { type AVIFModule } from "@saschazar/wasm-avif";
import defaultOptions from "@saschazar/wasm-avif/options";
import wasmAvifURL from "@saschazar/wasm-avif/wasm_avif.wasm?url";

declare const self: DedicatedWorkerGlobalScope;

type AVIFModuleOptions = Partial<AVIFModule> & {
    locateFile?: (path: string) => string;
};

const modulePromise = wasm_avif({
    locateFile: () => wasmAvifURL,
} as AVIFModuleOptions);

// Process one message at a time to avoid WASM re-entrancy issues
let processing = false;
const queue: Array<{ data: any; id: number }> = [];

async function processQueue() {
    if (processing || queue.length === 0) return;
    processing = true;

    const { data, id } = queue.shift()!;
    const { rgbaPixels, width, height, customOptions } = data;

    try {
        const avifModule = await modulePromise;

        const avifData = avifModule.encode(
            rgbaPixels,
            width,
            height,
            4,
            customOptions || defaultOptions,
            3,
        );

        if (avifData && "error" in avifData) {
            throw new Error(avifData.error);
        }

        let encodedData: Uint8Array;

        if (avifData instanceof Uint8Array) {
            encodedData = avifData.slice();
        } else if (avifData instanceof ArrayBuffer) {
            encodedData = new Uint8Array(avifData);
        } else {
            console.warn("Unexpected type, attempting conversion");
            encodedData = new Uint8Array(
                avifData as unknown as Iterable<number>,
            );
        }

        self.postMessage({ id, avifData: encodedData }, [encodedData.buffer]);

        // NOTE: Do NOT call avifModule.free() here — it destroys the WASM
        // module's memory, breaking all subsequent encode() calls. The
        // module is initialized once and reused for the worker's lifetime.
    } catch (error) {
        self.postMessage({ id, error: `${error}` });
    } finally {
        processing = false;
        processQueue();
    }
}

self.onmessage = (e) => {
    const id = e.data.id ?? 0;
    queue.push({ data: e.data, id });
    processQueue();
};