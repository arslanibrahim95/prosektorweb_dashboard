import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DASH_DIR = path.resolve(__dirname, '../../src/app/(dashboard)');

// — Settings: Users Sayfası —
describe('settings/users/page.tsx smoke test', () => {
  const source = readFileSync(path.join(DASH_DIR, 'settings/users/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useMembers hook import ediliyor', () => {
    expect(source).toContain('useMembers');
    expect(source).toContain("from '@/hooks/use-members'");
  });

  it('useInviteMember hook import ediliyor', () => {
    expect(source).toContain('useInviteMember');
  });

  it('useUpdateMemberRole hook import ediliyor', () => {
    expect(source).toContain('useUpdateMemberRole');
  });

  it('useRemoveMember hook import ediliyor', () => {
    expect(source).toContain('useRemoveMember');
  });

  it('useAuth provider kullanılıyor', () => {
    expect(source).toContain('useAuth');
    expect(source).toContain("from '@/components/auth/auth-provider'");
  });

  it('ham API çağrısı yok', () => {
    expect(source).not.toMatch(/api\.get\s*\(/);
    expect(source).not.toMatch(/api\.post\s*\(/);
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Settings: Billing Sayfası (placeholder) —
describe('settings/billing/page.tsx smoke test', () => {
  const source = readFileSync(path.join(DASH_DIR, 'settings/billing/page.tsx'), 'utf8');

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Settings: Notifications Sayfası —
describe('settings/notifications/page.tsx smoke test', () => {
  const source = readFileSync(path.join(DASH_DIR, 'settings/notifications/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Analytics Sayfası —
describe('analytics/page.tsx smoke test', () => {
  const source = readFileSync(path.join(DASH_DIR, 'analytics/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useAnalyticsOverview hook import ediliyor', () => {
    expect(source).toContain('useAnalyticsOverview');
    expect(source).toContain("from '@/hooks/use-analytics'");
  });

  it('useAnalyticsTimeline hook import ediliyor', () => {
    expect(source).toContain('useAnalyticsTimeline');
  });

  it('useSite provider kullanılıyor', () => {
    expect(source).toContain('useSite');
    expect(source).toContain("from '@/components/site/site-provider'");
  });

  it('ham API çağrısı yok', () => {
    expect(source).not.toMatch(/api\.get\s*\(/);
    expect(source).not.toMatch(/api\.post\s*\(/);
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Home Sayfası —
describe('home/page.tsx smoke test', () => {
  const source = readFileSync(path.join(DASH_DIR, 'home/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useDashboardStats hook import ediliyor', () => {
    expect(source).toContain('useDashboardStats');
    expect(source).toContain("from '@/hooks/use-dashboard'");
  });

  it('useAuth provider kullanılıyor', () => {
    expect(source).toContain('useAuth');
    expect(source).toContain("from '@/components/auth/auth-provider'");
  });

  it('useSite provider kullanılıyor', () => {
    expect(source).toContain('useSite');
    expect(source).toContain("from '@/components/site/site-provider'");
  });

  it('eski doğrudan inbox API çağrıları kaldırılmış', () => {
    expect(source).not.toContain("api.get('/inbox/offers'");
    expect(source).not.toContain("api.get('/inbox/contact'");
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});
