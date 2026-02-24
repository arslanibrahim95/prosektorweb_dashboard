# Codebase Control Initial Report (2026-02-24)

## Status (Strict)

- `IN_PROGRESS`
- Verified findings: `4`
- Unverified / inference findings: `4`
- False positives disproven: `2`

## Scope

- Repo-wide static inventory (files, tree, large files, CI/test inventory)
- Delegated analysis:
  - `gemini` (map, test-gap)
  - `opencode` (risk)
- Local spot-check verification of selected findings

Excluded / incomplete:
- `z.ai` (missing `ZAI_OPENAI_BASE_URL`)
- `minimax` (missing `MINIMAX_API_KEY` / base URL)
- Full lint/test execution not run yet

## Verified Findings

1. CI does not run frontend unit/component tests (`test:web`) on PR/main.
   - Evidence: `package.json:23` defines `test:web`, but `.github/workflows/ci.yml` has jobs for `lint`, `test-contracts`, `test-api`, `test-db`, and `test-e2e` only (`.github/workflows/ci.yml:16`, `.github/workflows/ci.yml:45`, `.github/workflows/ci.yml:68`, `.github/workflows/ci.yml:98`, `.github/workflows/ci.yml:146`).
   - Impact: `apps/web` Vitest coverage is not a merge gate.

2. E2E tests are gated to `push` on `main` only (not PRs).
   - Evidence: `.github/workflows/ci.yml:149`
   - Impact: PR merges can bypass end-to-end regression detection.

3. Large OpenAPI spec reduction is real and high-risk for contract drift.
   - Evidence: `git diff --stat -- apps/api/src/openapi/spec.ts` shows `2518 deletions / 40 insertions` in `apps/api/src/openapi/spec.ts`.
   - Impact: API schema/consumer contract regressions can slip through without spec-vs-route validation.

4. Onboarding analytics is still a placeholder (telemetry gap).
   - Evidence: `apps/web/src/lib/onboarding-analytics.ts:55`
   - Impact: rollout issues in onboarding flows may be harder to diagnose.

## Unverified / Inference Findings (Need Deeper Validation)

1. `@/server/rate-limit` coupling hotspot across many routes may increase regression risk.
   - Source: delegated `opencode` risk scan
   - Needs: usage inventory + shared abstraction review

2. `@/lib/logger` usage across web modules may create unnecessary UI coupling / bundle bloat risk.
   - Source: delegated `opencode` risk scan
   - Needs: import graph + bundle analysis

3. Admin page refactor (`admin/users`, `admin/i18n`) likely lacks targeted regression coverage.
   - Evidence (partial): changed files include `apps/web/src/app/(dashboard)/admin/i18n/page.tsx` and `apps/web/src/app/(dashboard)/admin/users/page.tsx`; smoke tests present but no obvious matching admin users/i18n smoke files in `apps/web/tests/smoke/`.
   - Needs: inspect `apps/web/tests/e2e/admin-security.spec.ts` and current admin integration tests in detail.

4. Deprecated server action still writes `.env.local` (operational/security surface), though protected key UI updates are blocked.
   - Evidence: `apps/web/src/actions/update-env.ts:147` (`@deprecated`) and file write at `apps/web/src/actions/update-env.ts:194`
   - Mitigation present: super-admin guard (`apps/web/src/actions/update-env.ts:154`), protected key block (`apps/web/src/actions/update-env.ts:157`)
   - Needs: decision whether to fully remove path.

## False Positives / Disproven

1. `.next` build outputs are tracked in git
   - Disproven by `git ls-files 'apps/web/.next/*' 'apps/api/.next/*'` => `0` tracked files.
   - Likely cause: inventory included local build artifacts from working tree, not tracked content.

2. Service role key is exposed to the Supabase settings UI page
   - Disproven in current page path:
     - UI calls `getSupabaseSettings()` (`apps/web/src/app/(dashboard)/settings/supabase/page.tsx:14`, `apps/web/src/app/(dashboard)/settings/supabase/page.tsx:46`)
     - action strips raw key and returns only `hasServiceRoleKey` (`apps/web/src/actions/update-env.ts:206`)
     - UI masks value (`apps/web/src/app/(dashboard)/settings/supabase/page.tsx:143`)
   - Note: `getSupabaseAdminSettings()` still returns raw key (`apps/web/src/actions/update-env.ts:84`), but current checked page does not render it directly.

## Notes on RLS Comment Signal

- `packages/db/rls-policies.sql:6` contains a broad comment ("Read is generally allowed to any tenant member").
- Spot-check of the same file shows tenant-scoped policy predicates in early sections (e.g., `public.is_tenant_member(...)` and `public.has_tenant_role(...)` in `packages/db/rls-policies.sql:27`, `packages/db/rls-policies.sql:40`, `packages/db/rls-policies.sql:75`).
- Conclusion: comment alone is not sufficient to claim an actual tenant isolation bug.

## Recommended Next Steps

1. Add `test:web` to CI (`.github/workflows/ci.yml`) and keep it PR-gated.
2. Add a PR smoke subset for Playwright (or a minimal `test:e2e:smoke`) instead of `main`-only E2E.
3. Add OpenAPI spec consistency check (generated/validated) before merging large spec diffs.
4. Run targeted test audit for refactored admin pages (`users`, `i18n`) and add coverage.
5. Decide whether to remove `updateSupabaseSettings()` fully instead of leaving deprecated writable path.
