'use client';

import type { Session } from '@supabase/supabase-js';
import type {
  MeResponse,
  MeTenantSummary,
  SessionWarningState,
  TokenRefreshState,
} from '@prosektor/contracts';
import { meResponseSchema } from '@prosektor/contracts';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { api, setApiAccessTokenProvider, setApiContextHeadersProvider } from '@/server/api';
import {
  getRefreshService,
  type TokenRefreshService,
} from '@/lib/auth/token-refresh';
import { logger } from '@/lib/logger';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
const ACTIVE_TENANT_STORAGE_KEY = 'prosektor.active_tenant_id';

/**
 * Safely gets item from localStorage with error handling
 * SECURITY FIX: Handles Safari private mode, quota exceeded, and other localStorage errors
 */
function safeLocalStorageGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch (err) {
    // Common errors: quota exceeded, private mode, security restrictions
    logger.warn('[AuthProvider] Failed to read from localStorage', { error: err });
    return null;
  }
}

/**
 * Safely sets item in localStorage with error handling
 * SECURITY FIX: Handles quota exceeded and other localStorage errors
 */
function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    // Common errors: quota exceeded, private mode
    logger.warn('[AuthProvider] Failed to write to localStorage', { error: err });
    return false;
  }
}

/**
 * Safely removes item from localStorage with error handling
 */
function safeLocalStorageRemoveItem(key: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    logger.warn('[AuthProvider] Failed to remove from localStorage', { error: err });
    return false;
  }
}

/**
 * Defers persistence to idle time to prevent blocking main thread
 * PERFORMANCE FIX: Uses requestIdleCallback or setTimeout to avoid UI freezing
 */
function deferPersistence(fn: () => void): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(fn, { timeout: 1000 });
  } else {
    // Fallback to setTimeout with 0 delay
    setTimeout(fn, 0);
  }
}

export interface AuthContextValue {
  // Existing
  status: AuthStatus;
  session: Session | null;
  me: MeResponse | null;
  accessToken: string | null;
  refreshMe: () => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  envError?: string;

  // New - Session management
  timeUntilExpiry: number | null;
  sessionWarning: SessionWarningState;
  tokenRefreshState: TokenRefreshState;
  extendSession: () => Promise<void>;
  activeTenantId: string | null;
  availableTenants: MeTenantSummary[];
  switchTenant: (tenantId: string) => void;
  isSwitchingTenant: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function getAccessTokenSafely(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();

    // DEBUG: Log token durumunu
    if (process.env.NODE_ENV === 'development') {
      logger.info('[Auth] getAccessTokenSafely', {
        hasSession: !!data.session,
        hasToken: !!data.session?.access_token,
        error: error?.message,
      });
    }

    return data.session?.access_token ?? null;
  } catch (err) {
    logger.error('[Auth] getAccessTokenSafely error', { error: err });
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [envError] = useState<string | undefined>(() => {
    try {
      // Preflight: validate required env + create client.
      getSupabaseBrowserClient();
      return undefined;
    } catch (err) {
      return err instanceof Error ? err.message : 'Supabase env missing';
    }
  });

  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // New state
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);
  const [sessionWarning, setSessionWarning] = useState<SessionWarningState>({
    show: false,
    level: 'none',
    timeUntilExpiry: 0,
  });
  const [tokenRefreshState] = useState<TokenRefreshState>({
    isRefreshing: false,
    lastRefreshAttempt: 0,
    retryCount: 0,
  });
  const [activeTenantId, setActiveTenantId] = useState<string | null>(() => {
    // SECURITY FIX: Use safe localStorage accessor
    return safeLocalStorageGetItem(ACTIVE_TENANT_STORAGE_KEY);
  });
  const [isSwitchingTenant, setIsSwitchingTenant] = useState(false);

  const persistActiveTenantId = useCallback((tenantId: string | null) => {
    // PERFORMANCE FIX: Defer persistence to avoid blocking main thread
    deferPersistence(() => {
      if (tenantId) {
        safeLocalStorageSetItem(ACTIVE_TENANT_STORAGE_KEY, tenantId);
      } else {
        safeLocalStorageRemoveItem(ACTIVE_TENANT_STORAGE_KEY);
      }
    });
  }, []);

  const supabase = useMemo(() => {
    if (envError) return null;
    return getSupabaseBrowserClient();
  }, [envError]);

  const refreshService = useMemo<TokenRefreshService | null>(() => {
    if (envError) return null;
    return getRefreshService();
  }, [envError]);

  useEffect(() => {
    // Configure API client to attach current Supabase access token (Bearer) automatically.
    setApiAccessTokenProvider(getAccessTokenSafely);
  }, []);

  useEffect(() => {
    setApiContextHeadersProvider(() => {
      if (!activeTenantId) return null;
      return { 'X-Tenant-Id': activeTenantId };
    });
  }, [activeTenantId]);

