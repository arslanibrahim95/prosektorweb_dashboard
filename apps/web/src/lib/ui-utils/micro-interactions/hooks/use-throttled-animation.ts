"use client";

import * as React from "react";
import { ANIMATION_CONFIG } from "../config";

/**
 * Hook for RAF-based animations with throttling
 */
export const useThrottledAnimation = (
    callback: (progress: number) => void,
    duration: number,
    delay: number = 0
) => {
    const frameRef = React.useRef<number | null>(null);
    const lastUpdateRef = React.useRef(0);
    const isActiveRef = React.useRef(false);

    const start = React.useCallback(() => {
        if (isActiveRef.current) return; // Prevent multiple starts
        isActiveRef.current = true;

        const startTime = performance.now() + delay;

        const animate = (currentTime: number) => {
            if (!isActiveRef.current) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(Math.max(elapsed / duration, 0), 1);

            // Throttle state updates
            if (currentTime - lastUpdateRef.current >= ANIMATION_CONFIG.STATE_UPDATE_INTERVAL || progress >= 1) {
                callback(progress);
                lastUpdateRef.current = currentTime;
            }

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                isActiveRef.current = false;
            }
        };

        if (delay > 0) {
            setTimeout(() => {
                if (isActiveRef.current) {
                    frameRef.current = requestAnimationFrame(animate);
                }
            }, delay);
        } else {
            frameRef.current = requestAnimationFrame(animate);
        }
    }, [callback, duration, delay]);

    const stop = React.useCallback(() => {
        isActiveRef.current = false;
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
    }, []);

    React.useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return { start, stop };
};
