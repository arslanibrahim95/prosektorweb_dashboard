"use client";

import * as React from "react";
import type { ThemeState, ThemeDispatch } from "../types";
import { ThemeStateContext, ThemeDispatchContext } from "../context/theme-context";

export const useThemeState = (): ThemeState => {
    const context = React.useContext(ThemeStateContext);
    if (!context) {
        throw new Error("useThemeState must be used within SmartThemeProvider");
    }
    return context;
};

export const useThemeDispatch = (): ThemeDispatch => {
    const context = React.useContext(ThemeDispatchContext);
    if (!context) {
        throw new Error("useThemeDispatch must be used within SmartThemeProvider");
    }
    return context;
};

// Combined hook for convenience
export const useSmartTheme = (): ThemeState & ThemeDispatch => {
    const state = useThemeState();
    const dispatch = useThemeDispatch();
    return { ...state, ...dispatch };
};
