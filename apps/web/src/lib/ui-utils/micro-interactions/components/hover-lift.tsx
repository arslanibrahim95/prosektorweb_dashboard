"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "../hooks";

interface HoverLiftProps extends React.HTMLAttributes<HTMLDivElement> {
    lift?: number;
    shadow?: boolean;
    respectReducedMotion?: boolean;
}

const HoverLift = React.forwardRef<HTMLDivElement, HoverLiftProps>(
    (
        { className, lift = 4, shadow = true, respectReducedMotion = true, children, ...props },
        ref
    ) => {
        const prefersReducedMotion = usePrefersReducedMotion();
        const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

        return (
            <div
                ref={ref}
                className={cn(
                    "transition-all duration-300",
                    "ease-[cubic-bezier(0.16,1,0.3,1)]",
                    shadow && "hover:shadow-xl",
                    className
                )}
                style={{
                    transform: "translateY(0)",
                }}
                onMouseEnter={
                    shouldAnimate
                        ? (e) => {
                            (e.currentTarget as HTMLElement).style.transform = `translateY(-${lift}px)`;
                        }
                        : undefined
                }
                onMouseLeave={
                    shouldAnimate
                        ? (e) => {
                            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        }
                        : undefined
                }
                {...props}
            >
                {children}
            </div>
        );
    }
);
HoverLift.displayName = "HoverLift";

export { HoverLift };
export type { HoverLiftProps };
