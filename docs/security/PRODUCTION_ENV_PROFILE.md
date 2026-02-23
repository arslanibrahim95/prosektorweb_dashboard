# Production Security Env Profile

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

## Scope

This document defines recommended production values for:
- `TRUSTED_PROXY_COUNT`
- `AV_SCAN_ENABLED`
- `AV_SCAN_FAIL_CLOSED`
- `CLAMAV_*`

These settings are consumed by the API service and are now wired in `docker-compose.yml`.

## Recommended Profile (Current Repo Topology)

Current topology in this repo:
- Internet -> `nginx` (container) -> `api` (container)

Template files:
- `deploy/env/prod.security.env.example`
- `deploy/env/prod.strict.env.example`

Nginx forwards:
- `X-Forwarded-For: $remote_addr`
- `X-Real-IP: $remote_addr`

For this topology, use:

```bash
TRUSTED_PROXY_COUNT=0
AV_SCAN_ENABLED=true
AV_SCAN_FAIL_CLOSED=false
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
CLAMAV_TIMEOUT_MS=2500
```

### Why
- `TRUSTED_PROXY_COUNT=0`:
  - API already receives a single nearest-hop address from Nginx (`$remote_addr`).
  - No extra hop skipping is needed.
- `AV_SCAN_ENABLED=true`:
  - Enables runtime ClamAV scan for uploaded CV files.
- `AV_SCAN_FAIL_CLOSED=false` (recommended initial rollout):
  - Upload flow stays available if scanner is temporarily unavailable.
  - Security still has MIME/signature/extension validation as baseline.

## Strict Profile (After AV SLO Stabilization)

Switch to strict mode when ClamAV availability is proven in production.

```bash
TRUSTED_PROXY_COUNT=0
AV_SCAN_ENABLED=true
AV_SCAN_FAIL_CLOSED=true
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
CLAMAV_TIMEOUT_MS=2500
```

Strict template:
- `deploy/env/prod.strict.env.example`

Use strict mode when:
- ClamAV is deployed with redundancy/health checks.
- Operational team can handle scanner outages quickly.

## Other Topologies

Use this rule for `TRUSTED_PROXY_COUNT`:
- Set it to the number of trusted proxy hops you want to skip from the **right side** of `X-Forwarded-For`.
- Example chain: `client, proxy-a, proxy-b` (where `proxy-b` is nearest to API)
  - `TRUSTED_PROXY_COUNT=0` -> selects `proxy-b`
  - `TRUSTED_PROXY_COUNT=1` -> selects `proxy-a`
  - `TRUSTED_PROXY_COUNT=2` -> selects `client`

If you use Cloudflare:
- Prefer `cf-connecting-ip` pass-through from edge/proxy.
- The API already prioritizes `cf-connecting-ip` over `x-forwarded-for`.

## Rollout Plan

1. Deploy with `AV_SCAN_FAIL_CLOSED=false`.
2. Observe 7 days:
   - upload error rate
   - AV timeout rate
   - AV unavailable events
3. If stable, switch to `AV_SCAN_FAIL_CLOSED=true`.

## Quick Verification

Check runtime env values:

```bash
docker compose exec api env | rg "TRUSTED_PROXY_COUNT|AV_SCAN|CLAMAV"
```

Check API logs for AV unavailability:

```bash
docker compose logs -f api | rg "AV scan unavailable|FileValidation"
```
