'use client';

import type { Site } from '@prosektor/contracts';
import { listSitesResponseSchema } from '@prosektor/contracts';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/server/api';
import { useAuth } from '@/components/auth/auth-provider';

export interface SiteContextValue {
  sites: Site[];
  currentSiteId: string | null;
  setCurrentSiteId: (id: string) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!auth.session) return;
    setIsLoading(true);
    try {
      const response = await api.get('/sites', undefined, listSitesResponseSchema);
      setSites(response.items);
      setCurrentSiteId((prev) => {
        if (!response.items.length) return null;
        if (prev && response.items.some((site) => site.id === prev)) return prev;
        return response.items[0].id;
      });
    } finally {
      setIsLoading(false);
    }
  }, [auth.session]);

  useEffect(() => {
    if (!auth.session) {
      setSites([]);
      setCurrentSiteId(null);
      return;
    }
    void refresh();
  }, [auth.session, refresh]);

  const value: SiteContextValue = useMemo(
    () => ({
      sites,
      currentSiteId,
      setCurrentSiteId,
      isLoading,
      refresh,
    }),
    [sites, currentSiteId, isLoading, refresh],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within <SiteProvider>');
  return ctx;
}
