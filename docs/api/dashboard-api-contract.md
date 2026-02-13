# Dashboard API Contract

> **Version:** 1.0.0
> **Base URL:** `https://dashboard.example.com/api`
> **Stack:** Next.js (App Router) + Supabase (Postgres + Auth + Storage)

## Overview

This document describes the Dashboard API for the ProsektorWeb platform. The Dashboard API provides endpoints for:

- Site and page management (CMS)
- Publishing (staging/production)
- Module configuration (Offer, Contact, HR, Legal)
- Inbox management (submissions, applications)
- HR job posts
- Domain management
- User/tenant management
- Public form submissions (with `site_token`)

## Authentication

### Dashboard Endpoints

All endpoints under `/api/*` (except `/api/public/*`) require authentication.

**Methods:**
1. **Bearer Token:** Include `Authorization: Bearer <token>` header
2. **Cookie-based:** Session cookies from Supabase Auth

**Token Source:** Supabase JWT (user session or custom JWT)

**Auth Context:**
```typescript
interface AuthContext {
  user: { id: string; email: string; name: string; avatar_url?: string };
  tenant: { id: string; name: string; slug: string; plan: "demo" | "starter" | "pro" };
  role: "super_admin" | "owner" | "admin" | "editor" | "viewer";
  permissions: string[];
}
```

### Public Endpoints

Public form endpoints (`/api/public/*`) use `site_token` JWT signed with `SITE_TOKEN_SECRET`.

**Authorization Header:** `Authorization: Bearer <site_token>`

## Error Response Format

All errors follow this structure:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "email": ["Invalid email format"]
  }
}
```

### Error Codes

| Code | Category | HTTP Status |
|------|----------|-------------|
| `UNAUTHORIZED` | Auth | 401 |
| `FORBIDDEN` | Auth | 403 |
| `TOKEN_EXPIRED` | Auth | 401 |
| `VALIDATION_ERROR` | Validation | 400 |
| `INVALID_UUID` | Validation | 400 |
| `NOT_FOUND` | Not Found | 404 |
| `SITE_NOT_FOUND` | Not Found | 404 |
| `PAGE_NOT_FOUND` | Not Found | 404 |
| `CONFLICT` | Business Logic | 409 |
| `INVALID_STATE` | Business Logic | 409 |
| `SLUG_EXISTS` | Business Logic | 409 |
| `MODULE_DISABLED` | Business Logic | 404 |
| `INTERNAL_ERROR` | Server | 500 |
| `DATABASE_ERROR` | Server | 500 |
| `RATE_LIMITED` | Rate Limiting | 429 |

## Rate Limiting

### Dashboard Endpoints

| Category | Limit | Window | Headers |
|----------|-------|--------|---------|
| Read Operations | 120 | 60 sec | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| Search | 30 | 60 sec | Same |
| Export | 3 | 600 sec | `Retry-After` on 429 |

### Public Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/public/*` | 5 | 3600000 ms (1 hour) |

**Rate limit by:** IP address

---

## Endpoints

### Authentication

#### `GET /api/me`

Get current user and tenant information.

**Auth Required:** Yes

**Response:**
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: "demo" | "starter" | "pro";
  };
  role: UserRole;
  permissions: string[];
}
```

#### `POST /api/auth/token`

Exchange credentials for tokens.

**Auth Required:** No (login endpoint)

**Request:**
```typescript
{
  rememberMe?: boolean;
}
```

**Response:**
```typescript
{
  access_token: string;
  refresh_token?: string;
  expires_at: string; // ISO datetime
  token_type: "Bearer";
}
```

---

### Sites

#### `GET /api/sites`

List all sites for the current tenant.

**Auth Required:** Yes

**Query Params:** None (tenant isolated by auth)

**Response:**
```typescript
{
  items: Site[];
  total: number;
}

