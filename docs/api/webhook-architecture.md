# Webhook Architecture

> **Status:** Planned (Future Implementation)
> **Version:** 1.0.0-draft

## Overview

This document describes the planned webhook architecture for integrating the Dashboard API with external Site-Engine deployments.

## Current State

**Current Behavior:** The Dashboard API (`/api/publish`) updates Supabase directly. Site content is stored and versioned in Supabase, but deployment is handled internally.

**Planned Behavior:** After publishing, the Dashboard will send webhooks to configured Site-Engine endpoints to trigger deployments.

---

## Webhook Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────────┐
│  Dashboard  │────────>│  Supabase   │────────>│   Audit Logs     │
│    API      │         │  (Primary)   │         └─────────────────┘
└──────┬──────┘
       │
       │ POST /api/publish
       │
       v
┌─────────────────────────────────────┐
│         Webhook Service              │
│  (to be implemented)                 │
├─────────────────────────────────────┤
│ • Queue publish events              │
│ • Sign webhook payload              │
│ • Retry with exponential backoff    │
│ • Log delivery status               │
└─────────────┬───────────────────────┘
              │
              │ HTTP POST
              │ with signature
              v
┌─────────────────────────────────────┐
│       Site-Engine Endpoint           │
│  /api/webhooks/dashboard/publish    │
├─────────────────────────────────────┤
│ • Verify signature                  │
│ • Deploy content                   │
│ • Respond 200 on success           │
└─────────────────────────────────────┘
```

---

## Webhook Payload

### Publish Event

**Trigger:** `POST /api/publish` succeeds

**Event Type:** `site.published`

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: sha256=<hex-signature>
X-Webhook-Timestamp: <unix-timestamp>
X-Webhook-Id: <uuid-v4>
X-Webhook-Event: site.published
User-Agent: ProsektorWeb-Dashboard/1.0
```

**Body:**
```typescript
{
  id: string;              // webhook delivery UUID
  event: "site.published";
  timestamp: string;        // ISO datetime
  site_id: string;
  tenant_id: string;
  environment: "staging" | "production";
  published_at: string;     // ISO datetime
  published_by: {
    id: string;
    email: string;
    name: string;
  };
  data: {
    site: {
      id: string;
      name: string;
      primary_domain?: string;
      status: string;
      settings: Record<string, unknown>;
    };
    pages: Array<{
      id: string;
      slug: string;
      title: string;
      status: string;
      seo?: {
        title?: string;
        description?: string;
        og_image?: string;
      };
      revision?: {
        id: string;
        blocks: Array<{
          id: string;
          type: string;
          props: Record<string, unknown>;
        }>;
      };
    }>;
    modules: Array<{
      id: string;
      module_key: string;
      enabled: boolean;
      settings: Record<string, unknown>;
    }>;
  };
}
```

### Expected Site-Engine Response

**Success:** `200 OK` or `202 Accepted`

**Success Body (optional):**
```typescript
{
  status: "accepted" | "deployed";
  deployment_id?: string;
  deployment_url?: string;
  message?: string;
}
```

**Error Responses:**
```typescript
// Validation error (4xx)
{
  error: "invalid_payload";
  message: string;
  details?: Record<string, unknown>;
}

// Temporary error (5xx) - will retry
{
  error: "deployment_failed";
  message: string;
  retry_after?: number; // seconds
}
```

---

## Signature Verification

### Dashboard (Sender)

```typescript
import { createHmac } from 'crypto';

const webhookSecret = process.env.WEBHOOK_SECRET;
const payload = JSON.stringify(webhookData);
const timestamp = Math.floor(Date.now() / 1000);

const signatureBase = `${timestamp}.${payload}`;
const signature = createHmac('sha256', webhookSecret)
  .update(signatureBase)
  .digest('hex');
```

**Header Format:** `sha256=${signature}`

