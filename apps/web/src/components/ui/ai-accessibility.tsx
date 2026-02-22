"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./micro-interactions";
import { logger } from "@/lib/logger";

/**
 * AI Personalization & Accessibility Components - Production Ready
 * 
 * Features:
 * - Error boundary compatible
 * - localStorage quota handling
 * - Split context for performance
 * - Full error handling
 * - WCAG 2.2 AA compliant
 * 
 * @module ai-accessibility
 * @version 2.0.0
 */

// =============================================================================
// TYPES
// =============================================================================

type Theme = "light" | "dark" | "system";
type Density = "compact" | "comfortable" | "spacious";
type MotionPreference = "full" | "reduced" | "none";
type ColorScheme = "default" | "high-contrast" | "ai-assist";

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

class StorageError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "StorageError";
  }
}

/**
 * Safely sets item in localStorage with quota handling
 */
const safeStorageSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
        if (e instanceof DOMException) {
            if (e.name === "QuotaExceededError") {
                // Try to clear old items
                logger.warn(`localStorage quota exceeded for key`, { key });
        
        // Remove old theme-related items
        const keysToRemove = Object.keys(localStorage).filter(
          (k) => k.includes("theme") && !k.includes(key)
        );
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        
        // Try again
        try {
          localStorage.setItem(key, value);
        } catch {
          throw new StorageError("Failed to save preference: Storage full", "QUOTA_EXCEEDED");
        }
      } else if (e.name === "SecurityError") {
        throw new StorageError("Storage access denied", "SECURITY_ERROR");
      }
        }
        throw new StorageError("Failed to save preference", "UNKNOWN_ERROR");
    }
};

/**
 * Safely gets item from localStorage
 */
const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
    } catch (e) {
        logger.warn(`Failed to read from localStorage`, { key, error: e });
        return null;
    }
};

// =============================================================================
// STATE CONTEXT (Read-only, minimal re-renders)
// =============================================================================

interface ThemeState {
  theme: Theme;
  density: Density;
  motionPreference: MotionPreference;
  colorScheme: ColorScheme;
}

const ThemeStateContext = React.createContext<ThemeState | undefined>(undefined);

// =============================================================================
// DISPATCH CONTEXT (Actions only, never causes re-render)
// =============================================================================

interface ThemeDispatch {
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  setMotionPreference: (pref: MotionPreference) => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeDispatchContext = React.createContext<ThemeDispatch | undefined>(undefined);

// =============================================================================
// HOOKS
// =============================================================================

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

// =============================================================================
// PROVIDER
// =============================================================================

interface SmartThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultDensity?: Density;
  enableSystem?: boolean;
  storageKey?: string;
  onError?: (error: Error) => void;
}

export const SmartThemeProvider: React.FC<SmartThemeProviderProps> = ({
  children,
  defaultTheme = "system",
  defaultDensity = "comfortable",
  enableSystem = true,
  storageKey = "prosektorweb-theme",
  onError,
}) => {
  // State
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

    // Check system preference for motion
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

  // Apply theme to document
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

  // Listen to system theme changes
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

  // Dispatch actions with error handling
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
          // Still update state even if storage fails
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

  // Error fallback
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

// =============================================================================
// ACCESSIBLE BUTTON
// =============================================================================

const accessibleButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-lg font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-busy:cursor-wait",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
          "focus-visible:ring-primary",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
          "focus-visible:ring-secondary",
        ],
        ghost: [
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:ring-accent",
        ],
        outline: [
          "border border-input bg-background",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:ring-accent",
        ],
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90",
          "focus-visible:ring-destructive",
        ],
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accessibleButtonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  description?: string;
}

export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      loadingText,
      leftIcon,
      rightIcon,
      description,
      children,
      disabled,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const descriptionId = React.useId();
    const hasDescription = !!description;

    return (
      <>
        <button
          ref={ref}
          className={cn(accessibleButtonVariants({ variant, size, className }))}
          disabled={disabled || isLoading}
          aria-label={ariaLabel}
          aria-describedby={hasDescription ? descriptionId : ariaDescribedBy}
          aria-busy={isLoading}
          aria-disabled={disabled || isLoading}
          {...props}
        >
          {isLoading ? (
            <>
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
              <span className="sr-only">{loadingText || "Loading"}</span>
              {loadingText || children}
            </>
          ) : (
            <>
              {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
              {children}
              {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
            </>
          )}
        </button>
        {hasDescription && (
          <span id={descriptionId} className="sr-only">
            {description}
          </span>
        )}
      </>
    );
  }
);
AccessibleButton.displayName = "AccessibleButton";

