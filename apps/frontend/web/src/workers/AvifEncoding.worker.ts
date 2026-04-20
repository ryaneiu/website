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

self.onmessage = async (e) => {

    console.log("Web worker received the message");

    const { rgbaPixels, width, height, customOptions } = e.data;

    if (!rgbaPixels || rgbaPixels.length === 0) {
        console.error("Web worker received no data");
        self.postMessage({ error: "Received empty pixel data (Transfer failed)" });
        return;
    }

    console.log("Received: ", rgbaPixels.length, " of data");

    try {
        const avifModule = await modulePromise

        const avifData = avifModule.encode(
            rgbaPixels,
            width,
            height,
            4,
            customOptions || defaultOptions,
            3
        );

        if (avifData && 'error' in avifData) {
            throw new Error(avifData.error);
        }

        let encodedData: Uint8Array;

        if (avifData instanceof Uint8Array) {
            // .slice() creates a copy, detaching it from the WASM heap
            encodedData = avifData.slice();
        } else if (avifData instanceof ArrayBuffer) {
            encodedData = new Uint8Array(avifData);
        } else {
            console.warn("Unexpected type, attempting conversion");
            encodedData = new Uint8Array(avifData as unknown as Iterable<number>);
        }

        // FIX: Send 'encodedData' (the copy) and transfer its buffer
        self.postMessage({ avifData: encodedData }, [encodedData.buffer]);

        // Clean up WASM memory if the library requires it
        if (typeof avifModule.free === 'function') {
            avifModule.free();
        }
    } catch (error) {
        self.postMessage({ error: `${error}` });
    }
};