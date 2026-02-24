"use client";

/**
 * Performance Module Constants
 */

export const WEB_VITAL_THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },
    INP: { good: 200, poor: 500 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 600, poor: 1000 },
    FCP: { good: 1800, poor: 3000 },
} as const;
