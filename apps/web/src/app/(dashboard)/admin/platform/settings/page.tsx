'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePlatformSettings, useUpdatePlatformSettings } from '@/hooks/use-admin';
import { useAuth } from '@/components/auth/auth-provider';
import { UnauthorizedScreen } from '@/components/layout/role-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DEFAULT_FEATURE_FLAGS = {
  tenant_creation_enabled: true,
  danger_actions_enabled: true,
};

const DEFAULT_PLAN_LIMITS = {
  demo: { sites: 1, users: 3 },
  starter: { sites: 3, users: 10 },
  pro: { sites: 20, users: 100 },
};

function safeJsonParse(input: string): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false, message: 'JSON object olmalı.' };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, message: 'Geçersiz JSON.' };
  }
}

export default function PlatformSettingsPage() {
  const auth = useAuth();
  const settingsQuery = usePlatformSettings();
  const updateMutation = useUpdatePlatformSettings();

  const settingsMap = useMemo(() => {
    const entries = settingsQuery.data?.items ?? [];
    const map = new Map<string, Record<string, unknown>>();
    for (const item of entries) {
      map.set(item.key, item.value);
    }
    return map;
  }, [settingsQuery.data?.items]);

  const [featureFlagsText, setFeatureFlagsText] = useState('');
  const [planLimitsText, setPlanLimitsText] = useState('');

  useEffect(() => {
    if (!settingsQuery.data) return;
    const featureFlags = settingsMap.get('feature_flags') ?? DEFAULT_FEATURE_FLAGS;
    const planLimits = settingsMap.get('plan_limits') ?? DEFAULT_PLAN_LIMITS;
    setFeatureFlagsText(JSON.stringify(featureFlags, null, 2));
    setPlanLimitsText(JSON.stringify(planLimits, null, 2));
  }, [settingsMap, settingsQuery.data]);

  if (auth.me?.role !== 'super_admin') {
    return <UnauthorizedScreen />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Feature flag ve plan limitlerini JSON olarak yönetin.</p>
      </div>

      {settingsQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Yükleniyor...</CardContent>
        </Card>
      ) : settingsQuery.error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">Platform settings yüklenemedi.</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Örnek: tenant creation veya danger action aç/kapat</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[220px] font-mono text-xs"
                value={featureFlagsText}
                onChange={(event) => setFeatureFlagsText(event.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan Limits</CardTitle>
              <CardDescription>Örnek: plan başına site/kullanıcı limitleri</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[240px] font-mono text-xs"
                value={planLimitsText}
                onChange={(event) => setPlanLimitsText(event.target.value)}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                const featureFlagsParsed = safeJsonParse(featureFlagsText);
                if (!featureFlagsParsed.ok) {
                  toast.error(`feature_flags: ${featureFlagsParsed.message}`);
                  return;
                }

                const planLimitsParsed = safeJsonParse(planLimitsText);
                if (!planLimitsParsed.ok) {
                  toast.error(`plan_limits: ${planLimitsParsed.message}`);
                  return;
                }

                updateMutation.mutate(
                  {
                    items: [
                      { key: 'feature_flags', value: featureFlagsParsed.value },
                      { key: 'plan_limits', value: planLimitsParsed.value },
                    ],
                  },
                  {
                    onSuccess: () => {
                      toast.success('Platform settings güncellendi');
                    },
                    onError: (error) => {
                      toast.error(error instanceof Error ? error.message : 'Platform settings güncellenemedi');
                    },
                  },
                );
              }}
            >
              Kaydet
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
