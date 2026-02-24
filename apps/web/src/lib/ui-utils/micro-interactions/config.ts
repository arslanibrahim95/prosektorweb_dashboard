"use client";

/**
 * Micro-Interactions Configuration Constants
 */

export const ANIMATION_CONFIG = {
    durations: {
        micro: 100,
        fast: 150,
        normal: 200,
        slow: 300,
        elaborate: 400,
    },
    easings: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
        inOutExpo: "cubic-bezier(0.87, 0, 0.13, 1)",
    },
    // Throttle state updates to every 100ms to prevent re-render storms
    STATE_UPDATE_INTERVAL: 100,
} as const;
