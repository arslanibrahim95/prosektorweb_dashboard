"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "../hooks";

interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
    direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
    duration?: number;
    delay?: number;
    respectReducedMotion?: boolean;
}

const PageTransition = React.forwardRef<
    HTMLDivElement,
    PageTransitionProps
>(
    (
        {
            className,
            direction = "up",
            duration = 400,
            delay = 0,
            respectReducedMotion = true,
            children,
            ...props
        },
        ref
    ) => {
        const prefersReducedMotion = usePrefersReducedMotion();
        const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

        const getAnimationClass = () => {
            if (!shouldAnimate) return "";

            switch (direction) {
                case "up":
                    return "animate-page-enter-up";
                case "down":
                    return "animate-page-enter-down";
                case "left":
                    return "animate-page-enter-left";
                case "right":
                    return "animate-page-enter-right";
                case "scale":
                    return "animate-page-enter-scale";
                case "fade":
                default:
                    return "animate-fade-in";
            }
        };

        return (
            <div
                ref={ref}
                className={cn(getAnimationClass(), className)}
                style={{
                    animationDuration: shouldAnimate ? `${duration}ms` : undefined,
                    animationDelay: shouldAnimate ? `${delay}ms` : undefined,
                    animationFillMode: shouldAnimate ? "forwards" : undefined,
                }}
                {...props}
            >
                {children}
            </div>
        );
    }
);
PageTransition.displayName = "PageTransition";

export { PageTransition };
export type { PageTransitionProps };