type Site = {
  id: string; // uuid
  tenant_id: string;
  name: string; // 1-200 chars
  status: "draft" | "staging" | "published";
  primary_domain?: string; // 1-255 chars
  settings: Record<string, unknown>;
  created_at: string; // ISO datetime
  updated_at: string;
};
```

#### `POST /api/sites`

Create a new site.

**Auth Required:** Yes

**Request:**
```typescript
{
  name: string; // 1-200 chars
  primary_domain?: string; // 1-255 chars
  settings?: Record<string, unknown>;
}
```

**Response:** `Site`

#### `GET /api/sites/[id]`

Get a single site by ID.

**Auth Required:** Yes

**Response:** `Site`

#### `PATCH /api/sites/[id]`

Update a site.

**Auth Required:** Yes

**Request:**
```typescript
{
  name?: string; // 1-200 chars
  primary_domain?: string | null; // 1-255 chars
  settings?: Record<string, unknown>;
}
```

**Response:** `Site`

#### `GET /api/sites/[id]/site-token`

Generate a `site_token` JWT for public form authentication.

**Auth Required:** Yes

**Response:**
```typescript
{
  site_token: string;
  expires_at: string; // ISO datetime
}
```

---

### SEO Settings

#### `GET /api/sites/[id]/seo`

Get SEO settings for a site.

**Auth Required:** Yes

**Response:**
```typescript
{
  title_template: string; // default: "%s | %s"
  default_description?: string; // max 160 chars
  og_image?: string; // max 500 chars
  robots_txt?: string; // max 5000 chars
  json_ld?: Record<string, unknown>;
}
```

#### `PATCH /api/sites/[id]/seo`

Update SEO settings.

**Auth Required:** Yes

**Request:** (same as GET response, all fields optional)

**Response:** Same as GET response

---

### Pages

#### `GET /api/pages`

List pages for a site.

**Auth Required:** Yes

**Query Params:**
- `site_id` (string, uuid) - **Required**

**Response:**
```typescript
{
  items: Page[];
  total: number;
}

type Page = {
  id: string;
  tenant_id: string;
  site_id: string;
  slug: string; // 0-200 chars, regex: /^[a-z0-9-]*$/
  title: string; // 1-200 chars
  status: "draft" | "staging" | "published";
  seo: {
    title?: string; // max 60 chars
    description?: string; // max 160 chars
    og_image?: string; // URL
  };
  order_index: number;
  draft_revision_id?: string;
  staging_revision_id?: string;
  published_revision_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};
```

#### `POST /api/pages`

Create a new page.

**Auth Required:** Yes

**Request:**
```typescript
{
  site_id: string;
  title: string; // 1-100 chars
  slug: string; // regex: /^[a-z0-9-]*$/ (empty for homepage)
  seo?: {
    title?: string;
    description?: string;
    og_image?: string;
  };
  order_index?: number;
}
```

**Response:** `Page`

#### `PATCH /api/pages/[id]`

Update a page.

**Auth Required:** Yes

**Request:**
```typescript
{
  title?: string; // 1-100 chars
  slug?: string; // regex: /^[a-z0-9-]*$/
  status?: "draft" | "staging" | "published";
  seo?: { title?: string; description?: string; og_image?: string; };
  order_index?: number;
}
```

**Response:** `Page`

#### `GET /api/pages/[id]/revisions`

List revisions for a page.

**Auth Required:** Yes

**Response:**
```typescript
{
  items: PageRevision[];
  total: number;
}

type PageRevision = {
  id: string;
  tenant_id: string;
  page_id: string;
  meta: Record<string, unknown>;
  created_at: string;
  created_by?: string;
  blocks?: Block[];
};

type Block = {
  id: string;
  type: string; // 1-64 chars
  props: Record<string, unknown>;
};
```

#### `POST /api/pages/[id]/revisions`

Create a new draft revision.

**Auth Required:** Yes

**Request:**
```typescript
{
  blocks: Block[]; // min 0 items
}
```

**Response:** `PageRevision`

---

### Publish

#### `POST /api/publish`

Publish a site to staging or production.

**Auth Required:** Yes

**Authorization Rules:**
- `viewer`: **Forbidden**
- `editor`: **Staging only**
- `admin`/`owner`: **Both staging and production**

**Request:**
```typescript
{
  site_id: string;
  environment: "staging" | "production";
}
```

**Response:**
```typescript
{
  site_id: string;
  environment: "staging" | "production";
  published_at: string; // ISO datetime
}
```

**Behavior:**
- `staging`: Promotes all draft revisions to staging, sets site status to `staging`
- `production`: Promotes staging revisions to production, requires site status to be `staging` first
- Audit log is written for all publish operations

---

### Modules

#### `GET /api/modules`

List module instances for a site.

**Auth Required:** Yes

**Query Params:**
- `site_id` (string, uuid) - **Required**

**Response:**
```typescript
{
  items: ModuleInstance[];
  total: number;
}

