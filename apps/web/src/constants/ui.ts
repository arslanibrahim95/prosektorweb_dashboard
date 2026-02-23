/**
 * UI Constants
 * 
 * Magic numbers ve tekrar eden değerler için merkezi sabitler.
 * Bu dosya, frontend genelinde tutarlılık sağlar.
 * 
 * @example
 * import { BADGE_MAX_DISPLAY } from '@/constants/ui';
 */

// === Badge Constants ===
export const BADGE_MAX_DISPLAY = 99;
export const BADGE_OVERFLOW_TEXT = '99+';

// === Navigation Constants ===
export const NAV_ICON_SIZE = {
    default: 'h-5 w-5',
    mobile: 'h-5 w-5',
} as const;

export const NAV_FONT_SIZE = {
    label: 'text-[10px]',
    child: 'text-xs',
} as const;

// === Timing Constants (ms) ===
export const TRANSITION_DURATION = {
    fast: 150,
    normal: 200,
    slow: 300,
} as const;

// === Size Constants ===
export const MIN_TOUCH_SIZE = {
    icon: 'min-h-11 min-w-11',
    badge: 'min-w-4 h-4',
} as const;

// === Spacing Constants ===
export const NAV_PADDING = {
    x: 'px-3',
    y: 'py-1.5',
} as const;

// === Animation Constants ===
export const ACTIVE_SCALE = 'active:scale-95';

// === Navigation Item IDs (for consistent matching) ===
export const NAV_ITEM_IDS = {
    INBOX: 'inbox',
    HOME: 'home',
    SITE: 'site',
    MODULES: 'modules',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings',
} as const;

// === Dialog/Sheet Common Classes ===

export const DIALOG_OVERLAY_CLASS =
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 glass-strong !bg-black/55";

export const DIALOG_CLOSE_BUTTON_CLASS =
    "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none";

export const DIALOG_CONTENT_BASE_CLASS =
    "glass !bg-background/90 data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 gap-4 rounded-lg border p-6 shadow-lg outline-none";

export const DIALOG_HEADER_CLASS =
    "flex flex-col gap-2 text-center sm:text-left";

export const DIALOG_FOOTER_CLASS =
    "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end";

export const DIALOG_TITLE_CLASS =
    "text-lg leading-none font-semibold";

export const DIALOG_DESCRIPTION_CLASS =
    "text-muted-foreground text-sm";
