"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface VirtualScrollProps<T> {
    items: T[];
    itemHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    overscan?: number;
    className?: string;
    containerHeight?: number | string;
}

function VirtualScroll<T>({
    items,
    itemHeight,
    renderItem,
    overscan = 5,
    className,
    containerHeight = "400px",
}: VirtualScrollProps<T>) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = React.useState(0);
    const [containerHeightValue, setContainerHeightValue] = React.useState(0);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        setContainerHeightValue(container.clientHeight);

        const handleScroll = () => {
            setScrollTop(container.scrollTop);
        };

        const handleResize = () => {
            setContainerHeightValue(container.clientHeight);
        };

        container.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleResize);

        return () => {
            container.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeightValue) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    return (
        <div
            ref={containerRef}
            className={cn("overflow-auto", className)}
            style={{ height: containerHeight }}
        >
            <div style={{ height: totalHeight, position: "relative" }}>
                <div
                    style={{
                        position: "absolute",
                        top: offsetY,
                        left: 0,
                        right: 0,
                    }}
                >
                    {visibleItems.map((item, index) => (
                        <div key={startIndex + index} style={{ height: itemHeight }}>
                            {renderItem(item, startIndex + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export { VirtualScroll };
export type { VirtualScrollProps };
