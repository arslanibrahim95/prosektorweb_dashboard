'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to warn users about unsaved changes before navigating away.
 * Handles both browser-level (beforeunload) and in-app (popstate) navigation.
 *
 * Usage:
 * ```tsx
 * const { markDirty, markClean } = useUnsavedChanges(isDirty);
 * ```
 */
export function useUnsavedChanges(
  isDirty: boolean,
  message = 'Kaydedilmemiş değişiklikler var. Sayfadan ayrılmak istiyor musunuz?'
) {
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Browser beforeunload (handles tab close, hard refresh, URL bar nav)
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show their own message, but returnValue is still needed
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  // Browser back/forward button (popstate)
  useEffect(() => {
    if (!isDirty) return;

    const handlePopState = () => {
      if (isDirtyRef.current) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Push initial state so we can intercept back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty, message]);

  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
  }, []);

  const markClean = useCallback(() => {
    isDirtyRef.current = false;
  }, []);

  /**
   * Call before programmatic navigation (e.g., sidebar link click).
   * Returns true if navigation should proceed.
   */
  const confirmNavigation = useCallback(() => {
    if (!isDirtyRef.current) return true;
    return window.confirm(message);
  }, [message]);

  return { markDirty, markClean, confirmNavigation, isDirty };
}
