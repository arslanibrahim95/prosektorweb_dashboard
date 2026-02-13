import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const HOOKS_DIR = path.resolve(__dirname, '../../src/hooks');

const EXPECTED_HOOKS = [
  'use-analytics',
  'use-dashboard',
  'use-domains',
  'use-hr',
  'use-inbox',
  'use-legal-texts',
  'use-members',
  'use-modules',
  'use-pages',
  'use-publish',
  'use-seo',
  'use-unread-count',
] as const;

// — Hook dosyası sayısı —
describe('hooks dizini', () => {
  it('beklenen 13 hook dosyası mevcut', () => {
    const files = readdirSync(HOOKS_DIR).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBe(13);
    for (const hook of EXPECTED_HOOKS) {
      expect(files).toContain(`${hook}.ts`);
    }
  });
});

// — Her hook için ortak pattern kontrolü —
describe.each(EXPECTED_HOOKS)('%s hook smoke test', (hookName) => {
  const source = readFileSync(path.join(HOOKS_DIR, `${hookName}.ts`), 'utf8');

  it("@tanstack/react-query'den import var", () => {
    expect(source).toContain("from '@tanstack/react-query'");
  });

  it("api client import ediliyor (@/server/api)", () => {
    expect(source).toContain("from '@/server/api'");
  });

  it('en az bir fonksiyon export ediyor', () => {
    expect(source).toMatch(/export\s+function\s+\w+/);
  });

  it('ham fetch() çağrısı yok', () => {
    // fetch( kullanımını kontrol et, ancak "refetch" gibi tanımlayıcıları hariç tut
    const lines = source.split('\n');
    const rawFetchLines = lines.filter(
      (line) =>
        /\bfetch\s*\(/.test(line) &&
        !line.trim().startsWith('//') &&
        !line.includes('refetch') &&
        !line.includes('prefetch'),
    );
    expect(rawFetchLines).toHaveLength(0);
  });
});

// — Spesifik hook export kontrolleri —
describe('hook export doğrulaması', () => {
  it('use-inbox: useOffers, useContacts, useApplications, useMarkAsRead export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-inbox.ts'), 'utf8');
    expect(source).toContain('export function useOffers');
    expect(source).toContain('export function useContacts');
    expect(source).toContain('export function useApplications');
    expect(source).toContain('export function useMarkAsRead');
  });

  it('use-hr: useJobPosts, useCreateJobPost, useUpdateJobPost, useDeleteJobPost export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-hr.ts'), 'utf8');
    expect(source).toContain('export function useJobPosts');
    expect(source).toContain('export function useCreateJobPost');
    expect(source).toContain('export function useUpdateJobPost');
    expect(source).toContain('export function useDeleteJobPost');
  });

  it('use-dashboard: useDashboardStats export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-dashboard.ts'), 'utf8');
    expect(source).toContain('export function useDashboardStats');
  });

  it('use-modules: useModules, useKvkkTexts, useSaveModule export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-modules.ts'), 'utf8');
    expect(source).toContain('export function useModules');
    expect(source).toContain('export function useKvkkTexts');
    expect(source).toContain('export function useSaveModule');
  });

  it('use-domains: useDomains, useCreateDomain, useSetPrimaryDomain, useDeleteDomain export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-domains.ts'), 'utf8');
    expect(source).toContain('export function useDomains');
    expect(source).toContain('export function useCreateDomain');
    expect(source).toContain('export function useSetPrimaryDomain');
    expect(source).toContain('export function useDeleteDomain');
  });

  it('use-members: useMembers, useInviteMember, useUpdateMemberRole, useRemoveMember export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-members.ts'), 'utf8');
    expect(source).toContain('export function useMembers');
    expect(source).toContain('export function useInviteMember');
    expect(source).toContain('export function useUpdateMemberRole');
    expect(source).toContain('export function useRemoveMember');
  });

  it('use-pages: usePages, useCreatePage export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-pages.ts'), 'utf8');
    expect(source).toContain('export function usePages');
    expect(source).toContain('export function useCreatePage');
  });

  it('use-seo: useSEOSettings, useSaveSEOSettings export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-seo.ts'), 'utf8');
    expect(source).toContain('export function useSEOSettings');
    expect(source).toContain('export function useSaveSEOSettings');
  });

  it('use-analytics: useAnalyticsOverview, useAnalyticsTimeline export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-analytics.ts'), 'utf8');
    expect(source).toContain('export function useAnalyticsOverview');
    expect(source).toContain('export function useAnalyticsTimeline');
  });

  it('use-publish: usePublishSite export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-publish.ts'), 'utf8');
    expect(source).toContain('export function usePublishSite');
  });

  it('use-legal-texts: useLegalTexts, useCreateLegalText export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-legal-texts.ts'), 'utf8');
    expect(source).toContain('export function useLegalTexts');
    expect(source).toContain('export function useCreateLegalText');
  });

  it('use-unread-count: useUnreadCount export ediyor', () => {
    const source = readFileSync(path.join(HOOKS_DIR, 'use-unread-count.ts'), 'utf8');
    expect(source).toContain('export function useUnreadCount');
  });
});
