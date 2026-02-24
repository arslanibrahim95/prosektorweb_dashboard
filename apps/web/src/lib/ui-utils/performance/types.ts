"use client";

/**
 * Performance Module Types
 */

export type WebVitalName = "LCP" | "INP" | "CLS" | "TTFB" | "FCP";

export interface WebVitalMetric {
    name: WebVitalName;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
    timestamp: number;
}

// Type-safe Performance Entry interfaces
export interface LargestContentfulPaintEntry extends PerformanceEntry {
    renderTime?: number;
    loadTime?: number;
}

export interface LayoutShiftEntry extends PerformanceEntry {
    hadRecentInput: boolean;
    value: number;
}

export interface EventTimingEntry extends PerformanceEntry {
    duration: number;
}

export interface ResourceEntry extends PerformanceEntry {
    encodedBodySize?: number;
}
