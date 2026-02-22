import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const PAGE_DIR = path.resolve(__dirname, '../../src/app/(dashboard)/inbox');

// — Inbox Offers Sayfası —
describe('inbox/offers/page.tsx smoke test', () => {
  const source = readFileSync(path.join(PAGE_DIR, 'offers/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useOffers hook import ediliyor', () => {
    expect(source).toContain("useOffers");
    expect(source).toContain("from '@/hooks/use-inbox'");
  });

  it('useMarkAsRead hook import ediliyor', () => {
    expect(source).toContain("useMarkAsRead");
  });

  it('bulk mark-read hook import ediliyor', () => {
    expect(source).toContain("useBulkMarkAsRead");
  });

  it('sayfa clamp mantığı effect içinde setState kullanmıyor', () => {
    expect(source).toContain('effectivePage');
    expect(source).not.toContain('set-state-in-effect');
  });

  it('useSite provider kullanılıyor', () => {
    expect(source).toContain("useSite");
    expect(source).toContain("from '@/components/site/site-provider'");
  });

  it('ham API çağrısı yok (api.get/api.post)', () => {
    expect(source).not.toMatch(/api\.get\s*\(/);
    expect(source).not.toMatch(/api\.post\s*\(/);
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Inbox Contact Sayfası —
describe('inbox/contact/page.tsx smoke test', () => {
  const source = readFileSync(path.join(PAGE_DIR, 'contact/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useContacts hook import ediliyor', () => {
    expect(source).toContain("useContacts");
    expect(source).toContain("from '@/hooks/use-inbox'");
  });

  it('useMarkAsRead hook import ediliyor', () => {
    expect(source).toContain("useMarkAsRead");
  });

  it('bulk mark-read hook import ediliyor', () => {
    expect(source).toContain("useBulkMarkAsRead");
  });

  it('sayfa clamp mantığı effect içinde setState kullanmıyor', () => {
    expect(source).toContain('effectivePage');
    expect(source).not.toContain('set-state-in-effect');
  });

  it('useSite provider kullanılıyor', () => {
    expect(source).toContain("useSite");
    expect(source).toContain("from '@/components/site/site-provider'");
  });

  it('ham API çağrısı yok (api.get/api.post)', () => {
    expect(source).not.toMatch(/api\.get\s*\(/);
    expect(source).not.toMatch(/api\.post\s*\(/);
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Inbox Applications Sayfası —
describe('inbox/applications/page.tsx smoke test', () => {
  const source = readFileSync(path.join(PAGE_DIR, 'applications/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useApplications hook import ediliyor', () => {
    expect(source).toContain("useApplications");
    expect(source).toContain("from '@/hooks/use-inbox'");
  });

  it('useMarkAsRead hook import ediliyor', () => {
    expect(source).toContain("useMarkAsRead");
  });

  it('bulk mark-read hook import ediliyor', () => {
    expect(source).toContain("useBulkMarkAsRead");
  });

  it('sayfa clamp mantığı effect içinde setState kullanmıyor', () => {
    expect(source).toContain('effectivePage');
    expect(source).not.toContain('set-state-in-effect');
  });

  it('useSite provider kullanılıyor', () => {
    expect(source).toContain("useSite");
    expect(source).toContain("from '@/components/site/site-provider'");
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});
