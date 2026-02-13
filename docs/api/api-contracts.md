# API Contracts (MVP)

> **Stack:** Next.js (App Router) + Supabase (Postgres + Auth + Storage)
> **Error format standard:** `{code,message,details}`
> **Full Reference:** See [Dashboard API Contract](./dashboard-api-contract.md) for complete documentation

## Conventions

- Auth-required endpoints expect a valid Supabase session/JWT.
- Tenant isolation is enforced by DB RLS. Server still must scope all queries by `tenant_id`.
- Success responses are plain JSON objects (no envelope).
- Errors always use:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "email": ["Invalid email format"]
  }
}
```

Zod request/response schemas live under:
- `/packages/contracts/*.ts`

## Auth

### `GET /api/me` (auth required)

Response: `MeResponse` (`/packages/contracts/me.ts`)

## Sites

### `GET /api/sites` (auth required)

Response: `listSitesResponseSchema` (`/packages/contracts/sites.ts`)

### `POST /api/sites` (auth required)

Request: `createSiteRequestSchema`  
Response: `siteSchema`

### `GET /api/sites/:id` (auth required)

Response: `siteSchema`

### `PATCH /api/sites/:id` (auth required)

Request: `updateSiteRequestSchema`  
Response: `siteSchema`

### `GET /api/sites/:id/site-token` (auth required)

Returns a signed `site_token` for public forms.  
Response: `getSiteTokenResponseSchema`

## Pages

### `GET /api/pages?site_id={uuid}` (auth required)

Response: `listPagesResponseSchema` (`/packages/contracts/pages.ts`)

### `POST /api/pages` (auth required)

Request: `createPageRequestSchema`  
Response: `pageSchema`

### `PATCH /api/pages/:id` (auth required)

Request: `updatePageRequestSchema`  
Response: `pageSchema`

### `POST /api/pages/:id/revisions` (auth required)

Creates a new draft revision by providing ordered blocks.

Request: `createRevisionRequestSchema`  
Response: `pageRevisionSchema`

## Publish

### `POST /api/publish` (auth required)

Note: This endpoint publishes content internally to Supabase. For webhook-based deployments, see [Webhook Architecture](./webhook-architecture.md).

Request: `publishSiteRequestSchema` (`/packages/contracts/publish.ts`)  
Response: `publishSiteResponseSchema`

Rules (MVP):
- `environment=staging` publishes latest draft revisions as staging
- `environment=production` promotes staging -> production
- Audit log must be written for staging/prod publish

## Modules

### `GET /api/modules?site_id={uuid}` (auth required)

Response: array of `moduleInstanceSchema` (`/packages/contracts/modules.ts`)

### `PATCH /api/modules/:id` (auth required)

Request: `updateModuleInstanceRequestSchema`  
Response: `moduleInstanceSchema`

Settings (MVP):
- `recipients[]` (offer/contact/hr)
- `kvkk_legal_text_id` (offer/contact/hr)
- `kvkk_text` (legacy/back-compat; avoid for new wiring)

## Legal Texts

### `GET /api/legal-texts?type=&is_active=&page=&limit=` (auth required)

Response: `listLegalTextsResponseSchema` (`/packages/contracts/legal-texts.ts`)

### `POST /api/legal-texts` (auth required)

Request: `createLegalTextRequestSchema`  
Response: `legalTextSchema`

### `PATCH /api/legal-texts/:id` (auth required)

Request: `updateLegalTextRequestSchema`  
Response: `legalTextSchema`

### `DELETE /api/legal-texts/:id` (auth required)

Response: `legalTextSchema` (deleted row snapshot)

## Domains

### `GET /api/domains?site_id={uuid}` (auth required)

Response: `listDomainsResponseSchema` (`/packages/contracts/domains.ts`)

### `POST /api/domains` (auth required)

Request: `createDomainRequestSchema`  
Response: `domainSchema`

### `PATCH /api/domains/:id` (auth required)

Request: `updateDomainRequestSchema`  
Response: `domainSchema`

### `DELETE /api/domains/:id` (auth required)

Response: `domainSchema` (deleted row snapshot)

## Users & Roles

### `GET /api/tenant-members` (auth required)

Response: `listTenantMembersResponseSchema` (`/packages/contracts/tenant-members.ts`)

### `POST /api/tenant-members/invite` (auth required, owner/admin)

Request: `inviteTenantMemberRequestSchema`  
Response: `tenantMemberSchema`

### `PATCH /api/tenant-members/:id` (auth required, owner/admin)

Request: `updateTenantMemberRequestSchema`  
Response: `tenantMemberSchema`

### `DELETE /api/tenant-members/:id` (auth required, owner)

Response: `tenantMemberSchema` (deleted row snapshot)

## Dashboard

### `GET /api/dashboard/summary?site_id={uuid}` (auth required)

Response: `dashboardSummaryResponseSchema` (`/packages/contracts/dashboard.ts`)

## Inbox

### `GET /api/inbox/offers?site_id={uuid}&page=&limit=&search=&status=&date_from=&date_to=` (auth required)

Response: `{ items: OfferRequest[]; total: number }` (`/packages/contracts/inbox.ts`)

### `GET /api/inbox/contact?site_id={uuid}&page=&limit=&search=&status=&date_from=&date_to=` (auth required)

Response: `{ items: ContactMessage[]; total: number }`

### `GET /api/inbox/hr-applications?site_id={uuid}&job_post_id={uuid?}&page=&limit=&search=&status=&date_from=&date_to=` (auth required)

Response: `{ items: JobApplication[]; total: number }`

List endpoint constraints:
- `limit`: default `50`, max `100`
- `search`: optional, minimum `2` chars when provided
- Server may return rate-limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### `GET /api/inbox/offers/export?site_id={uuid}&...` (auth required)
### `GET /api/inbox/contact/export?site_id={uuid}&...` (auth required)
### `GET /api/inbox/applications/export?site_id={uuid}&...` (auth required)

CSV export constraints:
- `site_id` is required
- `limit`: default `1000`, max `2000`
- On rate-limit: `429` + `Retry-After` + `X-RateLimit-*` headers

### `PATCH /api/inbox/hr-applications/:id/read` (auth required)

Request: `markReadRequestSchema` (`/packages/contracts/inbox.ts`)  
Response: `jobApplicationSchema` (`/packages/contracts/inbox.ts`)

### `GET /api/job-applications/:id/cv-url` (auth required)

Returns a short-lived signed URL for a CV.  
Response: `getCvSignedUrlResponseSchema`

## HR Job Posts

### `GET /api/hr/job-posts?site_id={uuid}` (auth required)

Response: `listJobPostsResponseSchema` (`/packages/contracts/hr.ts`)

### `POST /api/hr/job-posts` (auth required)

Request: `createJobPostRequestSchema` (`/packages/contracts/hr.ts`)  
Response: `jobPostSchema`

### `PATCH /api/hr/job-posts/:id` (auth required)

Request: `updateJobPostRequestSchema` (`/packages/contracts/hr.ts`)  
Response: `jobPostSchema`

### `DELETE /api/hr/job-posts/:id` (auth required)

Soft delete (sets `deleted_at`). Audit log recommended.

## Public Submit (Rate Limit + Honeypot Required)

All public endpoints must:
- rate limit (example: `5 req / IP / hour`)
- require honeypot field to be empty
- require KVKK consent
- validate file type/size server-side

### `POST /api/public/offer/submit`

JSON request: `publicOfferSubmitSchema` (`/packages/contracts/public-submit.ts`)

### `POST /api/public/contact/submit`

JSON request: `publicContactSubmitSchema`

### `POST /api/public/hr/apply`

`multipart/form-data`:
- fields: `publicJobApplyFieldsSchema`
- file: `cv_file` validated with `cvFileSchema`

## Audit Coverage (MVP)

Audit log must record at minimum:
- publish (staging/prod)
- domain changes (create/update/delete)
- role changes / user invite-remove
- module enable/disable
