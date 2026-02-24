"use client";

import * as React from "react";
import { logger } from "@/lib/logger";

interface ResourceHintProps {
    href: string;
    as?: "script" | "style" | "font" | "image" | "fetch";
    type?: "preload" | "prefetch" | "preconnect" | "dns-prefetch";
    crossOrigin?: "anonymous" | "use-credentials";
}

const ResourceHint: React.FC<ResourceHintProps> = ({
    href,
    as,
    type = "prefetch",
    crossOrigin,
}) => {
    React.useEffect(() => {
        const link = document.createElement("link");
        link.rel = type;
        link.href = href;
        if (as) link.as = as;
        if (crossOrigin) link.crossOrigin = crossOrigin;

        try {
            document.head.appendChild(link);
        } catch (e) {
            logger.warn("Failed to add resource hint", { href, as, type, error: e });
        }

        return () => {
            try {
                document.head.removeChild(link);
            } catch {
                // Link might already be removed
            }
        };
    }, [href, as, type, crossOrigin]);

    return null;
};

export { ResourceHint };
export type { ResourceHintProps };
