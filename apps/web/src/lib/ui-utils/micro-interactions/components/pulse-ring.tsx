"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PulseRingProps extends React.HTMLAttributes<HTMLDivElement> {
    color?: string;
    size?: number;
    ringCount?: number;
}

const PulseRing = React.forwardRef<HTMLDivElement, PulseRingProps>(
    (
        { className, color = "var(--primary)", size = 12, ringCount = 3, children, ...props },
        ref
    ) => (
        <div ref={ref} className={cn("relative inline-flex", className)} {...props}>
            {children}
            {Array.from({ length: ringCount }).map((_, i) => (
                <span
                    key={i}
                    className="absolute inline-flex h-full w-full rounded-full animate-ping"
                    style={{
                        backgroundColor: color,
                        animationDelay: `${i * 0.4}s`,
                        animationDuration: "2s",
                    }}
                    aria-hidden="true"
                />
            ))}
            <span
                className="relative inline-flex rounded-full"
                style={{
                    width: size,
                    height: size,
                    backgroundColor: color,
                }}
            />
        </div>
    )
);
PulseRing.displayName = "PulseRing";

export { PulseRing };
export type { PulseRingProps };
