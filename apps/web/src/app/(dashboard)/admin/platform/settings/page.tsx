'use client';

import { useMemo, useState } from 'react';
import { usePlatformSettings, useUpdatePlatformSettings } from '@/hooks/use-admin';
import { useAuth } from '@/components/auth/auth-provider';
import { UnauthorizedScreen } from '@/components/layout/role-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ── Defaults ─────────────────────────────────────────────────────────────
const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  tenant_creation_enabled: true,
  danger_actions_enabled: true,
  maintenance_mode: false,
  registration_enabled: true,
};

const FEATURE_FLAG_META: Record<string, { label: string; description: string; variant: 'default' | 'destructive' | 'outline' }> = {
  tenant_creation_enabled: {
    label: 'Yeni Tenant Oluşturma',
    description: 'Platformda yeni tenant (organizasyon) oluşturulmasına izin verir.',
    variant: 'default',
  },
  danger_actions_enabled: {
    label: 'Tehlikeli İşlemler',
    description: 'Tenant askıya alma, silme gibi tehlikeli işlemleri aktifleştirir.',
    variant: 'destructive',
  },
  maintenance_mode: {
    label: 'Bakım Modu',
    description: 'Platform genelinde bakım modunu aktifleştirir. Kullanıcılar geçici olarak erişemez.',
    variant: 'destructive',
  },
  registration_enabled: {
    label: 'Yeni Kullanıcı Kaydı',
    description: 'Yeni kullanıcıların platforma kayıt olmasına izin verir.',
    variant: 'default',
  },
};

interface PlanLimits {
  sites: number;
  users: number;
}

const DEFAULT_PLAN_LIMITS: Record<string, PlanLimits> = {
  demo: { sites: 1, users: 3 },
  starter: { sites: 3, users: 10 },
  pro: { sites: 20, users: 100 },
};

const PLAN_META: Record<string, { label: string; color: string }> = {
  demo: { label: 'Demo', color: 'bg-zinc-500' },
  starter: { label: 'Starter', color: 'bg-blue-500' },
  pro: { label: 'Pro', color: 'bg-emerald-500' },
};

// ── Helpers ──────────────────────────────────────────────────────────────
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

