import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MOD_DIR = path.resolve(__dirname, '../../src/app/(dashboard)/modules');

// — Offer Modülü Sayfası —
describe('modules/offer/page.tsx smoke test', () => {
  const source = readFileSync(path.join(MOD_DIR, 'offer/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useModules hook import ediliyor', () => {
    expect(source).toContain('useModules');
    expect(source).toContain("from '@/hooks/use-modules'");
  });

  it('useKvkkTexts hook import ediliyor', () => {
    expect(source).toContain('useKvkkTexts');
  });

  it('useSaveModule hook import ediliyor', () => {
    expect(source).toContain('useSaveModule');
  });

  it('useSite provider kullanılıyor', () => {
    expect(source).toContain('useSite');
    expect(source).toContain("from '@/components/site/site-provider'");
  });

  it('ham API çağrısı yok', () => {
    expect(source).not.toMatch(/api\.get\s*\(/);
    expect(source).not.toMatch(/api\.post\s*\(/);
  });

  it('state sync lint bypass / JSON stringify karşılaştırması yok', () => {
    expect(source).not.toContain('set-state-in-effect');
    expect(source).not.toContain('JSON.stringify');
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Contact Modülü Sayfası —
describe('modules/contact/page.tsx smoke test', () => {
  const source = readFileSync(path.join(MOD_DIR, 'contact/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useModules hook import ediliyor', () => {
    expect(source).toContain('useModules');
    expect(source).toContain("from '@/hooks/use-modules'");
  });

  it('useKvkkTexts hook import ediliyor', () => {
    expect(source).toContain('useKvkkTexts');
  });

  it('useSaveModule hook import ediliyor', () => {
    expect(source).toContain('useSaveModule');
  });

  it('useSite provider kullanılıyor', () => {
    expect(source).toContain('useSite');
    expect(source).toContain("from '@/components/site/site-provider'");
  });

  it('ham API çağrısı yok', () => {
    expect(source).not.toMatch(/api\.get\s*\(/);
    expect(source).not.toMatch(/api\.post\s*\(/);
  });

  it('state sync lint bypass / JSON stringify karşılaştırması yok', () => {
    expect(source).not.toContain('set-state-in-effect');
    expect(source).not.toContain('JSON.stringify');
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Legal Modülü Sayfası —
describe('modules/legal/page.tsx smoke test', () => {
  const source = readFileSync(path.join(MOD_DIR, 'legal/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useLegalTexts hook import ediliyor', () => {
    expect(source).toContain('useLegalTexts');
    expect(source).toContain("from '@/hooks/use-legal-texts'");
  });

  it('ham API çağrısı yok', () => {
    expect(source).not.toMatch(/api\.get\s*\(/);
    expect(source).not.toMatch(/api\.post\s*\(/);
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — HR Job Posts Sayfası —
describe('modules/hr/job-posts/page.tsx smoke test', () => {
  const source = readFileSync(path.join(MOD_DIR, 'hr/job-posts/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useJobPosts hook import ediliyor', () => {
    expect(source).toContain('useJobPosts');
    expect(source).toContain("from '@/hooks/use-hr'");
  });

  it('useCreateJobPost hook import ediliyor', () => {
    expect(source).toContain('useCreateJobPost');
  });

  it('useUpdateJobPost hook import ediliyor', () => {
    expect(source).toContain('useUpdateJobPost');
  });

  it('useDeleteJobPost hook import ediliyor', () => {
    expect(source).toContain('useDeleteJobPost');
  });

  it('useSite provider kullanılıyor', () => {
    expect(source).toContain('useSite');
    expect(source).toContain("from '@/components/site/site-provider'");
  });

  it('ham api import yok', () => {
    expect(source).not.toContain("import { api }");
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — HR Applications Sayfası —
describe('modules/hr/applications/page.tsx smoke test', () => {
  const source = readFileSync(path.join(MOD_DIR, 'hr/applications/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useApplications hook import ediliyor', () => {
    expect(source).toContain('useApplications');
    expect(source).toContain("from '@/hooks/use-inbox'");
  });

  it('useJobPosts hook import ediliyor', () => {
    expect(source).toContain('useJobPosts');
    expect(source).toContain("from '@/hooks/use-hr'");
  });

  it('useSite provider kullanılıyor', () => {
    expect(source).toContain('useSite');
    expect(source).toContain("from '@/components/site/site-provider'");
  });

  it('ErrorBoundary ile sarılı', () => {
    expect(source).toContain('ErrorBoundary');
  });

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});
