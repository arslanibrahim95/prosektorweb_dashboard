"use client";

import * as React from "react";
import { logger } from "@/lib/logger";
import type { EventTimingEntry } from "../types";

/**
 * Hook for tracking Interaction to Next Paint (INP) metric
 */
export const useINPTracker = () => {
    const [inp, setInp] = React.useState<number | null>(null);
    const interactionsRef = React.useRef<number[]>([]);
    const observerRef = React.useRef<PerformanceObserver | null>(null);

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        let longestInteraction = 0;

        try {
            observerRef.current = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const timingEntry = entry as EventTimingEntry;
                    interactionsRef.current.push(timingEntry.duration);

                    // Keep only recent interactions (last 50)
                    if (interactionsRef.current.length > 50) {
                        interactionsRef.current.shift();
                    }

                    // Calculate 98th percentile (INP approximation)
                    const sorted = [...interactionsRef.current].sort((a, b) => a - b);
                    const index = Math.floor(sorted.length * 0.98);
                    const inpValue = sorted[index] || 0;

                    if (inpValue > longestInteraction) {
                        longestInteraction = inpValue;
                        setInp(Math.round(inpValue));
                    }
                }
            });

            observerRef.current.observe({ type: "event", buffered: true });
        } catch {
            logger.warn("INP tracking not supported");
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, []);

    return inp;
};
