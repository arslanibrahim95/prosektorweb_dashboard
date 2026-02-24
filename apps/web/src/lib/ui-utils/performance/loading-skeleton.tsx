"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    className?: string;
    count?: number;
    type?: "text" | "circle" | "rect" | "card";
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    className,
    count = 1,
    type = "text",
}) => {
    const baseClasses = "animate-pulse bg-muted rounded";

    const typeClasses = {
        text: "h-4 w-full",
        circle: "h-12 w-12 rounded-full",
        rect: "h-24 w-full",
        card: "h-48 w-full",
    };

    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(baseClasses, typeClasses[type], className)}
                    style={{ animationDelay: `${i * 100}ms` }}
                    aria-hidden="true"
                />
            ))}
        </>
    );
};

export { LoadingSkeleton };
export type { LoadingSkeletonProps };
