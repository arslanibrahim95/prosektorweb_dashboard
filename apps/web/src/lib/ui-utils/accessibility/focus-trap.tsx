"use client";

import * as React from "react";

interface FocusTrapProps {
    children: React.ReactNode;
    isActive: boolean;
    onEscape?: () => void;
}

const FOCUSABLE_SELECTORS = [
    'button:not([disabled]):not([aria-hidden="true"])',
    'a[href]:not([aria-hidden="true"])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
].join(", ");

const isVisible = (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
    return elements.filter(isVisible);
};

const FocusTrap: React.FC<FocusTrapProps> = ({
    children,
    isActive,
    onEscape,
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const previousFocus = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
        if (isActive) {
            previousFocus.current = document.activeElement as HTMLElement;

            const container = containerRef.current;
            if (container) {
                const focusableElements = getFocusableElements(container);
                const firstElement = focusableElements[0];
                firstElement?.focus();
            }
        } else {
            previousFocus.current?.focus();
        }
    }, [isActive]);

    React.useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onEscape?.();
                return;
            }

            if (e.key !== "Tab") return;

            const container = containerRef.current;
            if (!container) return;

            const focusableElements = getFocusableElements(container);

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isActive, onEscape]);

    if (!isActive) return <>{children}</>;

    return <div ref={containerRef}>{children}</div>;
};

export { FocusTrap, getFocusableElements, isVisible };
export type { FocusTrapProps };
