"use client";

import * as React from "react";
import { logger } from "@/lib/logger";
import type { Theme, Density, MotionPreference, ColorScheme, ThemeState } from "../types";
import { safeStorageSet, safeStorageGet } from "../storage";
import { ThemeStateContext, ThemeDispatchContext } from "./theme-context";

interface SmartThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    defaultDensity?: Density;
    enableSystem?: boolean;
    storageKey?: string;
    onError?: (error: Error) => void;
}

const SmartThemeProvider: React.FC<SmartThemeProviderProps> = ({
    children,
    defaultTheme = "system",
    defaultDensity = "comfortable",
    enableSystem = true,
    storageKey = "prosektorweb-theme",
    onError,
}) => {
    const [state, setState] = React.useState<ThemeState>(() => {
        if (typeof window === "undefined") {
            return {
                theme: defaultTheme,
                density: defaultDensity,
                motionPreference: "full",
                colorScheme: "default",
            };
        }

        const storedTheme = safeStorageGet(`${storageKey}-mode`) as Theme | null;
        const storedDensity = safeStorageGet(`${storageKey}-density`) as Density | null;
        const storedMotion = safeStorageGet(`${storageKey}-motion`) as MotionPreference | null;
        const storedScheme = safeStorageGet(`${storageKey}-scheme`) as ColorScheme | null;

        let motionPref: MotionPreference = storedMotion || "full";
        if (!storedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            motionPref = "reduced";
        }

        return {
            theme: storedTheme || defaultTheme,
            density: storedDensity || defaultDensity,
            motionPreference: motionPref,
            colorScheme: storedScheme || "default",
        };
    });

    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (state.theme === "system" && enableSystem) {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(state.theme);
        }

        root.setAttribute("data-density", state.density);
        root.setAttribute("data-motion", state.motionPreference);
        root.setAttribute("data-color-scheme", state.colorScheme);
    }, [state.theme, state.density, state.motionPreference, state.colorScheme, enableSystem]);

    React.useEffect(() => {
        if (!enableSystem || typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            if (state.theme === "system") {
                const root = window.document.documentElement;
                root.classList.remove("light", "dark");
                root.classList.add(mediaQuery.matches ? "dark" : "light");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [state.theme, enableSystem]);

    const dispatch = React.useMemo(
        () => ({
            setTheme: (newTheme: Theme) => {
                try {
                    safeStorageSet(`${storageKey}-mode`, newTheme);
                    setState((prev) => ({ ...prev, theme: newTheme }));
                } catch (e) {
                    const error = e instanceof Error ? e : new Error("Failed to set theme");
                    setError(error);
                    onError?.(error);
                    setState((prev) => ({ ...prev, theme: newTheme }));
                }
            },

            setDensity: (newDensity: Density) => {
                try {
                    safeStorageSet(`${storageKey}-density`, newDensity);
                    setState((prev) => ({ ...prev, density: newDensity }));
                } catch (e) {
                    const error = e instanceof Error ? e : new Error("Failed to set density");
                    setError(error);
                    onError?.(error);
                    setState((prev) => ({ ...prev, density: newDensity }));
                }
            },

            setMotionPreference: (pref: MotionPreference) => {
                try {
                    safeStorageSet(`${storageKey}-motion`, pref);
                    setState((prev) => ({ ...prev, motionPreference: pref }));
                } catch (e) {
                    const error = e instanceof Error ? e : new Error("Failed to set motion preference");
                    setError(error);
                    onError?.(error);
                    setState((prev) => ({ ...prev, motionPreference: pref }));
                }
            },

            setColorScheme: (scheme: ColorScheme) => {
                try {
                    safeStorageSet(`${storageKey}-scheme`, scheme);
                    setState((prev) => ({ ...prev, colorScheme: scheme }));
                } catch (e) {
                    const error = e instanceof Error ? e : new Error("Failed to set color scheme");
                    setError(error);
                    onError?.(error);
                    setState((prev) => ({ ...prev, colorScheme: scheme }));
                }
            },
        }),
        [storageKey, onError]
    );

    if (error) {
        logger.error("SmartThemeProvider error", { error });
    }

    return (
        <ThemeStateContext.Provider value={state}>
            <ThemeDispatchContext.Provider value={dispatch}>
                {children}
            </ThemeDispatchContext.Provider>
        </ThemeStateContext.Provider>
    );
};

export { SmartThemeProvider };
export type { SmartThemeProviderProps };
