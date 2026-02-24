"use client";

import * as React from "react";
import { usePrefersReducedMotion } from "../micro-interactions/hooks";

interface ReducedMotionProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const ReducedMotion: React.FC<ReducedMotionProps> = ({
    children,
    fallback,
}) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion && fallback) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export { ReducedMotion };
export type { ReducedMotionProps };
