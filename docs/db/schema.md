# Database Schema (MVP)

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23
> **Backend:** Supabase Postgres + RLS + Storage policies  
> **Multi-tenant rule:** tenant isolation is mandatory.

## Files

- Migrations: `/packages/db/migrations/*.sql`
- RLS + Storage policies: `/packages/db/rls-policies.sql`

## Tenant Isolation Model

- `tenant_members` is the source of truth for authorization.
- All tenant-scoped tables have `tenant_id NOT NULL`.
- RLS policies use helper functions (created in `0002_rls.sql`):
  - `public.is_tenant_member(tenant_id)`
  - `public.has_tenant_role(tenant_id, roles[])`

## Tables (MVP)

Core:
- `tenants`
- `tenant_members`
- `sites`

Content:
- `pages`
- `page_revisions`
- `blocks`
- `page_blocks`
- `media`
- `menus`

Modules:
- `module_instances` (`offer`, `contact`, `hr`, `legal`)
- `offer_requests`
- `contact_messages`
- `job_posts`
- `job_applications` (`cv_path`, `kvkk_accepted_at`)
- `legal_texts`
- `ab_tests`
- `ab_test_metrics`

Audit:
- `audit_logs`

Domains:
- `domains`

## Publish Model (MVP)

`pages` has optional pointers:
- `draft_revision_id`
- `staging_revision_id`
- `published_revision_id`

Server actions decide how to advance these pointers and write audit logs.

## Storage Policy (CV + Media)

Buckets:

- `public-media` (site images/assets)
- `private-cv` (HR CV uploads)

Object key convention:
- Media: `tenant_<tenant_id>/media/<timestamp>_<filename>`
- CV: `tenant_<tenant_id>/cv/<timestamp>_<filename>`

Rules:
- CV objects are readable only by members of the matching tenant.
- Media objects are readable by everyone; writable by `owner/admin/editor`.

## Quality Gates (Backend)

### Gate-0: Tenant Isolation Test Scenario

Goal: Tenant A cannot read/write Tenant B rows via RLS.

Scenario:
1. Create Tenant A + owner user A
2. Create Tenant B + owner user B
3. With user A session:
   - `SELECT * FROM pages WHERE tenant_id = tenantB` returns 0 rows
   - `SELECT * FROM sites WHERE tenant_id = tenantB` returns 0 rows
   - Any direct update attempt on Tenant B rows fails (RLS)

### Gate-4: CV Access Test Scenario

Goal: CV files are only accessible by the related tenant.

Scenario:
1. Upload CV object for Tenant A under:
   - `tenant_<tenantA>/cv/<file>`
2. As Tenant A member:
   - signed URL generation succeeds
   - download succeeds
3. As Tenant B member:
   - signed URL generation fails with 403 (or download denied)
4. Validation:
   - `.exe` upload rejected (400)
   - `>5MB` upload rejected (400)

## Audit Log (Critical Actions)

At minimum:
- publish to staging / production
- domain changes
- role change, invite/remove member
- module enable/disable
