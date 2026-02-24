"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ANIMATION_CONFIG } from "../config";
import { usePrefersReducedMotion } from "../hooks";

interface CountUpProps extends React.HTMLAttributes<HTMLSpanElement> {
    end: number;
    start?: number;
    duration?: number;
    delay?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    separator?: string;
    respectReducedMotion?: boolean;
}

const CountUp = React.forwardRef<HTMLSpanElement, CountUpProps>(
    (
        {
            className,
            end,
            start = 0,
            duration = 2000,
            delay = 0,
            decimals = 0,
            prefix = "",
            suffix = "",
            separator = ",",
            respectReducedMotion = true,
            ...props
        },
        ref
    ) => {
        const [count, setCount] = React.useState(start);
        const countRef = React.useRef(start);
        const frameRef = React.useRef<number | null>(null);
        const lastUpdateRef = React.useRef(0);
        const isActiveRef = React.useRef(false);
        const prefersReducedMotion = usePrefersReducedMotion();

        // Skip animation if reduced motion is preferred
        const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

        React.useEffect(() => {
            if (!shouldAnimate) {
                setCount(end);
                return;
            }

            const timeout = setTimeout(() => {
                if (isActiveRef.current) return;
                isActiveRef.current = true;

                const startTime = performance.now();
                const difference = end - start;

                const animate = (currentTime: number) => {
                    if (!isActiveRef.current) return;

                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Ease out expo
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    const currentCount = start + difference * easeProgress;

                    countRef.current = currentCount;

                    // Throttle state updates to prevent re-render storm
                    const shouldUpdateState =
                        currentTime - lastUpdateRef.current >= ANIMATION_CONFIG.STATE_UPDATE_INTERVAL ||
                        progress >= 1;

                    if (shouldUpdateState) {
                        setCount(currentCount);
                        lastUpdateRef.current = currentTime;
                    }

                    if (progress < 1) {
                        frameRef.current = requestAnimationFrame(animate);
                    } else {
                        isActiveRef.current = false;
                        setCount(end); // Ensure final value is exact
                    }
                };

                frameRef.current = requestAnimationFrame(animate);
            }, delay);

            return () => {
                clearTimeout(timeout);
                isActiveRef.current = false;
                if (frameRef.current) {
                    cancelAnimationFrame(frameRef.current);
                }
            };
        }, [end, start, duration, delay, shouldAnimate]);

        const formatNumber = React.useCallback(
            (num: number) => {
                const fixed = num.toFixed(decimals);
                const parts = fixed.split(".");
                const intPart = parts[0] ?? '';
                const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
                if (parts[1]) {
                    return `${formattedInt}.${parts[1]}`;
                }
                return formattedInt;
            },
            [decimals, separator]
        );

        return (
            <span ref={ref} className={cn("tabular-nums", className)} {...props}>
                {prefix}
                {formatNumber(count)}
                {suffix}
            </span>
        );
    }
);
CountUp.displayName = "CountUp";

export { CountUp };
export type { CountUpProps };