type ModuleInstance = {
  id: string;
  tenant_id: string;
  site_id: string;
  module_key: "offer" | "contact" | "hr" | "legal";
  enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
```

#### `PATCH /api/modules/[id]`

Update a module instance.

**Auth Required:** Yes

**Request:**
```typescript
{
  enabled?: boolean;
  settings?: Record<string, unknown>;
}
```

**Settings by Module Type:**

**Offer:**
```typescript
{
  recipients: string[]; // email addresses
  success_message?: string; // 1-2000 chars
  kvkk_legal_text_id?: string; // uuid
  kvkk_text?: string; // 1-20000 chars (legacy)
}
```

**Contact:**
```typescript
{
  recipients: string[];
  address?: string; // 1-500 chars
  phones: string[]; // 1-50 chars each
  emails: string[];
  map_embed_url?: string; // 1-2000 chars
  success_message?: string;
  kvkk_legal_text_id?: string;
  kvkk_text?: string;
}
```

**HR:**
```typescript
{
  recipients: string[];
  kvkk_legal_text_id?: string;
  kvkk_text?: string;
  max_file_size_mb?: number; // 1-50, default 5
  allowed_mime_types?: string[]; // default: PDF, DOC, DOCX
}
```

**Legal:**
```typescript
{
  kvkk_text?: string; // 1-20000 chars
  disclosure_text?: string;
}
```

**Response:** `ModuleInstance`

---

### Legal Texts

#### `GET /api/legal-texts`

List legal texts for the current tenant.

**Auth Required:** Yes

**Query Params:**
- `type` (optional) - `"kvkk" | "consent" | "terms" | "privacy" | "disclosure"`
- `is_active` (optional) - boolean
- `page` (optional) - number, default 1
- `limit` (optional) - number, 1-200, default 50

**Response:**
```typescript
{
  items: LegalText[];
  total: number;
}

type LegalText = {
  id: string;
  tenant_id: string;
  title: string; // 1-200 chars
  type: "kvkk" | "consent" | "terms" | "privacy" | "disclosure";
  content: string; // 1-20000 chars
  version: number; // min 1
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
```

#### `POST /api/legal-texts`

Create a new legal text.

**Auth Required:** Yes

**Request:**
```typescript
{
  title: string; // 1-200 chars
  type: "kvkk" | "consent" | "terms" | "privacy" | "disclosure";
  content: string; // 1-20000 chars
  is_active?: boolean;
}
```

**Response:** `LegalText`

#### `PATCH /api/legal-texts/[id]`

Update a legal text.

**Auth Required:** Yes

**Request:** (same as POST, all fields optional)

**Response:** `LegalText`

#### `DELETE /api/legal-texts/[id]`

Soft delete a legal text.

**Auth Required:** Yes

**Response:** `LegalText` (deleted row snapshot)

---

### Domains

#### `GET /api/domains`

List domains for a site.

**Auth Required:** Yes

**Query Params:**
- `site_id` (string, uuid) - **Required**

**Response:**
```typescript
{
  items: Domain[];
  total: number;
}

type Domain = {
  id: string;
  tenant_id: string;
  site_id: string;
  domain: string; // validated format
  status: "pending" | "verified" | "active" | "failed";
  ssl_status: string; // 1-64 chars
  is_primary: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;
};
```

#### `POST /api/domains`

Add a domain to a site.

**Auth Required:** Yes

**Request:**
```typescript
{
  site_id: string;
  domain: string; // validated format
  is_primary?: boolean;
}
```

**Response:** `Domain`

#### `PATCH /api/domains/[id]`

Update a domain.

**Auth Required:** Yes

**Request:**
```typescript
{
  is_primary?: boolean;
}
```

**Response:** `Domain`

#### `DELETE /api/domains/[id]`

Remove a domain.

**Auth Required:** Yes

**Response:** `Domain` (deleted row snapshot)

---

### Tenant Members

#### `GET /api/tenant-members`

List members of the current tenant.

**Auth Required:** Yes

**Response:**
```typescript
{
  items: TenantMember[];
  total: number;
}

type TenantMember = {
  id: string;
  tenant_id: string;
  user_id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  created_at: string;
  user?: {
    id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    invited_at?: string;
    last_sign_in_at?: string;
  };
}
```

#### `POST /api/tenant-members/invite`

Invite a user to the tenant.

**Auth Required:** Yes (admin/owner only)

**Request:**
```typescript
{
  email: string;
  role: "admin" | "editor" | "viewer";
}
```

**Response:** `TenantMember`

#### `PATCH /api/tenant-members/[id]`

Update a member's role.

**Auth Required:** Yes (admin/owner only)

**Request:**
```typescript
{
  role: "owner" | "admin" | "editor" | "viewer";
}
```

**Response:** `TenantMember`

#### `DELETE /api/tenant-members/[id]`

Remove a member from the tenant.

**Auth Required:** Yes (owner only)

**Response:** `TenantMember` (deleted row snapshot)

---

### Dashboard

#### `GET /api/dashboard/summary`

Get dashboard summary for a site.

**Auth Required:** Yes

**Query Params:**
- `site_id` (string, uuid) - **Required**

**Response:**
```typescript
{
  totals: {
    offers: number;
    contacts: number;
    applications: number;
  };
  active_job_posts_count: number;
  primary_domain_status: {
    status: string;
    ssl_status: string;
  } | null;
  recent_activity: {
    id: string;
    type: "offer" | "contact" | "application";
    name: string; // 1-200 chars
    detail: string; // 1-200 chars
    created_at: string;
  }[];
}
```

---

### Inbox

#### `GET /api/inbox/offers`

List offer requests for a site.

**Auth Required:** Yes

**Query Params:**
- `site_id` (string, uuid) - **Required**
- `page` (optional) - number
- `limit` (optional) - number, default 50, max 100
- `search` (optional) - string, min 2 chars
- `status` (optional) - string
- `date_from` (optional) - ISO date
- `date_to` (optional) - ISO date

**Response:**
```typescript
{
  items: OfferRequest[];
  total: number;
}

type OfferRequest = {
  id: string;
  tenant_id: string;
  site_id: string;
  full_name: string; // 2-100 chars
  email: string;
  phone: string; // 10-20 chars
  company_name?: string; // max 200 chars
  message?: string; // max 2000 chars
  kvkk_accepted_at: string; // ISO datetime
  source: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};
```

#### `GET /api/inbox/contact`

List contact messages for a site.

**Auth Required:** Yes

**Query Params:** Same as `/api/inbox/offers`

**Response:**
```typescript
{
  items: ContactMessage[];
  total: number;
}

type ContactMessage = {
  id: string;
  tenant_id: string;
  site_id: string;
  full_name: string; // 2-100 chars
  email: string;
  phone: string; // 10-20 chars
  subject?: string; // max 200 chars
  message: string; // 1-5000 chars
  kvkk_accepted_at: string;
  source: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};
```

#### `GET /api/inbox/hr-applications`

List job applications for a site.

**Auth Required:** Yes

**Query Params:**
- `site_id` (string, uuid) - **Required**
- `job_post_id` (optional) - uuid
- `page`, `limit`, `search`, `status`, `date_from`, `date_to` - same as offers

**Response:**
```typescript
{
  items: JobApplication[];
  total: number;
}

type JobApplication = {
  id: string;
  tenant_id: string;
  site_id: string;
  job_post_id: string;
  job_post?: {
    id: string;
    title: string;
  };
  full_name: string;
  email: string;
  phone: string;
  message?: string;
  cv_path: string;
  cv_file_name?: string;
  kvkk_accepted_at: string;
  is_read: boolean;
  created_at: string;
};
```

#### `PATCH /api/inbox/hr-applications/[id]/read`

Mark an application as read/unread.

**Auth Required:** Yes

**Request:**
```typescript
{
  is_read: boolean;
}
```

**Response:** `JobApplication`

#### `GET /api/inbox/offers/export`

Export offer requests as CSV.

**Auth Required:** Yes

**Query Params:** Same as list endpoint
- `limit` - default 1000, max 2000

**Response:** CSV file with `Content-Type: text/csv`

**Rate Limit:** 3 requests per 10 minutes

#### `GET /api/inbox/contact/export`

Export contact messages as CSV.

**Auth Required:** Yes

**Query Params:** Same as list endpoint
**Rate Limit:** 3 requests per 10 minutes

#### `GET /api/job-applications/[id]/cv-url`

Get a short-lived signed URL for a CV file.

**Auth Required:** Yes

**Response:**
```typescript
{
  url: string;
  expires_at: string; // ISO datetime
}
```

---

### HR Job Posts

#### `GET /api/hr/job-posts`

List job posts for a site.

**Auth Required:** Yes

**Query Params:**
- `site_id` (string, uuid) - **Required**
- `include_deleted` (optional) - boolean

**Response:**
```typescript
{
  items: JobPost[];
  total: number;
}

type JobPost = {
  id: string;
  tenant_id: string;
  site_id: string;
  title: string; // 1-200 chars
  slug: string; // 1-200 chars
  location?: string; // max 200 chars
  employment_type?: "full-time" | "part-time" | "contract";
  description?: unknown;
  requirements?: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  applications_count?: number;
};
```

#### `POST /api/hr/job-posts`

Create a new job post.

**Auth Required:** Yes

**Request:**
```typescript
{
  site_id: string;
  title: string; // 1-200 chars
  slug: string; // regex: /^[a-z0-9-]+$/
  location?: string;
  employment_type?: "full-time" | "part-time" | "contract";
  description?: unknown;
  requirements?: unknown;
  is_active?: boolean;
}
```

**Response:** `JobPost`

#### `PATCH /api/hr/job-posts/[id]`

Update a job post.

**Auth Required:** Yes

**Request:**
```typescript
{
  title?: string;
  slug?: string;
  location?: string | null;
  employment_type?: "full-time" | "part-time" | "contract" | null;
  description?: unknown | null;
  requirements?: unknown | null;
  is_active?: boolean;
}
```

**Response:** `JobPost`

#### `DELETE /api/hr/job-posts/[id]`

Soft delete a job post.

**Auth Required:** Yes

**Response:** `JobPost` (deleted row snapshot)

---

### Public Form Submissions

Public endpoints use `site_token` for authentication. The token is obtained from `/api/sites/[id]/site-token`.

#### `POST /api/public/offer/submit`

Submit an offer request.

**Auth:** `site_token` JWT in `Authorization: Bearer <token>` header

**Request:**
```typescript
{
  site_token: string;
  full_name: string; // 2-100 chars
  email: string;
  phone: string; // 10-20 chars
  company_name?: string; // max 200 chars
  message?: string; // max 2000 chars
  kvkk_consent: true;
  honeypot: string; // MUST be empty (anti-bot)
}
```

**Response:**
```typescript
{
  id: string; // uuid
}
```

**Validations:**
- Honeypot field must be empty
- Rate limited: 5 requests per IP per hour
- KVKK consent must be `true`

#### `POST /api/public/contact/submit`

Submit a contact message.

**Auth:** `site_token` JWT

**Request:**
```typescript
{
  site_token: string;
  full_name: string; // 2-100 chars
  email: string;
  phone: string; // 10-20 chars
  subject?: string; // max 200 chars
  message: string; // 1-5000 chars
  kvkk_consent: true;
  honeypot: string; // MUST be empty
}
```

**Response:**
```typescript
{
  id: string;
}
```

**Validations:** Same as offer submit

#### `POST /api/public/hr/apply`

Submit a job application with CV.

**Auth:** `site_token` JWT

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `site_token`: string
- `job_post_id`: string (uuid)
- `full_name`: string (2-100 chars)
- `email`: string
- `phone`: string (10-20 chars)
- `message`: string (optional, max 2000 chars)
- `kvkk_consent`: "true"
- `honeypot`: string (MUST be empty)
- `cv_file`: File (PDF, DOC, DOCX, max 5MB)

**Response:**
```typescript
{
  id: string;
}
```

**Validations:**
- Honeypot must be empty
- File type: PDF, DOC, or DOCX
- File size: max 5MB (configurable via `MAX_CV_FILE_SIZE_MB`)
- Rate limited: 5 requests per IP per hour

---

## Environment Variables

### Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

### Site Token (Public Forms)

```bash
SITE_TOKEN_SECRET=your-site-token-secret
```

### Rate Limiting

```bash
# Public forms
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=60000

# Dashboard operations
DASHBOARD_READ_RL_LIMIT=120
DASHBOARD_READ_RL_WINDOW_SEC=60
DASHBOARD_SEARCH_RL_LIMIT=30
DASHBOARD_SEARCH_RL_WINDOW_SEC=60
DASHBOARD_EXPORT_RL_LIMIT=3
DASHBOARD_EXPORT_RL_WINDOW_SEC=600
```

### Storage

```bash
MAX_CV_FILE_SIZE_MB=5
MAX_MEDIA_FILE_SIZE_MB=10
STORAGE_BUCKET_PRIVATE_CV=private-cv
STORAGE_BUCKET_PUBLIC_MEDIA=public-media
```

### App Config

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=ProsektorWeb Dashboard
```

---

## Webhook Architecture (Future)

The Dashboard API currently handles publishing internally via Supabase. Future versions may support webhooks for external integrations:

**Planned Flow:**
1. Site publish triggered via `/api/publish`
2. Dashboard updates Supabase (current behavior)
3. **Future:** Dashboard sends webhook to Site-Engine
4. Site-Engine validates and deploys

**Planned Headers:**
```
X-Webhook-Signature: sha256=<signature>
X-Webhook-Timestamp: <unix-timestamp>
X-Webhook-Id: <uuid>
```

**Planned Payload:**
```typescript
{
  event: "site.published";
  site_id: string;
  environment: "staging" | "production";
  published_at: string; // ISO datetime
  data: {
    site: Site;
    pages: Page[];
  };
}
```

---

## Schemas Reference

All TypeScript schemas are exported from `@prosektor/contracts` package:

| File | Exports |
|------|---------|
| `auth.ts` | `loginRequestSchema`, `tokenExchangeResponseSchema`, `sessionInfoSchema`, etc. |
| `common.ts` | `uuidSchema`, `isoDateTimeSchema`, `userRoleSchema`, etc. |
| `sites.ts` | `siteSchema`, `createSiteRequestSchema`, `seoSettingsSchema`, etc. |
| `pages.ts` | `pageSchema`, `createPageRequestSchema`, `pageRevisionSchema`, etc. |
| `publish.ts` | `publishSiteRequestSchema`, `publishSiteResponseSchema` |
| `modules.ts` | `moduleInstanceSchema`, `updateModuleInstanceRequestSchema`, etc. |
| `inbox.ts` | `offerRequestSchema`, `contactMessageSchema`, `jobApplicationSchema`, etc. |
| `hr.ts` | `jobPostSchema`, `createJobPostRequestSchema`, etc. |
| `domains.ts` | `domainSchema`, `createDomainRequestSchema`, etc. |
| `tenant-members.ts` | `tenantMemberSchema`, `inviteTenantMemberRequestSchema`, etc. |
| `legal-texts.ts` | `legalTextSchema`, `createLegalTextRequestSchema`, etc. |
| `dashboard.ts` | `dashboardSummaryResponseSchema`, etc. |
| `public-submit.ts` | `publicOfferSubmitSchema`, `publicContactSubmitSchema`, etc. |
| `error.ts` | `apiErrorSchema` |

---

## Auditing

The following actions are logged to the `audit_logs` table:

| Action | Entity | Details |
|--------|--------|---------|
| `publish` | `site` | `{ environment: "staging" \| "production" }` |
| Domain CRUD | `domain` | Changes snapshot |
| Role changes | `tenant_member` | Old/new role |
| User invite/remove | `tenant_member` | User details |
| Module enable/disable | `module_instance` | Enabled state |

**Audit Log Schema:**
```typescript
{
  id: string;
  tenant_id: string;
  actor_id: string; // user who performed the action
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}
```
