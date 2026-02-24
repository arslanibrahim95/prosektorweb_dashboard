"use client";

import * as React from "react";

interface DeferredProps {
    children: React.ReactNode;
    delay?: number;
    fallback?: React.ReactNode;
}

const Deferred: React.FC<DeferredProps> = ({
    children,
    delay = 0,
    fallback,
}) => {
    const [shouldRender, setShouldRender] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if ("requestIdleCallback" in window) {
                window.requestIdleCallback(() => setShouldRender(true));
            } else {
                setShouldRender(true);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    if (!shouldRender) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export { Deferred };
export type { DeferredProps };
