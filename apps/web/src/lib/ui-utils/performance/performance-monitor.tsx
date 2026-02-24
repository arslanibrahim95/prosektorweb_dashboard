"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { WebVitalMetric, WebVitalName, LargestContentfulPaintEntry, LayoutShiftEntry } from "./types";
import { WEB_VITAL_THRESHOLDS } from "./constants";

interface PerformanceMonitorProps {
    onMetric?: (metric: WebVitalMetric) => void;
    showOverlay?: boolean;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
    onMetric,
    showOverlay = process.env.NODE_ENV === "development",
    position = "bottom-right",
}) => {
    const [metrics, setMetrics] = React.useState<WebVitalMetric[]>([]);
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    const observersRef = React.useRef<PerformanceObserver[]>([]);

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            // LCP Observer
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1] as LargestContentfulPaintEntry;

                if (!lastEntry) return;

                const value = lastEntry.renderTime ?? lastEntry.loadTime ?? lastEntry.startTime;

                const metric: WebVitalMetric = {
                    name: "LCP",
                    value: Math.round(value),
                    rating: value <= WEB_VITAL_THRESHOLDS.LCP.good
                        ? "good"
                        : value <= WEB_VITAL_THRESHOLDS.LCP.poor
                            ? "needs-improvement"
                            : "poor",
                    timestamp: Date.now(),
                };

                setMetrics((prev) => [...prev.filter((m) => m.name !== "LCP"), metric]);
                onMetric?.(metric);
            });

            // CLS Observer
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const lsEntry = entry as LayoutShiftEntry;
                    if (!lsEntry.hadRecentInput) {
                        clsValue += lsEntry.value;
                    }
                }

                const metric: WebVitalMetric = {
                    name: "CLS",
                    value: parseFloat(clsValue.toFixed(3)),
                    rating: clsValue <= WEB_VITAL_THRESHOLDS.CLS.good
                        ? "good"
                        : clsValue <= WEB_VITAL_THRESHOLDS.CLS.poor
                            ? "needs-improvement"
                            : "poor",
                    timestamp: Date.now(),
                };

                setMetrics((prev) => [...prev.filter((m) => m.name !== "CLS"), metric]);
                onMetric?.(metric);
            });

            // FCP and TTFB from navigation timing
            const observeNavigation = () => {
                const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

                if (navEntry) {
                    const ttfbValue = navEntry.responseStart;
                    const ttfbMetric: WebVitalMetric = {
                        name: "TTFB",
                        value: Math.round(ttfbValue),
                        rating: ttfbValue <= WEB_VITAL_THRESHOLDS.TTFB.good
                            ? "good"
                            : ttfbValue <= WEB_VITAL_THRESHOLDS.TTFB.poor
                                ? "needs-improvement"
                                : "poor",
                        timestamp: Date.now(),
                    };
                    setMetrics((prev) => [...prev.filter((m) => m.name !== "TTFB"), ttfbMetric]);
                    onMetric?.(ttfbMetric);

                    const fcpEntries = performance.getEntriesByName("first-contentful-paint");
                    const fcpEntry = fcpEntries[0] as PerformanceEntry | undefined;

                    if (fcpEntry) {
                        const fcpMetric: WebVitalMetric = {
                            name: "FCP",
                            value: Math.round(fcpEntry.startTime),
                            rating: fcpEntry.startTime <= WEB_VITAL_THRESHOLDS.FCP.good
                                ? "good"
                                : fcpEntry.startTime <= WEB_VITAL_THRESHOLDS.FCP.poor
                                    ? "needs-improvement"
                                    : "poor",
                            timestamp: Date.now(),
                        };
                        setMetrics((prev) => [...prev.filter((m) => m.name !== "FCP"), fcpMetric]);
                        onMetric?.(fcpMetric);
                    }
                }
            };

            // Observe LCP
            try {
                lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
                observersRef.current.push(lcpObserver);
            } catch {
                logger.warn("LCP observation not supported");
            }

            // Observe CLS
            try {
                clsObserver.observe({ type: "layout-shift", buffered: true });
                observersRef.current.push(clsObserver);
            } catch {
                logger.warn("CLS observation not supported");
            }

            // Navigation timing
            if (document.readyState === "complete") {
                observeNavigation();
            } else {
                window.addEventListener("load", observeNavigation, { once: true });
            }
        } catch (e) {
            const error = e instanceof Error ? e : new Error("Failed to initialize performance monitoring");
            setError(error);
            logger.warn("Performance monitoring initialization failed", { error });
        }

        return () => {
            // Proper cleanup - clear buffers before disconnect
            observersRef.current.forEach((observer) => {
                try {
                    observer.takeRecords();
                    observer.disconnect();
                } catch (e) {
                    logger.warn("Error disconnecting observer", { error: e });
                }
            });
            observersRef.current = [];
        };
    }, [onMetric]);

    if (!showOverlay) return null;
    if (error) return null; // Silently fail in production

    const positionClasses = {
        "top-left": "top-4 left-4",
        "top-right": "top-4 right-4",
        "bottom-left": "bottom-4 left-4",
        "bottom-right": "bottom-4 right-4",
    };

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case "good":
                return "bg-green-500";
            case "needs-improvement":
                return "bg-yellow-500";
            case "poor":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getMetricDisplay = (metric: WebVitalMetric) => {
        if (metric.name === "CLS") {
            return metric.value.toFixed(3);
        }
        return `${metric.value}ms`;
    };

    return (
        <div className={cn("fixed z-[9999] font-mono text-xs", positionClasses[position])}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg",
                    "bg-background/95 backdrop-blur-sm border shadow-lg",
                    "hover:bg-accent transition-colors"
                )}
            >
                <span className="font-semibold">Web Vitals</span>
                {metrics.length > 0 && (
                    <span
                        className={cn(
                            "w-2 h-2 rounded-full",
                            getRatingColor(
                                metrics.every((m) => m.rating === "good")
                                    ? "good"
                                    : metrics.some((m) => m.rating === "poor")
                                        ? "poor"
                                        : "needs-improvement"
                            )
                        )}
                    />
                )}
            </button>

            {isExpanded && (
                <div
                    className={cn(
                        "mt-2 p-3 rounded-lg",
                        "bg-background/95 backdrop-blur-sm border shadow-lg",
                        "space-y-2 min-w-[200px]"
                    )}
                >
                    {(["LCP", "INP", "CLS", "TTFB", "FCP"] as WebVitalName[]).map((name) => {
                        const metric = metrics.find((m) => m.name === name);
                        return (
                            <div key={name} className="flex items-center justify-between">
                                <span className="font-medium">{name}</span>
                                {metric ? (
                                    <span className={cn("px-2 py-0.5 rounded text-white", getRatingColor(metric.rating))}>
                                        {getMetricDisplay(metric)}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">Loading...</span>
                                )}
                            </div>
                        );
                    })}

                    <div className="pt-2 mt-2 border-t text-muted-foreground">
                        <p className="text-[10px]">2026 Targets:</p>
                        <p className="text-[10px]">LCP &lt;1.8s | INP &lt;150ms | CLS &lt;0.05</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export { PerformanceMonitor };
export type { PerformanceMonitorProps };