  const refreshMe = useCallback(async () => {
    if (!supabase) return;

    const token = await getAccessTokenSafely();
    if (!token) {
      setMe(null);
      setStatus('unauthenticated');
      setIsSwitchingTenant(false);
      return;
    }

    try {
      const data = await api.get<MeResponse>('/me', undefined, meResponseSchema);
      setMe(data);
      setStatus('authenticated');

      const currentSelected = activeTenantId;
      const selectedIsValid = currentSelected
        ? data.available_tenants.some((tenant) => tenant.id === currentSelected)
        : false;

      if (!currentSelected || !selectedIsValid || data.active_tenant_id !== currentSelected) {
        setActiveTenantId(data.active_tenant_id);
        persistActiveTenantId(data.active_tenant_id);
      }
    } catch {
      // Could be 401 (not signed in) or 403 (no tenant membership yet).
      if (activeTenantId) {
        setActiveTenantId(null);
        persistActiveTenantId(null);
      }
      setMe(null);
      setStatus('authenticated');
    } finally {
      setIsSwitchingTenant(false);
    }
  }, [activeTenantId, persistActiveTenantId, supabase]);

  const switchTenant = useCallback(
    (tenantId: string) => {
      if (!tenantId || tenantId === activeTenantId) return;
      setIsSwitchingTenant(true);
      setActiveTenantId(tenantId);
      persistActiveTenantId(tenantId);
    },
    [activeTenantId, persistActiveTenantId],
  );

  // Extend session - manually trigger token refresh
  const extendSession = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        // Update time until expiry
        const expiresAt = data.session.expires_at;
        if (expiresAt) {
          const remaining = expiresAt * 1000 - Date.now();
          setTimeUntilExpiry(remaining > 0 ? remaining : 0);
        }
      }
    } catch (err) {
      logger.error('Failed to extend session', { error: err });
    }
  }, [supabase]);

  // Force logout
  const forceLogout = useCallback(async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setSession(null);
    setMe(null);
    setStatus('unauthenticated');
    setActiveTenantId(null);
    persistActiveTenantId(null);
    setTimeUntilExpiry(null);
    setSessionWarning({ show: false, level: 'none', timeUntilExpiry: 0 });
    setIsSwitchingTenant(false);

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=session_expired';
    }
  }, [persistActiveTenantId, supabase]);

  useEffect(() => {
    if (!supabase) {
      setStatus('unauthenticated');
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setStatus(data.session ? 'authenticated' : 'unauthenticated');

      // Initialize refresh service
      if (data.session && refreshService) {
        refreshService.startAutoRefresh(data.session);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_evt, nextSession) => {
        setSession(nextSession);
        setMe(null);
        setStatus(nextSession ? 'authenticated' : 'unauthenticated');
        if (!nextSession) {
          setActiveTenantId(null);
          persistActiveTenantId(null);
          setIsSwitchingTenant(false);
        }

        // Update refresh service
        if (refreshService) {
          if (nextSession) {
            refreshService.startAutoRefresh(nextSession);
          } else {
            refreshService.stopAutoRefresh();
          }
        }
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      if (refreshService) {
        refreshService.stopAutoRefresh();
      }
    };
  }, [persistActiveTenantId, refreshService, supabase]);

  // Refresh /api/me whenever session changes.
  useEffect(() => {
    if (!supabase) return;
    if (!session) {
      setMe(null);
      setIsSwitchingTenant(false);
      return;
    }
    void refreshMe();
  }, [activeTenantId, refreshMe, session, supabase]);

  // Update time until expiry periodically
  useEffect(() => {
    if (!session?.expires_at) {
      setTimeUntilExpiry(null);
      return;
    }

    const expiresAt = session.expires_at * 1000;

    const updateTime = () => {
      const now = Date.now();
      const remaining = expiresAt - now;
      setTimeUntilExpiry(remaining > 0 ? remaining : 0);

      // Update session warning
      if (refreshService) {
        const warning = refreshService.getSessionWarning(session);
        setSessionWarning(warning);

        // Force logout if expired
        if (remaining <= 0) {
          void forceLogout();
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [session, refreshService, forceLogout]);

  const accessToken = session?.access_token ?? null;

  const value: AuthContextValue = {
    status,
    session,
    me,
    accessToken,
    refreshMe,
    signInWithPassword: async (email: string, password: string) => {
      if (!supabase)
        return { ok: false, message: envError ?? 'Supabase client not configured' };

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true };
    },
    signOut: async () => {
      if (!supabase) return;
      await supabase.auth.signOut();
      setSession(null);
      setMe(null);
      setStatus('unauthenticated');
      setActiveTenantId(null);
      persistActiveTenantId(null);
      setTimeUntilExpiry(null);
      setSessionWarning({ show: false, level: 'none', timeUntilExpiry: 0 });
      setIsSwitchingTenant(false);

      // Stop refresh service
      if (refreshService) {
        refreshService.stopAutoRefresh();
      }
    },
    envError,
    timeUntilExpiry,
    sessionWarning,
    tokenRefreshState,
    extendSession,
    activeTenantId: me?.active_tenant_id ?? activeTenantId,
    availableTenants: me?.available_tenants ?? [],
    switchTenant,
    isSwitchingTenant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
