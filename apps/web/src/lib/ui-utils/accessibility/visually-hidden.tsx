"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const VisuallyHidden: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
    children,
    className,
    ...props
}) => (
    <span
        className={cn(
            "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
            className
        )}
        style={{
            clip: "rect(0, 0, 0, 0)",
            clipPath: "inset(50%)",
        }}
        {...props}
    >
        {children}
    </span>
);

export { VisuallyHidden };
