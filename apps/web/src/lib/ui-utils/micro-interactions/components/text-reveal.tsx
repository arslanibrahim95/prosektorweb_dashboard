"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ANIMATION_CONFIG } from "../config";
import { usePrefersReducedMotion } from "../hooks";

interface TextRevealProps extends React.HTMLAttributes<HTMLSpanElement> {
    text: string;
    delay?: number;
    staggerDelay?: number;
    duration?: number;
    direction?: "up" | "down" | "fade" | "blur";
    respectReducedMotion?: boolean;
}

const TextReveal = React.forwardRef<HTMLSpanElement, TextRevealProps>(
    (
        {
            className,
            text,
            delay = 0,
            staggerDelay = 30,
            duration = 400,
            direction = "up",
            respectReducedMotion = true,
            ...props
        },
        ref
    ) => {
        const prefersReducedMotion = usePrefersReducedMotion();
        const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

        const characters = React.useMemo(() => text.split(""), [text]);

        const getInitialStyles = React.useCallback(() => {
            if (!shouldAnimate) {
                return { opacity: 1 };
            }

            switch (direction) {
                case "up":
                    return { opacity: 0, transform: "translateY(100%)" };
                case "down":
                    return { opacity: 0, transform: "translateY(-100%)" };
                case "blur":
                    return { opacity: 0, filter: "blur(8px)" };
                case "fade":
                default:
                    return { opacity: 0 };
            }
        }, [direction, shouldAnimate]);

        return (
            <span
                ref={ref}
                className={cn("inline-flex overflow-hidden", className)}
                {...props}
            >
                {characters.map((char, index) => (
                    <span
                        key={index}
                        className={cn("inline-block", shouldAnimate && "animate-text-reveal")}
                        style={{
                            ...getInitialStyles(),
                            animationDelay: `${delay + index * staggerDelay}ms`,
                            animationDuration: `${duration}ms`,
                            animationTimingFunction: ANIMATION_CONFIG.easings.outExpo,
                            animationFillMode: "forwards",
                            whiteSpace: char === " " ? "pre" : "normal",
                        }}
                    >
                        {char === " " ? "\u00A0" : char}
                    </span>
                ))}
            </span>
        );
    }
);
TextReveal.displayName = "TextReveal";

export { TextReveal };
export type { TextRevealProps };
