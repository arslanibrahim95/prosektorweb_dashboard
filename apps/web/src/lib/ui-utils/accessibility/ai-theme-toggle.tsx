"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSmartTheme } from "./hooks";

interface AIThemeToggleProps {
    className?: string;
}

const AIThemeToggle: React.FC<AIThemeToggleProps> = ({ className }) => {
    const { theme, setTheme, density, setDensity, colorScheme, setColorScheme } =
        useSmartTheme();

    return (
        <div className={cn("space-y-4", className)}>
            <div className="space-y-2">
                <label className="text-sm font-medium">Theme Mode</label>
                <div className="flex gap-2">
                    {(["light", "dark", "system"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm capitalize transition-colors",
                                theme === t
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                            )}
                            aria-pressed={theme === t}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">UI Density</label>
                <div className="flex gap-2">
                    {(["compact", "comfortable", "spacious"] as const).map((d) => (
                        <button
                            key={d}
                            onClick={() => setDensity(d)}
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm capitalize transition-colors",
                                density === d
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                            )}
                            aria-pressed={density === d}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Color Scheme</label>
                <div className="flex gap-2">
                    {([
                        { value: "default", label: "Default" },
                        { value: "high-contrast", label: "High Contrast" },
                        { value: "ai-assist", label: "AI Assist" },
                    ] as const).map((scheme) => (
                        <button
                            key={scheme.value}
                            onClick={() => setColorScheme(scheme.value)}
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm transition-colors",
                                colorScheme === scheme.value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                            )}
                            aria-pressed={colorScheme === scheme.value}
                        >
                            {scheme.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export { AIThemeToggle };
export type { AIThemeToggleProps };
