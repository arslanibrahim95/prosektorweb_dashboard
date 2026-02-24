"use client";

import * as React from "react";

interface AccessibilityBadgeProps {
    wcagLevel?: "A" | "AA" | "AAA";
    features?: string[];
}

const AccessibilityBadge: React.FC<AccessibilityBadgeProps> = ({
    wcagLevel = "AA",
    features = [],
}) => (
    <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium"
        role="status"
        aria-label={`Accessibility compliant: WCAG ${wcagLevel}`}
    >
        <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
        <span>WCAG {wcagLevel}</span>
        {features.length > 0 && (
            <span className="sr-only">Supported features: {features.join(", ")}</span>
        )}
    </div>
);

export { AccessibilityBadge };
export type { AccessibilityBadgeProps };
