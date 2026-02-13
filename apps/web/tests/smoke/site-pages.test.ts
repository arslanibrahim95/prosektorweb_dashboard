import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SITE_DIR = path.resolve(__dirname, '../../src/app/(dashboard)/site');

// — Pages Sayfası —
describe('site/pages/page.tsx smoke test', () => {
  const source = readFileSync(path.join(SITE_DIR, 'pages/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('usePages hook import ediliyor', () => {
    expect(source).toContain('usePages');
    expect(source).toContain("from '@/hooks/use-pages'");
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

// — Domains Sayfası —
describe('site/domains/page.tsx smoke test', () => {
  const source = readFileSync(path.join(SITE_DIR, 'domains/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useDomains hook import ediliyor', () => {
    expect(source).toContain('useDomains');
    expect(source).toContain("from '@/hooks/use-domains'");
  });

  it('useCreateDomain hook import ediliyor', () => {
    expect(source).toContain('useCreateDomain');
  });

  it('useSetPrimaryDomain hook import ediliyor', () => {
    expect(source).toContain('useSetPrimaryDomain');
  });

  it('useDeleteDomain hook import ediliyor', () => {
    expect(source).toContain('useDeleteDomain');
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

// — SEO Sayfası —
describe('site/seo/page.tsx smoke test', () => {
  const source = readFileSync(path.join(SITE_DIR, 'seo/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('useSEOSettings hook import ediliyor', () => {
    expect(source).toContain('useSEOSettings');
    expect(source).toContain("from '@/hooks/use-seo'");
  });

  it('useSaveSEOSettings hook import ediliyor', () => {
    expect(source).toContain('useSaveSEOSettings');
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

// — Publish Sayfası —
describe('site/publish/page.tsx smoke test', () => {
  const source = readFileSync(path.join(SITE_DIR, 'publish/page.tsx'), 'utf8');

  it("'use client' direktifi var", () => {
    expect(source).toContain("'use client'");
  });

  it('usePublishSite hook import ediliyor', () => {
    expect(source).toContain('usePublishSite');
    expect(source).toContain("from '@/hooks/use-publish'");
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

// — Builder Sayfası (placeholder) —
describe('site/builder/page.tsx smoke test', () => {
  const source = readFileSync(path.join(SITE_DIR, 'builder/page.tsx'), 'utf8');

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Media Sayfası (placeholder) —
describe('site/media/page.tsx smoke test', () => {
  const source = readFileSync(path.join(SITE_DIR, 'media/page.tsx'), 'utf8');

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});

// — Menus Sayfası (placeholder) —
describe('site/menus/page.tsx smoke test', () => {
  const source = readFileSync(path.join(SITE_DIR, 'menus/page.tsx'), 'utf8');

  it('export default function var', () => {
    expect(source).toContain('export default function');
  });
});
