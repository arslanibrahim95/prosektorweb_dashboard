"use client";

/**
 * AI-Accessibility Types
 */

export type Theme = "light" | "dark" | "system";
export type Density = "compact" | "comfortable" | "spacious";
export type MotionPreference = "full" | "reduced" | "none";
export type ColorScheme = "default" | "high-contrast" | "ai-assist";
export type LiveRegionPoliteness = "polite" | "assertive" | "off";

export interface ThemeState {
    theme: Theme;
    density: Density;
    motionPreference: MotionPreference;
    colorScheme: ColorScheme;
}

export interface ThemeDispatch {
    setTheme: (theme: Theme) => void;
    setDensity: (density: Density) => void;
    setMotionPreference: (pref: MotionPreference) => void;
    setColorScheme: (scheme: ColorScheme) => void;
}

export interface Tab {
    id: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
}
