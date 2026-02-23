# Backend Hardening Inventory

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Generated: 2026-02-20T19:56:41.797Z

## Coverage Summary

- Total routes: 80
- Auth guard coverage: 80/80
- Rate-limit coverage: 80/80
- Standard error handling coverage: 80/80
- Needs action: 0

## Route Matrix

| Route | Auth | Rate Limit | Error Pattern | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `apps/api/src/app/api/ab-tests/[id]/results/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/ab-tests/[id]/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/ab-tests/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/admin/analytics/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/api-keys/[id]/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/api-keys/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/backup/download/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/backup/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/cache/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/content/pages/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/content/posts/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/dashboard/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/health/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/admin/logs/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/notifications/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/platform/analytics/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/platform/settings/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/platform/tenants/[id]/danger/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/admin/platform/tenants/[id]/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/admin/platform/tenants/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/platform/users/[id]/role/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/admin/reports/download/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/reports/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/security/ip-blocks/[id]/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/security/ip-blocks/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/security/sessions/[id]/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/admin/security/sessions/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/settings/route.ts` | yes | yes | yes | ok | admin-rate-limit, std-error |
| `apps/api/src/app/api/admin/users/[id]/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/admin/users/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/analytics/overview/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/analytics/timeline/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/auth/token/route.ts` | yes | yes | yes | ok | exempt, custom-rate-limit, std-error |
| `apps/api/src/app/api/builder/components/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/builder/layouts/[pageId]/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/dashboard/summary/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/docs/route.ts` | yes | yes | yes | ok | exempt |
| `apps/api/src/app/api/docs/ui/route.ts` | yes | yes | yes | ok | exempt |
| `apps/api/src/app/api/domains/[id]/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/domains/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/hr/applications/[id]/cv-url/route.ts` | yes | yes | yes | ok | exempt |
| `apps/api/src/app/api/hr/job-posts/[id]/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/hr/job-posts/check-slug/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/hr/job-posts/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/inbox/applications/[id]/read/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/applications/bulk-read/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/applications/export/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/applications/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/contact/[id]/read/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/contact/bulk-read/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/contact/export/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/contact/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/hr-applications/[id]/read/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/hr-applications/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/offers/[id]/read/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/offers/bulk-read/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/offers/export/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/inbox/offers/route.ts` | yes | yes | yes | ok | handler-factory |
| `apps/api/src/app/api/job-applications/[id]/cv-url/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/legal-texts/[id]/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/legal-texts/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/me/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/modules/[id]/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/modules/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/onboarding/tenant/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/pages/[id]/revisions/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/pages/[id]/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/pages/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/public/contact/submit/route.ts` | yes | yes | yes | ok | exempt, custom-rate-limit, std-error |
| `apps/api/src/app/api/public/hr/apply/route.ts` | yes | yes | yes | ok | exempt, custom-rate-limit, std-error |
| `apps/api/src/app/api/public/offer/submit/route.ts` | yes | yes | yes | ok | exempt, custom-rate-limit, std-error |
| `apps/api/src/app/api/publish/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/sites/[id]/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/sites/[id]/seo/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/sites/[id]/site-token/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/sites/[id]/vibe-brief/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/sites/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/tenant-members/[id]/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |
| `apps/api/src/app/api/tenant-members/invite/route.ts` | yes | yes | yes | ok | custom-rate-limit, std-error |
| `apps/api/src/app/api/tenant-members/route.ts` | yes | yes | yes | ok | auth-rate-limit, std-error |

## Notes

- `handler-factory` routes are covered indirectly by shared inbox/export handlers.
- `exempt` routes are public/docs/auth-exchange or compatibility redirects.
- `custom-rate-limit` means route uses `enforceRateLimit` directly instead of helper wrappers.
