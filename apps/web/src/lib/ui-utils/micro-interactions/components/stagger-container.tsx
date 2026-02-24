"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ANIMATION_CONFIG } from "../config";
import { usePrefersReducedMotion } from "../hooks";

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    staggerDelay?: number;
    initialDelay?: number;
    direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
    duration?: number;
    as?: React.ElementType;
    respectReducedMotion?: boolean;
}

const StaggerContainer = React.forwardRef<
    HTMLDivElement,
    StaggerContainerProps
>(
    (
        {
            className,
            staggerDelay = 60,
            initialDelay = 0,
            direction = "up",
            duration = 400,
            as: Component = "div",
            respectReducedMotion = true,
            children,
            ...props
        },
        ref
    ) => {
        const prefersReducedMotion = usePrefersReducedMotion();
        const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

        const getAnimationStyles = React.useCallback(() => {
            if (!shouldAnimate) {
                return { opacity: 1 };
            }

            const base = {
                opacity: 0,
                animationDuration: `${duration}ms`,
                animationTimingFunction: ANIMATION_CONFIG.easings.outExpo,
                animationFillMode: "forwards" as const,
            };

            switch (direction) {
                case "up":
                    return { ...base, transform: "translateY(20px)" };
                case "down":
                    return { ...base, transform: "translateY(-20px)" };
                case "left":
                    return { ...base, transform: "translateX(20px)" };
                case "right":
                    return { ...base, transform: "translateX(-20px)" };
                case "scale":
                    return { ...base, transform: "scale(0.95)" };
                case "fade":
                default:
                    return base;
            }
        }, [direction, duration, shouldAnimate]);

        const childrenArray = React.Children.toArray(children);

        return (
            <Component
                ref={ref as React.Ref<HTMLDivElement>}
                className={cn("stagger-container", className)}
                {...props}
            >
                {childrenArray.map((child, index) => (
                    <div
                        key={index}
                        className="stagger-item"
                        style={{
                            ...getAnimationStyles(),
                            animationName: shouldAnimate ? "stagger-fade-in" : undefined,
                            animationDelay: `${initialDelay + index * staggerDelay}ms`,
                        }}
                    >
                        {child}
                    </div>
                ))}
            </Component>
        );
    }
);
StaggerContainer.displayName = "StaggerContainer";

export { StaggerContainer };
export type { StaggerContainerProps };
