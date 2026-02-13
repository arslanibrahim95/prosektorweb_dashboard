import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('home dashboard data source', () => {
  it('uses consolidated /api/dashboard/summary endpoint via hook', () => {
    const source = readFileSync(
      path.resolve(__dirname, '../../src/app/(dashboard)/home/page.tsx'),
      'utf8',
    );

    // Page uses the React Query hook instead of direct api.get call
    expect(source).toContain('useDashboardStats');
    expect(source).not.toContain("api.get('/inbox/offers'");
    expect(source).not.toContain("api.get('/inbox/contact'");
    expect(source).not.toContain("api.get('/inbox/applications'");
  });

  it('hook calls /dashboard/summary endpoint', () => {
    const hookSource = readFileSync(
      path.resolve(__dirname, '../../src/hooks/use-dashboard.ts'),
      'utf8',
    );

    expect(hookSource).toContain("'/dashboard/summary'");
  });
});
