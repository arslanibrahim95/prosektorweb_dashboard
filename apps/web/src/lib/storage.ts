import { logger } from "@/lib/logger";

/**
 * Safe LocalStorage Utilities
 * 
 * SECURITY: Provides error handling for localStorage operations
 * Prevents crashes in Safari private mode and when quota is exceeded
 */

/**
 * Safely gets an item from localStorage
 * Returns null if localStorage is unavailable or key doesn't exist
 */
export function safeLocalStorageGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch (err) {
    // Handle Safari private mode, quota exceeded, and other errors
    logger.warn(`[LocalStorage] Failed to get item`, { key, error: err });
    return null;
  }
}

/**
 * Safely sets an item in localStorage
 * Returns true if successful, false otherwise
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    // Handle quota exceeded, private mode, and other errors
    logger.warn(`[LocalStorage] Failed to set item`, { key, error: err });
    return false;
  }
}

/**
 * Safely removes an item from localStorage
 * Returns true if successful, false otherwise
 */
export function safeLocalStorageRemoveItem(key: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    logger.warn(`[LocalStorage] Failed to remove item`, { key, error: err });
    return false;
  }
}

/**
 * Defers a function to run during browser idle time
 * Uses requestIdleCallback with setTimeout fallback
 */
export function deferToIdle(callback: () => void, timeout = 1000): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 0);
  }
}
