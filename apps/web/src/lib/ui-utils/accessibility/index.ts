/**
 * AI Personalization & Accessibility Components - Production Ready
 * 
 * @module ai-accessibility
 * @version 2.0.0
 */

// Types
export type {
    Theme,
    Density,
    MotionPreference,
    ColorScheme,
    ThemeState,
    ThemeDispatch,
    LiveRegionPoliteness,
    Tab,
} from './types';

// Storage
export { StorageError, safeStorageSet, safeStorageGet } from './storage';

// Context
export { ThemeStateContext, ThemeDispatchContext, SmartThemeProvider } from './context';
export type { SmartThemeProviderProps } from './context';

// Hooks
export { useThemeState, useThemeDispatch, useSmartTheme } from './hooks';

// Components
export { AccessibleButton, accessibleButtonVariants } from './accessible-button';
export type { AccessibleButtonProps } from './accessible-button';

export { SkipLink } from './skip-link';
export type { SkipLinkProps } from './skip-link';

export { LiveRegion, useAnnouncer } from './live-region';
export type { LiveRegionProps } from './live-region';

export { FocusTrap, getFocusableElements, isVisible } from './focus-trap';
export type { FocusTrapProps } from './focus-trap';

export { VisuallyHidden } from './visually-hidden';

export { AccessibleTabs } from './accessible-tabs';
export type { AccessibleTabsProps } from './accessible-tabs';

export { AIThemeToggle } from './ai-theme-toggle';
export type { AIThemeToggleProps } from './ai-theme-toggle';

export { AccessibilityBadge } from './accessibility-badge';
export type { AccessibilityBadgeProps } from './accessibility-badge';

export { ReducedMotion } from './reduced-motion';
export type { ReducedMotionProps } from './reduced-motion';
