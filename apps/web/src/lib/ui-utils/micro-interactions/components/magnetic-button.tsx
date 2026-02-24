"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "../hooks";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    strength?: number;
    radius?: number;
    respectReducedMotion?: boolean;
}

const MagneticButton = React.forwardRef<
    HTMLButtonElement,
    MagneticButtonProps
>(
    (
        {
            className,
            strength = 0.3,
            radius = 100,
            respectReducedMotion = true,
            children,
            ...props
        },
        ref
    ) => {
        const buttonRef = React.useRef<HTMLButtonElement>(null);
        const [position, setPosition] = React.useState({ x: 0, y: 0 });
        const frameRef = React.useRef<number | null>(null);
        const prefersReducedMotion = usePrefersReducedMotion();

        React.useImperativeHandle(ref, () => buttonRef.current!, []);

        React.useEffect(() => {
            return () => {
                if (frameRef.current) {
                    cancelAnimationFrame(frameRef.current);
                }
            };
        }, []);

        const handleMouseMove = React.useCallback(
            (e: React.MouseEvent) => {
                if (!buttonRef.current || (respectReducedMotion && prefersReducedMotion)) return;

                const rect = buttonRef.current.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const distanceX = e.clientX - centerX;
                const distanceY = e.clientY - centerY;
                const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

                if (distance < radius) {
                    if (frameRef.current) {
                        cancelAnimationFrame(frameRef.current);
                    }

                    frameRef.current = requestAnimationFrame(() => {
                        setPosition({
                            x: distanceX * strength,
                            y: distanceY * strength,
                        });
                    });
                }
            },
            [strength, radius, respectReducedMotion, prefersReducedMotion]
        );

        const handleMouseLeave = React.useCallback(() => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            setPosition({ x: 0, y: 0 });
        }, []);

        return (
            <button
                ref={buttonRef}
                className={cn(
                    "magnetic-button relative transition-transform duration-200",
                    "ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    className
                )}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                }}
                {...props}
            >
                {children}
            </button>
        );
    }
);
MagneticButton.displayName = "MagneticButton";

export { MagneticButton };
export type { MagneticButtonProps };
