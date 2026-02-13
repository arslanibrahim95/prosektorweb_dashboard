'use client';

import type { Site } from '@prosektor/contracts';
import { listSitesResponseSchema } from '@prosektor/contracts';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

  const refresh = async () => {
    if (!auth.session) return;
    setIsLoading(true);
    try {
      const response = await api.get('/sites', undefined, listSitesResponseSchema);
      setSites(response.items);
      setCurrentSiteId((prev) => prev ?? response.items[0]?.id ?? null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.session) {
      setSites([]);
      setCurrentSiteId(null);
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.session?.access_token]);

  const value: SiteContextValue = useMemo(
    () => ({
      sites,
      currentSiteId,
      setCurrentSiteId,
      isLoading,
      refresh,
    }),
    [sites, currentSiteId, isLoading],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within <SiteProvider>');
  return ctx;
}