// ── Page ─────────────────────────────────────────────────────────────────
export default function PlatformSettingsPage() {
  const auth = useAuth();
  const settingsQuery = usePlatformSettings();
  const updateMutation = useUpdatePlatformSettings();
  const [activeTab, setActiveTab] = useState('flags');

  // Parse settings from API
  const settingsMap = useMemo(() => {
    const entries = settingsQuery.data?.items ?? [];
    const map = new Map<string, Record<string, unknown>>();
    for (const item of entries) {
      map.set(item.key, item.value);
    }
    return map;
  }, [settingsQuery.data?.items]);

  // ── Feature Flags State ──
  const serverFlags = useMemo(() => {
    const fromDb = settingsMap.get('feature_flags') ?? {};
    return { ...DEFAULT_FEATURE_FLAGS, ...fromDb } as Record<string, boolean>;
  }, [settingsMap]);

  const [localFlags, setLocalFlags] = useState<Record<string, boolean> | null>(null);
  const flags = localFlags ?? serverFlags;

  const toggleFlag = (key: string) => {
    const current = localFlags ?? { ...serverFlags };
    setLocalFlags({ ...current, [key]: !current[key] });
  };

  const saveFlags = () => {
    updateMutation.mutate(
      { items: [{ key: 'feature_flags', value: flags }] },
      {
        onSuccess: () => {
          toast.success('Feature flag\'lar güncellendi');
          setLocalFlags(null);
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : 'Güncelleme başarısız'),
      },
    );
  };

  // ── Plan Limits State ──
  const serverPlanLimits = useMemo(() => {
    const fromDb = settingsMap.get('plan_limits') ?? {};
    const merged: Record<string, PlanLimits> = {};
    for (const [plan, defaults] of Object.entries(DEFAULT_PLAN_LIMITS)) {
      const dbPlan = (fromDb as Record<string, PlanLimits>)[plan];
      merged[plan] = {
        sites: dbPlan?.sites ?? defaults.sites,
        users: dbPlan?.users ?? defaults.users,
      };
    }
    return merged;
  }, [settingsMap]);

  const [localPlanLimits, setLocalPlanLimits] = useState<Record<string, PlanLimits> | null>(null);
  const planLimits = localPlanLimits ?? serverPlanLimits;

  const updatePlanLimit = (plan: string, field: 'sites' | 'users', value: number) => {
    const current = localPlanLimits ?? { ...serverPlanLimits };
    const planData: PlanLimits = current[plan] ?? { sites: 0, users: 0 };
    setLocalPlanLimits({
      ...current,
      [plan]: { ...planData, [field]: value },
    } as Record<string, PlanLimits>);
  };

  const savePlanLimits = () => {
    updateMutation.mutate(
      { items: [{ key: 'plan_limits', value: planLimits }] },
      {
        onSuccess: () => {
          toast.success('Plan limitleri güncellendi');
          setLocalPlanLimits(null);
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : 'Güncelleme başarısız'),
      },
    );
  };

  // ── Advanced JSON State ──
  const defaultAdvancedText = useMemo(() => {
    const allSettings: Record<string, unknown> = {};
    for (const [key, value] of settingsMap.entries()) {
      allSettings[key] = value;
    }
    if (Object.keys(allSettings).length === 0) {
      return JSON.stringify({ feature_flags: DEFAULT_FEATURE_FLAGS, plan_limits: DEFAULT_PLAN_LIMITS }, null, 2);
    }
    return JSON.stringify(allSettings, null, 2);
  }, [settingsMap]);

  const [advancedText, setAdvancedText] = useState<string | null>(null);
  const advancedInput = advancedText ?? defaultAdvancedText;

  const saveAdvanced = () => {
    const parsed = safeJsonParse(advancedInput);
    if (!parsed.ok) {
      toast.error(parsed.message);
      return;
    }

    const items = Object.entries(parsed.value).map(([key, value]) => ({
      key,
      value: (typeof value === 'object' && value !== null ? value : { _raw: value }) as Record<string, unknown>,
    }));

    if (items.length === 0) {
      toast.error('En az bir ayar girin.');
      return;
    }

    updateMutation.mutate(
      { items },
      {
        onSuccess: () => {
          toast.success('Tüm ayarlar güncellendi');
          setAdvancedText(null);
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : 'Güncelleme başarısız'),
      },
    );
  };

  // ── Guard ──
  if (auth.me?.role !== 'super_admin') {
    return <UnauthorizedScreen />;
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Yükleniyor...</CardContent>
        </Card>
      </div>
    );
  }

  if (settingsQuery.error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">Platform settings yüklenemedi.</CardContent>
        </Card>
      </div>
    );
  }

  const flagsChanged = localFlags !== null;
  const planLimitsChanged = localPlanLimits !== null;
  const advancedChanged = advancedText !== null;

  return (
    <div className="space-y-6">
      <PageHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="flags">🏳️ Feature Flags</TabsTrigger>
          <TabsTrigger value="plans">📊 Plan Limitleri</TabsTrigger>
          <TabsTrigger value="advanced">⚙️ Gelişmiş</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Feature Flags ── */}
        <TabsContent value="flags">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Platform genelindeki özellikleri açıp kapatın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(FEATURE_FLAG_META).map(([key, meta], index) => (
                <div key={key}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`flag-${key}`} className="text-sm font-medium cursor-pointer">
                          {meta.label}
                        </Label>
                        <Badge variant={meta.variant} className="text-[10px] px-1.5 py-0">
                          {key}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{meta.description}</p>
                    </div>
                    <Switch
                      id={`flag-${key}`}
                      checked={flags[key] ?? false}
                      onCheckedChange={() => toggleFlag(key)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-4">
            {flagsChanged && (
              <Button variant="outline" onClick={() => setLocalFlags(null)}>
                Sıfırla
              </Button>
            )}
            <Button disabled={!flagsChanged || updateMutation.isPending} onClick={saveFlags}>
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </TabsContent>

        {/* ── Tab 2: Plan Limits ── */}
        <TabsContent value="plans">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(PLAN_META).map(([planKey, meta]) => {
              const limits = planLimits[planKey] ?? DEFAULT_PLAN_LIMITS[planKey] ?? { sites: 0, users: 0 };
              return (
                <Card key={planKey} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 ${meta.color}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{meta.label}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">{planKey}</Badge>
                    </div>
                    <CardDescription>Plan limitleri</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${planKey}-sites`} className="text-xs text-muted-foreground">
                        Maks. Site Sayısı
                      </Label>
                      <Input
                        id={`${planKey}-sites`}
                        type="number"
                        min={1}
                        max={999}
                        value={limits.sites}
                        onChange={(e) => updatePlanLimit(planKey, 'sites', Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${planKey}-users`} className="text-xs text-muted-foreground">
                        Maks. Kullanıcı Sayısı
                      </Label>
                      <Input
                        id={`${planKey}-users`}
                        type="number"
                        min={1}
                        max={9999}
                        value={limits.users}
                        onChange={(e) => updatePlanLimit(planKey, 'users', Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            {planLimitsChanged && (
              <Button variant="outline" onClick={() => setLocalPlanLimits(null)}>
                Sıfırla
              </Button>
            )}
            <Button disabled={!planLimitsChanged || updateMutation.isPending} onClick={savePlanLimits}>
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </TabsContent>

        {/* ── Tab 3: Advanced JSON ── */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Gelişmiş Ayarlar</CardTitle>
              <CardDescription>
                Tüm platform ayarlarını ham JSON olarak düzenleyin. Dikkatli kullanın.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[320px] font-mono text-xs"
                value={advancedInput}
                onChange={(event) => setAdvancedText(event.target.value)}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-4">
            {advancedChanged && (
              <Button variant="outline" onClick={() => setAdvancedText(null)}>
                Sıfırla
              </Button>
            )}
            <Button disabled={!advancedChanged || updateMutation.isPending} onClick={saveAdvanced}>
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
      <p className="text-muted-foreground">Platform genelindeki ayarları, feature flag&apos;ları ve plan limitlerini yönetin.</p>
    </div>
  );
}
