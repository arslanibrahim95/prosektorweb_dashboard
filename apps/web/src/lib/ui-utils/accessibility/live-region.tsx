"use client";

import * as React from "react";
import type { LiveRegionPoliteness } from "./types";

interface LiveRegionProps {
    id: string;
    politeness?: LiveRegionPoliteness;
    children?: React.ReactNode;
}

const LiveRegion: React.FC<LiveRegionProps> = ({
    id,
    politeness = "polite",
    children,
}) => (
    <div
        id={id}
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        className="sr-only"
    >
        {children}
    </div>
);

const useAnnouncer = (regionId: string) => {
    const announce = React.useCallback(
        (message: string, politeness: LiveRegionPoliteness = "polite") => {
            const region = document.getElementById(regionId);
            if (region) {
                region.setAttribute("aria-live", politeness);
                region.textContent = message;
                setTimeout(() => {
                    region.textContent = "";
                }, 1000);
            }
        },
        [regionId]
    );

    return { announce };
};

export { LiveRegion, useAnnouncer };
export type { LiveRegionProps };
