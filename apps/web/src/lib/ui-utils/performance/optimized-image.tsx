"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    placeholderSrc?: string;
    priority?: boolean;
    quality?: number;
    objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    width,
    height,
    placeholderSrc,
    priority = false,
    className,
    objectFit = "cover",
    ...props
}) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [currentSrc, setCurrentSrc] = React.useState(placeholderSrc || src);
    const imgRef = React.useRef<HTMLImageElement | null>(null);

    React.useEffect(() => {
        if (priority) {
            setCurrentSrc(src);
            return;
        }

        // Load actual image
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
        };
        img.onerror = () => {
            logger.warn("Failed to load image", { src });
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src, priority]);

    return (
        <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
            {placeholderSrc && !isLoaded && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={placeholderSrc}
                    alt=""
                    aria-hidden="true"
                    className={cn(
                        "absolute inset-0 w-full h-full transition-opacity duration-300",
                        "blur-sm scale-105",
                        isLoaded ? "opacity-0" : "opacity-100"
                    )}
                    style={{ objectFit }}
                />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                ref={imgRef}
                src={currentSrc}
                alt={alt}
                width={width}
                height={height}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                onLoad={() => setIsLoaded(true)}
                onError={() => logger.warn("Image failed to load", { src: currentSrc })}
                className={cn(
                    "w-full h-full transition-opacity duration-300",
                    isLoaded ? "opacity-100" : "opacity-0"
                )}
                style={{ objectFit }}
                {...props}
            />
        </div>
    );
};

export { OptimizedImage };
export type { OptimizedImageProps };
