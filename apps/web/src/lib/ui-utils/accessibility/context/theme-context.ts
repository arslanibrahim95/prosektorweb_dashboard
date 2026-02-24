"use client";

import * as React from "react";
import type { ThemeState, ThemeDispatch } from "../types";

export const ThemeStateContext = React.createContext<ThemeState | undefined>(undefined);
export const ThemeDispatchContext = React.createContext<ThemeDispatch | undefined>(undefined);
