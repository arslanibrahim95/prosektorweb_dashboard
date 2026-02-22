'use client';

import type { Site } from '@prosektor/contracts';
import { listSitesResponseSchema } from '@prosektor/contracts';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/server/api';
import { useAuth } from '@/components/auth/auth-provider';
import { safeLocalStorageGetItem, safeLocalStorageSetItem, safeLocalStorageRemoveItem } from '@/lib/storage';

export interface SiteContextValue {
  sites: Site[];
  currentSiteId: string | null;
  setCurrentSiteId: (id: string) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | null>(null);
const CURRENT_SITE_STORAGE_PREFIX = 'prosektor.current_site.';

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const activeTenantId = auth.me?.active_tenant_id ?? auth.activeTenantId;
  const [sites, setSites] = useState<Site[]>([]);
  const [currentSiteIdState, setCurrentSiteIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getStoredSiteId = useCallback((tenantId: string | null): string | null => {
    if (!tenantId) return null;
    return safeLocalStorageGetItem(`${CURRENT_SITE_STORAGE_PREFIX}${tenantId}`);
  }, []);

  const persistSiteId = useCallback((tenantId: string | null, siteId: string | null) => {
    if (!tenantId) return;
    const storageKey = `${CURRENT_SITE_STORAGE_PREFIX}${tenantId}`;
    if (siteId) {
      safeLocalStorageSetItem(storageKey, siteId);
      return;
    }
    safeLocalStorageRemoveItem(storageKey);
  }, []);

  const setCurrentSiteId = useCallback((id: string) => {
    setCurrentSiteIdState(id);
    persistSiteId(activeTenantId, id);
  }, [activeTenantId, persistSiteId]);

  const refresh = useCallback(async () => {
    if (!auth.session || !activeTenantId) return;
    setIsLoading(true);
    try {
      const response = await api.get('/sites', undefined, listSitesResponseSchema);
      setSites(response.items);
      setCurrentSiteIdState((prev) => {
        if (!response.items.length) return null;
        const storedSiteId = getStoredSiteId(activeTenantId);
        if (storedSiteId && response.items.some((site) => site.id === storedSiteId)) {
          return storedSiteId;
        }
        if (prev && response.items.some((site) => site.id === prev)) return prev;
        const firstSite = response.items[0];
        return firstSite?.id ?? null;
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTenantId, auth.session, getStoredSiteId]);

  useEffect(() => {
    if (!auth.session || !activeTenantId) {
      setSites([]);
      setCurrentSiteIdState(null);
      return;
    }
    void refresh();
  }, [activeTenantId, auth.session, refresh]);

  useEffect(() => {
    if (!activeTenantId || !currentSiteIdState) return;
    if (!sites.some((site) => site.id === currentSiteIdState)) return;
    persistSiteId(activeTenantId, currentSiteIdState);
  }, [activeTenantId, currentSiteIdState, persistSiteId, sites]);

  const value: SiteContextValue = useMemo(
    () => ({
      sites,
      currentSiteId: currentSiteIdState,
      setCurrentSiteId,
      isLoading,
      refresh,
    }),
    [sites, currentSiteIdState, isLoading, refresh, setCurrentSiteId],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within <SiteProvider>');
  return ctx;
}
