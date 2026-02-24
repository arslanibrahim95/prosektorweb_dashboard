"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkipLinkProps {
    targetId: string;
    children?: React.ReactNode;
}

const SkipLink: React.FC<SkipLinkProps> = ({
    targetId,
    children = "Skip to main content",
}) => (
    <a
        href={`#${targetId}`}
        className={cn(
            "fixed top-4 left-4 z-[100]",
            "px-4 py-2 bg-primary text-primary-foreground",
            "rounded-md font-medium",
            "transform -translate-y-[150%]",
            "focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2",
            "transition-transform duration-200"
        )}
    >
        {children}
    </a>
);

export { SkipLink };
export type { SkipLinkProps };