### Site-Engine (Receiver)

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhook(
  payload: string,
  signature: string,
  timestamp: number
): boolean {
  const webhookSecret = process.env.WEBHOOK_SECRET;

  // Check timestamp (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) { // 5 minutes
    return false;
  }

  // Verify signature
  const signatureBase = `${timestamp}.${payload}`;
  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(signatureBase)
    .digest('hex');

  const providedSignature = signature.replace('sha256=', '');

  return timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature)
  );
}
```

---

## Retry Strategy

| Attempt | Delay    | Max Timeout |
|---------|----------|-------------|
| 1       | 1s       | 5s          |
| 2       | 5s       | 10s         |
| 3       | 30s      | 30s         |
| 4       | 2min     | 60s         |
| 5       | 10min    | 120s        |

**Total retry window:** ~15 minutes

**Final Failure:** Webhook marked as `failed`, admin notified

---

## Webhook Configuration

### Database Schema (Planned)

```sql
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['site.published'],
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_code INTEGER,
  response_body JSONB,
  delivered_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'pending', 'delivered', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_status
  ON webhook_deliveries(status, next_retry_at)
  WHERE status IN ('pending', 'retrying');
```

### API Endpoints (Planned)

#### `GET /api/webhooks`

List webhook endpoints for a site.

**Auth Required:** Yes

#### `POST /api/webhooks`

Create a webhook endpoint.

**Auth Required:** Yes (admin/owner)

**Request:**
```typescript
{
  site_id?: string;
  url: string;
  events?: Array<"site.published" | "site.updated">;
  secret?: string; // auto-generated if not provided
}
```

#### `PATCH /api/webhooks/[id]`

Update a webhook endpoint.

**Auth Required:** Yes (admin/owner)

**Request:**
```typescript
{
  url?: string;
  events?: Array<string>;
  is_active?: boolean;
}
```

#### `POST /api/webhooks/[id]/rotate-secret`

Rotate the webhook secret.

**Auth Required:** Yes (admin/owner)

**Response:**
```typescript
{
  secret: string; // new secret
}
```

#### `GET /api/webhooks/[id]/deliveries`

List delivery history for a webhook.

**Auth Required:** Yes

#### `POST /api/webhooks/[id]/deliveries/[id]/retry`

Manually retry a failed webhook delivery.

**Auth Required:** Yes (admin/owner)

---

## Environment Variables

```bash
# Webhook signing secret (for outbound webhooks)
WEBHOOK_SECRET=your-webhook-secret-min-32-chars

# Webhook delivery
WEBHOOK_TIMEOUT_MS=30000
WEBHOOK_MAX_RETRIES=5
WEBHOOK_RETRY_BASE_DELAY_MS=1000
```

---

## Security Considerations

1. **HTTPS Only:** Webhooks are only delivered to HTTPS endpoints
2. **Signature Verification:** All payloads are signed with HMAC-SHA256
3. **Timestamp Check:** Reject webhooks older than 5 minutes
4. **Secret Rotation:** Support secret rotation without downtime
5. **Idempotency:** Webhook IDs are UUID v4; receivers should deduplicate
6. **Rate Limiting:** Site-Engine should implement rate limiting on webhook endpoints

---

## Migration Path

### Phase 1: Internal (Current)
- Publish updates Supabase only
- No webhooks

### Phase 2: Optional Webhooks (Planned)
- Webhook endpoints table created
- Webhooks sent on publish (non-blocking)
- Delivery tracked separately

### Phase 3: Full Integration (Future)
- Webhooks become primary deployment trigger
- Site-Engine confirms deployment
- Dashboard reflects deployment status

---

## Testing Webhooks Locally

For development, use a webhook tunnel service:

```bash
# Using ngrok
ngrok http 3000

# Add webhook endpoint pointing to:
# https://abc123.ngrok.io/api/webhooks/dashboard/publish
```

**Test payload:**
```bash
curl -X POST https://abc123.ngrok.io/api/webhooks/dashboard/publish \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=..." \
  -H "X-Webhook-Timestamp: $(date +%s)" \
  -d @test-payload.json
```
