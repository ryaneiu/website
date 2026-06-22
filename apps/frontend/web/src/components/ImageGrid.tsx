import React, { useState } from "react";
import { TransparentIconButton } from "./TransparentIconButton";

type ImageGridImage = {
    src: string;
    width: number;
    height: number;
};

interface ImageGridProps {
    images: ImageGridImage[];
    onImageClick?: (index: number) => void;
    onClickDelete?: (index: number) => void;
}

function ImageSlot({
    src,
    alt,
    onClick,
    onDelete,
    imageWidth,
    imageHeight,
    totalImageCount,
}: {
    src: string;
    alt: string;
    onClick?: () => void;
    onDelete?: () => void;
    imageWidth: number;
    imageHeight: number;
    totalImageCount: number;
}) {
    const [loaded, setLoaded] = useState<boolean>(false);

    return (
        <div className="relative h-full w-full group overflow-hidden">
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover cursor-pointer transition-[filter] duration-200 group-hover:brightness-[0.7]"
                onClick={onClick}
                loading="lazy"
                decoding="async"
                width={totalImageCount == 1 && !loaded ? imageWidth : undefined}
                height={
                    totalImageCount == 1 && !loaded ? imageHeight : undefined
                }
                onLoad={() => setLoaded(true)}
            />
            {onDelete != null && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <TransparentIconButton
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#e3e3e3"
                            >
                                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                        }
                        onClick={onDelete}
                    />
                </div>
            )}
        </div>
    );
}

export const ImageGrid: React.FC<ImageGridProps> = ({
    images,
    onImageClick,
    onClickDelete,
}) => {
    const count = images.length;

    if (count === 0) return null;

    // 1 Image: Full layout, natural aspect ratio but capped height
    if (count === 1) {
        return (
            <div className="w-full aspect-auto min-h-0 h-100 overflow-hidden rounded-2xl border border-black/15 dark:border-white/15">
                <ImageSlot
                    src={images[0].src}
                    alt="Post attachment"
                    onClick={() => onImageClick?.(0)}
                    onDelete={
                        onClickDelete != null
                            ? () => onClickDelete(0)
                            : undefined
                    }
                    imageWidth={images[0].width}
                    imageHeight={images[0].height}
                    totalImageCount={1}
                />
            </div>
        );
    }

    // 2 Images: 50/50 Split Side-by-Side
    if (count === 2) {
        return (
            <div className="grid grid-cols-2 gap-1 w-full h-100 overflow-hidden rounded-2xl border border-black/15 dark:border-white/15">
                {images.map((src, index) => (
                    <ImageSlot
                        key={index}
                        src={src.src}
                        alt={`Attachment ${index + 1}`}
                        onClick={() => onImageClick?.(index)}
                        onDelete={
                            onClickDelete != null
                                ? () => onClickDelete(index)
                                : undefined
                        }
                        imageWidth={src.width}
                        imageHeight={src.height}
                        totalImageCount={2}
                    />
                ))}
            </div>
        );
    }

    // 3 Images: 1 Large Left (spans 2 rows), 2 Stacked Right
    if (count === 3) {
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-100 overflow-hidden rounded-2xl border border-black/15 dark:border-white/15">
                <div className="row-span-2 h-full w-full">
                    <ImageSlot
                        src={images[0].src}
                        alt="Attachment 1"
                        onClick={() => onImageClick?.(0)}
                        onDelete={
                            onClickDelete != null
                                ? () => onClickDelete(0)
                                : undefined
                        }
                        imageWidth={images[0].width}
                        imageHeight={images[0].height}
                        totalImageCount={3}
                    />
                </div>
                <div className="h-full w-full">
                    <ImageSlot
                        src={images[1].src}
                        alt="Attachment 2"
                        onClick={() => onImageClick?.(1)}
                        onDelete={
                            onClickDelete != null
                                ? () => onClickDelete(1)
                                : undefined
                        }
                        imageWidth={images[1].width}
                        imageHeight={images[1].height}
                        totalImageCount={3}
                    />
                </div>
                <div className="h-full w-full">
                    <ImageSlot
                        src={images[2].src}
                        alt="Attachment 3"
                        onClick={() => onImageClick?.(2)}
                        onDelete={
                            onClickDelete != null
                                ? () => onClickDelete(2)
                                : undefined
                        }
                        imageWidth={images[2].width}
                        imageHeight={images[2].height}
                        totalImageCount={3}
                    />
                </div>
            </div>
        );
    }

    // 4+ Images: Perfect 2x2 Quad Grid with "+N" Overlay
    const displayImages = images.slice(0, 4);
    const remainingCount = count - 4;

    return (
        <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-100 overflow-hidden rounded-2xl border border-black/15 dark:border-white/15">
            {displayImages.map((src, index) => {
                const isLast = index === 3;
                return (
                    <div key={index} className="relative h-full w-full group">
                        <ImageSlot
                            src={src.src}
                            alt={`Attachment ${index + 1}`}
                            onClick={() => onImageClick?.(index)}
                            onDelete={
                                onClickDelete != null
                                    ? () => onClickDelete(index)
                                    : undefined
                            }
                            imageWidth={src.width}
                            imageHeight={src.height}
                            totalImageCount={images.length}
                        />
                        {isLast && remainingCount > 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer pointer-events-none select-none">
                                <span className="text-white text-2xl font-bold">
                                    +{remainingCount}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
