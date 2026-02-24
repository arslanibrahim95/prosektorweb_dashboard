"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tab } from "./types";

interface AccessibleTabsProps {
    tabs: Tab[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
}

const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
    tabs,
    defaultTab,
    onChange,
}) => {
    const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);
    const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        onChange?.(tabId);
    };

    const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
        let nextIndex = currentIndex;

        switch (e.key) {
            case "ArrowRight":
                nextIndex = (currentIndex + 1) % tabs.length;
                break;
            case "ArrowLeft":
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            case "Home":
                nextIndex = 0;
                break;
            case "End":
                nextIndex = tabs.length - 1;
                break;
            default:
                return;
        }

        e.preventDefault();
        const nextTab = tabs[nextIndex];
        if (nextTab && !nextTab.disabled) {
            handleTabChange(nextTab.id);
            tabRefs.current.get(nextTab.id)?.focus();
        }
    };

    return (
        <div className="w-full">
            <div
                role="tablist"
                aria-label="Navigation tabs"
                className="flex border-b border-border"
            >
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        ref={(el) => {
                            if (el) tabRefs.current.set(tab.id, el);
                        }}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-disabled={tab.disabled}
                        aria-controls={`tabpanel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        onClick={() => !tab.disabled && handleTabChange(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        disabled={tab.disabled}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors",
                            "border-b-2 border-transparent -mb-px",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            activeTab === tab.id
                                ? "border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground",
                            tab.disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    role="tabpanel"
                    id={`tabpanel-${tab.id}`}
                    aria-labelledby={`tab-${tab.id}`}
                    hidden={activeTab !== tab.id}
                    tabIndex={0}
                    className="p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    {activeTab === tab.id && tab.content}
                </div>
            ))}
        </div>
    );
};

export { AccessibleTabs };
export type { AccessibleTabsProps };
