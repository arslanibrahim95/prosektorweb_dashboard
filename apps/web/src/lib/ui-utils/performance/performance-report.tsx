"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { ResourceEntry } from "./types";

interface PerformanceReportProps {
    className?: string;
}

const PerformanceReport: React.FC<PerformanceReportProps> = ({ className }) => {
    const [report, setReport] = React.useState<{
        fcp: number | null;
        lcp: number | null;
        cls: number | null;
        ttfb: number | null;
        resourceCount: number;
        totalSize: number;
    }>({
        fcp: null,
        lcp: null,
        cls: null,
        ttfb: null,
        resourceCount: 0,
        totalSize: 0,
    });

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const generateReport = () => {
            try {
                const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
                const resources = performance.getEntriesByType("resource") as ResourceEntry[];

                const fcpEntry = performance.getEntriesByName("first-contentful-paint")[0] as PerformanceEntry | undefined;

                setReport({
                    fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
                    lcp: null,
                    cls: null,
                    ttfb: navigation ? Math.round(navigation.responseStart) : null,
                    resourceCount: resources.length,
                    totalSize: resources.reduce((acc, r) => acc + (r.encodedBodySize || 0), 0),
                });
            } catch (e) {
                logger.warn("Failed to generate performance report", { error: e });
            }
        };

        if (document.readyState === "complete") {
            generateReport();
        } else {
            window.addEventListener("load", generateReport, { once: true });
        }
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className={cn("p-4 rounded-lg border bg-card", className)}>
            <h3 className="font-semibold mb-4">Performance Report</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-sm text-muted-foreground">First Contentful Paint</p>
                    <p className="text-lg font-mono">{report.fcp ? `${report.fcp}ms` : "N/A"}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Time to First Byte</p>
                    <p className="text-lg font-mono">{report.ttfb ? `${report.ttfb}ms` : "N/A"}</p>
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Resources</span>
                    <span className="font-mono">{report.resourceCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Size</span>
                    <span className="font-mono">{formatBytes(report.totalSize)}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <p>2026 Targets:</p>
                <ul className="mt-1 space-y-1">
                    <li>FCP: &lt; 1.0s | LCP: &lt; 1.8s</li>
                    <li>INP: &lt; 150ms | CLS: &lt; 0.05</li>
                </ul>
            </div>
        </div>
    );
};

export { PerformanceReport };
export type { PerformanceReportProps };
