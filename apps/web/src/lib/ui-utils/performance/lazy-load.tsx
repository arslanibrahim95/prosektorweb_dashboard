"use client";

import * as React from "react";

interface LazyLoadProps {
    children: React.ReactNode;
    placeholder?: React.ReactNode;
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
    onVisible?: () => void;
}

const LazyLoad: React.FC<LazyLoadProps> = ({
    children,
    placeholder,
    threshold = 0.1,
    rootMargin = "50px",
    triggerOnce = true,
    onVisible,
}) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const observerRef = React.useRef<IntersectionObserver | null>(null);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (!entry) return;
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    onVisible?.();
                    if (triggerOnce && observerRef.current) {
                        observerRef.current.disconnect();
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            {
                threshold,
                rootMargin,
            }
        );

        observerRef.current.observe(container);

        return () => {
            observerRef.current?.disconnect();
        };
    }, [threshold, rootMargin, triggerOnce, onVisible]);

    return (
        <div ref={containerRef} className="min-h-[1px]">
            {isVisible ? children : placeholder || <div className="animate-pulse bg-muted h-32 rounded-lg" />}
        </div>
    );
};

export { LazyLoad };
export type { LazyLoadProps };
