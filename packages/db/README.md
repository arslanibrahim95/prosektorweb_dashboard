# DB Package

This folder contains plain SQL intended for Supabase Postgres.

## Apply Order

1. Run migrations in `/packages/db/migrations/*.sql` (in order).
2. Run `/packages/db/rls-policies.sql` (table policies + storage.objects policies).

## Storage Bucket

RLS policies assume 2 buckets with object key convention:

- Public media bucket: `public-media`
  - `tenant_<tenant_id>/media/<timestamp>_<filename>`
- Private CV bucket: `private-cv`
  - `tenant_<tenant_id>/cv/<timestamp>_<filename>`
