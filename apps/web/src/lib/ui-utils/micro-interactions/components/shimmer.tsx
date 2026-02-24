"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    variant?: "default" | "dark" | "diagonal";
}

const Shimmer = React.forwardRef<HTMLDivElement, ShimmerProps>(
    (
        {
            className,
            width = "100%",
            height = "1rem",
            borderRadius = "0.25rem",
            variant = "default",
            ...props
        },
        ref
    ) => {
        const variantClasses = {
            default: "shimmer-skeleton",
            dark: "shimmer-skeleton dark",
            diagonal: "shimmer-skeleton-diagonal",
        };

        return (
            <div
                ref={ref}
                className={cn(variantClasses[variant], "animate-pulse", className)}
                style={{
                    width,
                    height,
                    borderRadius,
                }}
                aria-hidden="true"
                {...props}
            />
        );
    }
);
Shimmer.displayName = "Shimmer";

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
    lines?: number;
    hasImage?: boolean;
    imageHeight?: string | number;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
    (
        {
            className,
            lines = 3,
            hasImage = true,
            imageHeight = "12rem",
            ...props
        },
        ref
    ) => (
        <div
            ref={ref}
            className={cn("rounded-xl border bg-card p-6 space-y-4", className)}
            {...props}
            aria-busy="true"
            aria-label="Loading content"
        >
            {hasImage && <Shimmer height={imageHeight} borderRadius="0.5rem" />}
            <div className="space-y-2">
                <Shimmer width="60%" height="1.5rem" />
                {Array.from({ length: lines }).map((_, i) => (
                    <Shimmer
                        key={i}
                        width={i === lines - 1 ? "80%" : "100%"}
                        height="0.875rem"
                    />
                ))}
            </div>
        </div>
    )
);
SkeletonCard.displayName = "SkeletonCard";

export { Shimmer, SkeletonCard };
export type { ShimmerProps, SkeletonCardProps };
