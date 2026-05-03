import clsx from "clsx";
import { useEffect, useState } from "react";

interface Props {
    src: string;
    alt: string;
    isBlurred: boolean;
}

function isSafeImageSrc(value: string) {
    try {
        // Handle data URLs separately
        if (value.startsWith("data:")) {
            // Only allow AVIF base64
            return /^data:image\/avif;base64,[A-Za-z0-9+/=]+$/.test(value);
        }

        const url = new URL(value, window.location.origin);

        // Only allow http/https
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

export function BlurredImage({ src, alt, isBlurred }: Props) {
    const [loadingFailed, setFailed] = useState<boolean>(false);

    useEffect(() => {
        if (!src) {
            setFailed(true);
            return;
        }
        const imageSafe = isSafeImageSrc(src);
        if (!imageSafe) {
            setFailed(true);
        }
    }, [src]);

    if (!src) {
        return null;
    }

    return (
        <div className="relative overflow-hidden rounded-md border border-black/15 dark:border-white/15 transition-colors duration-300">
            {loadingFailed && (
                <div className="absolute w-100 h-25 bg-black flex justify-center items-center">
                    <div>
                        <h3 className="font-bold text-white">
                            Failed to load image
                        </h3>
                    </div>
                </div>
            )}
            {!loadingFailed && <img
                src={isSafeImageSrc(src) ? src : "invalid"}
                alt={alt}
                loading="lazy"
                className={clsx(
                    "w-full max-h-[26rem] object-cover transition-all duration-300",
                    isBlurred && "blur-xl scale-105",
                )}
                onError={() => setFailed(true)}
            />}
            {isBlurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white font-semibold tracking-wide">
                    Sensitive Content
                </div>
            )}
        </div>
    );
}
