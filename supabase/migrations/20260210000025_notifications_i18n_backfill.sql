-- Migration: Backfill tenant settings for notifications + i18n
-- Purpose:
-- 1) Move legacy notifications payload from tenants.meta -> tenants.settings.notifications (if meta column exists)
-- 2) Ensure notifications defaults exist in tenants.settings
-- 3) Ensure i18n baseline keys exist (defaultLanguage/enabledLanguages/translations)

BEGIN;

-- ---------------------------------------------------------------------------
-- Optional legacy backfill: tenants.meta.notifications -> tenants.settings.notifications
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'meta'
  ) THEN
    EXECUTE $sql$
      UPDATE public.tenants
      SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{notifications}',
        COALESCE(meta->'notifications', '{}'::jsonb),
        true
      )
      WHERE (settings->'notifications') IS NULL
        AND COALESCE(meta, '{}'::jsonb) ? 'notifications';
    $sql$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Notifications defaults
-- ---------------------------------------------------------------------------

-- Ensure notifications object exists
UPDATE public.tenants
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{notifications}',
  '{}'::jsonb,
  true
)
WHERE jsonb_typeof(settings->'notifications') IS DISTINCT FROM 'object';

-- Boolean switches
UPDATE public.tenants
SET settings = jsonb_set(settings, '{notifications,enabled}', 'true'::jsonb, true)
WHERE NOT (settings->'notifications' ? 'enabled');

UPDATE public.tenants
SET settings = jsonb_set(settings, '{notifications,email_notifications}', 'true'::jsonb, true)
WHERE NOT (settings->'notifications' ? 'email_notifications');

UPDATE public.tenants
SET settings = jsonb_set(settings, '{notifications,slack_notifications}', 'false'::jsonb, true)
WHERE NOT (settings->'notifications' ? 'slack_notifications');

-- nullable string field
UPDATE public.tenants
SET settings = jsonb_set(settings, '{notifications,webhook_url}', 'null'::jsonb, true)
WHERE NOT (settings->'notifications' ? 'webhook_url');

-- Notification type toggles
UPDATE public.tenants
SET settings = jsonb_set(
  settings,
  '{notifications,notification_types}',
  '{"new_user": true, "role_change": true, "content_published": true, "system_alert": true}'::jsonb,
  true
)
WHERE jsonb_typeof(settings#>'{notifications,notification_types}') IS DISTINCT FROM 'object';

-- Default templates if empty/missing (real persisted data; no UI mock)
UPDATE public.tenants
SET settings = jsonb_set(
  settings,
  '{notifications,templates}',
  '[
    {
      "id": "default-user-welcome",
      "name": "Hoş Geldiniz E-postası",
      "type": "email",
      "trigger_event": "user_welcome",
      "trigger_label": "Kullanıcı Hoş Geldiniz",
      "subject": "Hoş Geldiniz!",
      "body": "Merhaba {{user_name}}, {{site_name}} ailesine hoş geldiniz!",
      "is_active": true,
      "updated_at": "2026-02-20T00:00:00.000Z"
    },
    {
      "id": "default-password-reset",
      "name": "Şifre Sıfırlama",
      "type": "email",
      "trigger_event": "password_reset",
      "trigger_label": "Şifre Sıfırlama",
      "subject": "Şifre Sıfırlama Talebi",
      "body": "Şifrenizi sıfırlamak için {{link}} bağlantısını kullanın.",
      "is_active": true,
      "updated_at": "2026-02-20T00:00:00.000Z"
    },
    {
      "id": "default-system-alert",
      "name": "Sistem Uyarısı",
      "type": "push",
      "trigger_event": "system_alert",
      "trigger_label": "Sistem Uyarısı",
      "subject": "Önemli Sistem Bildirimi",
      "body": "Sistemde önemli bir güncelleme var.",
      "is_active": true,
      "updated_at": "2026-02-20T00:00:00.000Z"
    }
  ]'::jsonb,
  true
)
WHERE jsonb_typeof(settings#>'{notifications,templates}') IS DISTINCT FROM 'array';

-- Empty history array
UPDATE public.tenants
SET settings = jsonb_set(settings, '{notifications,email_history}', '[]'::jsonb, true)
WHERE jsonb_typeof(settings#>'{notifications,email_history}') IS DISTINCT FROM 'array';

-- ---------------------------------------------------------------------------
-- i18n baseline defaults
-- ---------------------------------------------------------------------------

UPDATE public.tenants
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{i18n}',
  '{}'::jsonb,
  true
)
WHERE jsonb_typeof(settings->'i18n') IS DISTINCT FROM 'object';

UPDATE public.tenants
SET settings = jsonb_set(settings, '{i18n,defaultLanguage}', '"tr"'::jsonb, true)
WHERE NOT (settings->'i18n' ? 'defaultLanguage');

UPDATE public.tenants
SET settings = jsonb_set(settings, '{i18n,enabledLanguages}', '["tr","en"]'::jsonb, true)
WHERE jsonb_typeof(settings#>'{i18n,enabledLanguages}') IS DISTINCT FROM 'array';

UPDATE public.tenants
SET settings = jsonb_set(settings, '{i18n,translations}', '{}'::jsonb, true)
WHERE jsonb_typeof(settings#>'{i18n,translations}') IS DISTINCT FROM 'object';

COMMIT;