// =============================================================================
// SKIP LINK
// =============================================================================

interface SkipLinkProps {
  targetId: string;
  children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  children = "Skip to main content",
}) => (
  <a
    href={`#${targetId}`}
    className={cn(
      "fixed top-4 left-4 z-[100]",
      "px-4 py-2 bg-primary text-primary-foreground",
      "rounded-md font-medium",
      "transform -translate-y-[150%]",
      "focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2",
      "transition-transform duration-200"
    )}
  >
    {children}
  </a>
);

// =============================================================================
// LIVE REGION
// =============================================================================

type LiveRegionPoliteness = "polite" | "assertive" | "off";

interface LiveRegionProps {
  id: string;
  politeness?: LiveRegionPoliteness;
  children?: React.ReactNode;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
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

export const useAnnouncer = (regionId: string) => {
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

// =============================================================================
// FOCUS TRAP - FIXED: Better element selection
// =============================================================================

interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  onEscape?: () => void;
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled]):not([aria-hidden="true"])',
  'a[href]:not([aria-hidden="true"])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
].join(", ");

const isVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
  return elements.filter(isVisible);
};

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive,
  onEscape,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousFocus = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (isActive) {
      previousFocus.current = document.activeElement as HTMLElement;

      const container = containerRef.current;
      if (container) {
        const focusableElements = getFocusableElements(container);
        const firstElement = focusableElements[0];
        firstElement?.focus();
      }
    } else {
      previousFocus.current?.focus();
    }
  }, [isActive]);

  React.useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }

      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusableElements = getFocusableElements(container);

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onEscape]);

  if (!isActive) return <>{children}</>;

  return <div ref={containerRef}>{children}</div>;
};

// =============================================================================
// VISUALLY HIDDEN
// =============================================================================

export const VisuallyHidden: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  children,
  className,
  ...props
}) => (
  <span
    className={cn(
      "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
      className
    )}
    style={{
      clip: "rect(0, 0, 0, 0)",
      clipPath: "inset(50%)",
    }}
    {...props}
  >
    {children}
  </span>
);

// =============================================================================
// ACCESSIBLE TABS
// =============================================================================

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccessibleTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
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

// =============================================================================
// AI THEME TOGGLE
// =============================================================================

interface AIThemeToggleProps {
  className?: string;
}

export const AIThemeToggle: React.FC<AIThemeToggleProps> = ({ className }) => {
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

// =============================================================================
// ACCESSIBILITY BADGE
// =============================================================================

interface AccessibilityBadgeProps {
  wcagLevel?: "A" | "AA" | "AAA";
  features?: string[];
}

export const AccessibilityBadge: React.FC<AccessibilityBadgeProps> = ({
  wcagLevel = "AA",
  features = [],
}) => (
  <div
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium"
    role="status"
    aria-label={`Accessibility compliant: WCAG ${wcagLevel}`}
  >
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>WCAG {wcagLevel}</span>
    {features.length > 0 && (
      <span className="sr-only">Supported features: {features.join(", ")}</span>
    )}
  </div>
);

// =============================================================================
// REDUCED MOTION WRAPPER
// =============================================================================

interface ReducedMotionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ReducedMotion: React.FC<ReducedMotionProps> = ({
  children,
  fallback,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ThemeStateContext,
  ThemeDispatchContext,
  accessibleButtonVariants,
  safeStorageSet,
  safeStorageGet,
  StorageError,
  getFocusableElements,
  isVisible,
};

export type {
  Theme,
  Density,
  MotionPreference,
  ColorScheme,
  ThemeState,
  ThemeDispatch,
  SmartThemeProviderProps,
  AccessibleButtonProps,
  SkipLinkProps,
  LiveRegionPoliteness,
  LiveRegionProps,
  FocusTrapProps,
  Tab,
  AccessibleTabsProps,
  AIThemeToggleProps,
  AccessibilityBadgeProps,
  ReducedMotionProps,
};
