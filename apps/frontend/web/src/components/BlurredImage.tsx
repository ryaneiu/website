import clsx from "clsx";

interface Props {
    src: string;
    alt: string;
    isBlurred: boolean;
}

export function BlurredImage({ src, alt, isBlurred }: Props) {
    if (!src) {
        return null;
    }

    return (
        <div className="relative overflow-hidden rounded-md border border-black/15 dark:border-white/15 transition-colors duration-300">
            <img
                src={src}
                alt={alt}
                loading="lazy"
                className={clsx(
                    "w-full max-h-[26rem] object-cover transition-all duration-300",
                    isBlurred && "blur-xl scale-105",
                )}
            />
            {isBlurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white font-semibold tracking-wide">
                    Sensitive Content
                </div>
            )}
        </div>
    );
}
