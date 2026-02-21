# Vercel Deployment Guide

This guide documents the required setup for Preview and Production deployments via GitHub Actions.

## Required GitHub Secrets

Set these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Workflows

- Preview deploy: `.github/workflows/preview.yml`
  - Trigger: Pull request to `main`
  - Action: Build + optional Vercel preview deploy
- Production deploy: `.github/workflows/release.yml`
  - Trigger: Tag push `v*`
  - Action: Release + build + optional Vercel production deploy

## Deployment Behavior

1. If all Vercel secrets exist, workflow deploy steps run.
2. If any Vercel secret is missing, deployment is skipped and warning is emitted.
3. Build still runs in both cases to preserve CI signal.

## Local Verification Before Tag/PR

```bash
pnpm lint
pnpm test:api
pnpm test:web
pnpm build
```

## Release Checklist

- [ ] All required secrets configured
- [ ] `pnpm build` passes locally
- [ ] API and Web tests are green
- [ ] Version tag follows `vX.Y.Z`
