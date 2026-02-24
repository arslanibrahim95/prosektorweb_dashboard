"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ANIMATION_CONFIG } from "../config";
import { usePrefersReducedMotion } from "../hooks";

interface MorphingIconProps extends React.HTMLAttributes<HTMLDivElement> {
    isActive: boolean;
    activeIcon: React.ReactNode;
    inactiveIcon: React.ReactNode;
    duration?: number;
    respectReducedMotion?: boolean;
}

const MorphingIcon = React.forwardRef<HTMLDivElement, MorphingIconProps>(
    (
        {
            className,
            isActive,
            activeIcon,
            inactiveIcon,
            duration = 300,
            respectReducedMotion = true,
            ...props
        },
        ref
    ) => {
        const prefersReducedMotion = usePrefersReducedMotion();
        const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

        return (
            <div ref={ref} className={cn("relative w-6 h-6", className)} {...props}>
                <div
                    className="absolute inset-0 transition-all"
                    style={{
                        opacity: isActive ? 1 : 0,
                        transform: shouldAnimate
                            ? isActive
                                ? "scale(1) rotate(0deg)"
                                : "scale(0.5) rotate(-90deg)"
                            : isActive
                                ? "scale(1)"
                                : "scale(0)",
                        transitionDuration: `${duration}ms`,
                        transitionTimingFunction: ANIMATION_CONFIG.easings.spring,
                    }}
                    aria-hidden={!isActive}
                >
                    {activeIcon}
                </div>
                <div
                    className="absolute inset-0 transition-all"
                    style={{
                        opacity: isActive ? 0 : 1,
                        transform: shouldAnimate
                            ? isActive
                                ? "scale(0.5) rotate(90deg)"
                                : "scale(1) rotate(0deg)"
                            : isActive
                                ? "scale(0)"
                                : "scale(1)",
                        transitionDuration: `${duration}ms`,
                        transitionTimingFunction: ANIMATION_CONFIG.easings.spring,
                    }}
                    aria-hidden={isActive}
                >
                    {inactiveIcon}
                </div>
            </div>
        );
    }
);
MorphingIcon.displayName = "MorphingIcon";

export { MorphingIcon };
export type { MorphingIconProps };
