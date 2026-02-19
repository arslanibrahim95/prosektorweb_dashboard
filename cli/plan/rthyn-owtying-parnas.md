# Plan: Admin Settings PATCH — backup / i18n / theme Desteği

## Execution Mode

- **Execute sequentially** (not in parallel)
- Add 1-2 second delay between items
- Worker count: `1` (`max_workers=1`)
- Runtime env: `PARALLEL_WORKERS=1`, `RATE_LIMIT_DELAY=2000`

## Context

Admin ayarlar sayfaları (`security`, `backup`, `i18n`, `theme`) hepsi `useUpdateAdminSettings` hook'u üzerinden `PATCH /admin/settings` endpoint'ine payload gönderiyor. Backend'deki Zod şeması `.strict()` modunda ve yalnızca `tenant`, `site`, `security` alanlarını kabul ediyor. `backup`, `i18n`, `theme` payload'ları 400 hatası üretip sessizce düşüyor; UI ise API cevabını beklemeden optimistik güncelleme mi yapıyor, yoksa hata yakalamıyor mu — her iki durumda da veri kaydedilmiyor.

**Kök neden:** `settingsPatchSchema` içinde `backup`, `i18n`, `theme` yok + `.strict()` mode.

**Çözüm yeri:** Tek dosya — `apps/api/src/app/api/admin/settings/route.ts`

---

## Kritik Dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `apps/api/src/app/api/admin/settings/route.ts` | **Ana değişiklik** — schema + handler |

---

## Mevcut Durum

**Zod şeması (route.ts içinde, contracts'ta değil):**
```typescript
const settingsPatchSchema = z.object({
    tenant: z.object({
        name: z.string().min(1).max(100).optional(),
        plan: z.string().min(1).max(50).optional(),
    }).optional(),
    site: z.object({
        id: z.string().uuid(),
        settings: z.record(z.string(), z.unknown()).optional(),
    }).optional(),
    security: z.record(z.string(), z.unknown()).optional(),
}).strict();   // ← backup/i18n/theme bu yüzden reddediliyor
```

**Frontend payloads (dokunulmayacak):**
- `backup`: `{ auto_backup, frequency, retention_period, location, include }`
- `i18n`: `{ defaultLanguage, enabledLanguages, languages[] }`
- `theme`: `{ colors, fontFamily, baseFontSize, headingFont, ... }`

**Depolama:** `tenants.settings` JSONB (şu an `security` için zaten kullanılıyor → `tenants.settings.security`)

---

## Item Batching (Hotfix Mode)

- Maksimum 2-3 item per run.
- Once `Batch 1` is complete, continue with `Batch 2`.

## Yapılacaklar

### Batch 1 (hemen uygula)

### 1. Zod Alt Şemaları Ekle (route.ts içinde)

```typescript
const backupSettingsSchema = z.object({
  auto_backup: z.boolean().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  retention_period: z.enum(['7', '30', '90', '365']).optional(),
  location: z.enum(['local', 's3', 'gcs']).optional(),
  include: z.object({
    database: z.boolean().optional(),
    media: z.boolean().optional(),
    config: z.boolean().optional(),
    logs: z.boolean().optional(),
  }).optional(),
});

const i18nSettingsSchema = z.object({
  defaultLanguage: z.string().min(2).max(10).optional(),
  enabledLanguages: z.array(z.string().min(2).max(10)).optional(),
  languages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    code: z.string().min(2).max(10),
    status: z.enum(['active', 'inactive']),
    isDefault: z.boolean(),
    progress: z.number().min(0).max(100),
  })).optional(),
});

const themeSettingsSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    text: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    success: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    warning: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    error: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }).optional(),
  fontFamily: z.enum(['inter', 'roboto', 'open-sans', 'poppins', 'nunito']).optional(),
  baseFontSize: z.number().min(12).max(24).optional(),
  headingFont: z.enum(['inter', 'roboto', 'open-sans', 'poppins', 'nunito']).optional(),
  lineHeight: z.enum(['1.25', '1.5', '1.75', '2']).optional(),
  sidebarWidth: z.number().min(200).max(400).optional(),
  borderRadius: z.enum(['none', 'small', 'medium', 'large', 'full']).optional(),
  shadowStyle: z.enum(['none', 'light', 'medium', 'strong']).optional(),
  compactMode: z.boolean().optional(),
});
```

### 2. `settingsPatchSchema`'yı Güncelle

`.strict()` kaldır, yeni alanları ekle:

```typescript
const settingsPatchSchema = z.object({
    tenant: z.object({ ... }).optional(),
    site: z.object({ ... }).optional(),
    security: z.record(z.string(), z.unknown()).optional(),
    backup: backupSettingsSchema.optional(),      // YENİ
    i18n: i18nSettingsSchema.optional(),          // YENİ
    theme: themeSettingsSchema.optional(),        // YENİ
});
// .strict() kaldırıldı
```

### Batch 2 (Batch 1 tamamlanınca)

### 3. PATCH Handler'a Yeni Alanları İşle

Mevcut `security` işleme pattern'i zaten `tenants.settings.security`'ye yazıyor. Aynı pattern'i tekrarla:

```typescript
// backup
if (body.backup) {
  const existing = (tenant.settings as Record<string, unknown>) ?? {};
  const merged = { ...((existing.backup as object) ?? {}), ...body.backup };
  await supabase
    .from('tenants')
    .update({ settings: { ...existing, backup: merged } })
    .eq('id', tenantId);
  // audit log
}

// i18n — aynı pattern
if (body.i18n) { ... }

// theme — aynı pattern
if (body.theme) { ... }
```

### 4. GET Response — Değişiklik Gerekmez

`GET /admin/settings` zaten tam tenant kaydını döndürüyor. `tenant.settings` JSONB içinde `backup`, `i18n`, `theme` otomatik olarak dönecek. Frontend `useAdminSettings()` hook'u bu verilerle sayfa yüklendiğinde form alanlarını dolduruyor.

---

## Frontend Değişikliği — YOK

Frontend payloads zaten doğru. `useUpdateAdminSettings` hook'u dokunulmadan çalışacak.

---

## Doğrulama

```bash
# 1. Lint
pnpm --filter api lint 'src/app/api/admin/settings/route.ts'

# 2. API testleri
pnpm test:api

# 3. Manuel test (geliştirme ortamında)
# - /admin/backup sayfasına git, auto_backup toggle'ı değiştir, kaydet
# - Sayfayı yenile → ayar korunmalı
# - /admin/i18n → dil ekle, kaydet, yenile → kalıcı
# - /admin/theme → renk değiştir, kaydet, yenile → kalıcı
```
