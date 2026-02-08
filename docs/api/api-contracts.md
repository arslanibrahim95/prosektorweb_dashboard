# API Contracts (MVP)

> **Stack:** Next.js (App Router) + Supabase (Postgres + Auth + Storage)  
> **Error format standard:** `{code,message,details}`

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
- `kvkk_text` (offer/contact/hr/legal)

## Inbox

### `GET /api/inbox/offers?site_id={uuid}&date_from=&date_to=` (auth required)

Response: `{ items: OfferRequest[]; total: number }` (`/packages/contracts/inbox.ts`)

### `GET /api/inbox/contact?site_id={uuid}&date_from=&date_to=` (auth required)

Response: `{ items: ContactMessage[]; total: number }`

### `GET /api/inbox/hr-applications?site_id={uuid}&job_post_id={uuid?}&date_from=&date_to=` (auth required)

Response: `{ items: JobApplication[]; total: number }`

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
- domain changes
- role changes / user invite-remove
- module enable/disable
