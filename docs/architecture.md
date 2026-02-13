# ProsektorWeb Platform Architecture

## Overview

ProsektorWeb platformu iki ana repository'den oluşur:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ProsektorWeb Platform                          │
├─────────────────────────────────┬───────────────────────────────────────────┤
│   prosektorweb_dashboard      │      site-engine (Ayrı Repo)            │
│   = Dashboard / Panel API       │      = Project Generation + Deploy     │
├─────────────────────────────────┼───────────────────────────────────────────┤
│ Ana Odak: CMS & Yönetim      │ Ana Odak: AI İçerik Üretimi          │
├─────────────────────────────────┼───────────────────────────────────────────┤
│ • Site CRUD                   │ • Project (Proje) Oluşturma         │
│ • Sayfa Yönetimi             │ • AI ile içerik üretimi            │
│ • Modül Konfigürasyonu        │ • Şablon seçimi                   │
│ • Form Yönetimi (Inbox)       │ • Önizleme (QA)                   │
│ • İK İlanları (HR)            │ • Yayına alma (Publish)            │
│ • Domain Yönetimi            │ • Cache revalidation                │
│ • Tenant/Kullanıcı Yönetimi   │                                    │
│ • Public Form Endpointleri     │ • Panel API entegrasyonu           │
├─────────────────────────────────┼───────────────────────────────────────────┤
│ API Endpoints:                │ API Endpoints:                      │
│ /api/sites                    │ /api/projects                       │
│ /api/pages                    │ /api/projects/[id]/generate         │
│ /api/modules                  │ /api/projects/[id]/publish          │
│ /api/inbox/*                  │ /api/internal/publish (webhook)     │
│ /api/hr/*                     │                                    │
│ /api/legal-texts              │                                    │
│ /api/domains                  │                                    │
│ /api/tenant-members           │                                    │
│ /api/public/*                 │                                    │
├─────────────────────────────────┼───────────────────────────────────────────┤
│ Supabase Backend              │ Panel API Client                    │
│ • Postgres Database           │ • panel-client.ts                  │
│ • Auth (JWT)                 │ • Bearer token auth                 │
│ • Storage (CV, Media)         │ • Webhook signature verification    │
│ • RLS (Row Level Security)    │                                    │
├─────────────────────────────────┼───────────────────────────────────────────┤
│ Dokümantasyon:               │ Dokümantasyon:                     │
│ docs/api/dashboard-api-contract │ docs/backend-integration.md        │
│ docs/api/webhook-architecture  │                                    │
└─────────────────────────────────┴───────────────────────────────────────────┘
                                │
                                │ Webhook / Publish
                                │
                ┌───────────────┴───────────────┐
                │      Yayın Akışı     │
                │                       │
                │ 1. Site edit (Dashboard)│
                │ 2. Publish isteği       │
                │ 3. Webhook → Site-Engine │
                │ 4. Content deploy       │
                │ 5. Cache revalidate     │
                └───────────────────────┘
```

## Repository İlişkisi

### prosektorweb_dashboard (Bu Repo)

**Amaç:** İçerik yönetim sistemi (CMS)
**Teknoloji:** Next.js 15 + Supabase + Tailwind CSS v4

**Sorumlulukler:**
- Site verilerinin tutulması
- Sayfa içerik ve revizyon yönetimi
- Modül konfigürasyonu (Offer, Contact, HR, Legal)
- Form gönderimleri (Inbox)
- Kullanıcı ve tenant yönetimi
- Public form API'leri

**Ana Paketler:**
- `apps/web` - Dashboard UI
- `apps/api` - Dashboard API
- `packages/contracts` - TypeScript Zod schemaları
- `packages/design-tokens` - Tasarım tokenları

### site-engine (Ayrı Repo)

**Amaç:** Proje oluşturma ve AI içerik üretimi
**Teknoloji:** Next.js + OpenAI SDK (veya benzeri)

**Sorumlulukler:**
- Proje oluşturma (şablon bazlı)
- AI ile otomatik içerik üretimi
- QA skorlama
- Yayına alma (publish) yönetimi
- Panel API entegrasyonu
- Cache revalidation

**Ana Paketler:**
- `src/features/projects` - Proje yönetimi
- `src/features/site-engine` - Panel entegrasyonu
- `src/app/api/projects` - Proje API'leri

## Veri Akışı

### 1. Site Oluşturma Akışı

```
Kullanıcı (Dashboard)
    │
    ├─> Site oluştur (/api/sites)
    │   └─> Supabase: sites tablosuna insert
    │
    └─> Modül konfigüre et (/api/modules)
        └─> Supabase: module_instances tablosuna update
```

### 2. İçerik Üretimi Akışı (Site-Engine)

```
Kullanıcı (Site-Engine UI)
    │
    ├─> Proje oluştur (/api/projects)
    │
    ├─> AI ile içerik üret (/api/projects/[id]/generate)
    │   ├─> OpenAI API (veya benzeri)
    │   └─> Proje sayfalarını güncelle
    │
    └─> Önizle (QA)
        └─> Skor hesapla (qaScore)
```

### 3. Yayına Alma Akışı

```
Dashboard Yöneticisi
    │
    ├─> Publish butonuna bas
    │   └─> POST /api/publish (Dashboard)
    │       ├─> Supabase: site.status = "staging"|"published"
    │       ├─> Sayfa revizyonlarını güncelle
    │       └─> Audit log yaz
    │
    └─> Webhook gönderilir (gelecek özellik)
        └─> POST /api/internal/publish (Site-Engine)
            ├─> Signature doğrulama
            ├─> Cache revalidation
            └─> Content deploy
```

## Ortak Veri Modeli

Her iki repository da ortak veri yapısını kullanır:

### Site Settings

```typescript
// Dashboard API (/api/sites/[id]) tarafında yazılır
interface SiteSettings {
  // Navigation
  navigation_links: Array<{ label: string; href: string }>;

  // Footer
  footer_links: Array<{ label: string; href: string }>;

  // Header CTA
  header_cta_label?: string;
  header_cta_href?: string;

  // Theme Tokens
  theme_tokens?: {
    primary_color: string;    // HEX
    secondary_color: string;  // HEX
    accent_color: string;     // HEX
    background_color: string; // HEX
    font_heading?: string;     // "Sora", "Manrope", vb.
    font_body?: string;       // "Sora", "Manrope", vb.
  };

  // Layout Configuration
  layout_config?: {
    pages?: Record<string, {
      section_order: string[];       // ["hero", "services", ...]
      hidden_sections?: string[];     // ["faq"]
    }>;
  };

  // Section Variants
  section_variants?: Record<string, string>;
  // Örnek: { hero: "spotlight", services: "list", ... }
}
```

### Sayfa Yapısı

```typescript
interface Page {
  id: string;
  site_id: string;
  slug: string;        // "" = homepage
  title: string;
  status: "draft" | "staging" | "published";
  seo?: {
    title?: string;
    description?: string;
    og_image?: string;
  };
  // Dashboard: revision_id referansı
  // Site-Engine: content string olarak depolayabilir
}
```

## Environment Variable'leri

### Dashboard (prosektorweb_dashboard)

```bash
# Supabase
SUPABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Site Token (Public forms)
SITE_TOKEN_SECRET=...

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=60000
```

### Site-Engine (Ayrı Repo)

```bash
# Dashboard API
DASHBOARD_API_HOST=https://dashboard.example.com
PANEL_API_TOKEN=<service-jwt>

# Webhook (incoming from dashboard)
WEBHOOK_SECRET=shared-secret

# AI API (OpenAI vb.)
OPENAI_API_KEY=...
```

## Deployment

### Dashboard Deployment

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────>│   Supabase  │────>│   GitHub    │
│ (Frontend)  │     │ (Backend)    │     │ (Git)       │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Site-Engine Deployment

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Docker    │────>│  Dashboard   │────>│   GitHub    │
│ (Container) │     │   API        │     │ (Git)       │
└─────────────┘     └─────────────┘     └─────────────┘
```

## İlişkili Dokümanlar

| Doküman | Repository | Amaç |
|----------|------------|------|
| `docs/api/dashboard-api-contract.md` | Dashboard | Dashboard API tam referansı |
| `docs/api/webhook-architecture.md` | Dashboard | Gelecek webhook planı |
| `docs/api/api-contracts.md` | Dashboard | API sözleşme özeti |
| `docs/site-engine-integration.md` | Dashboard | Site-Engine için entegrasyon kılavuzu (ayrı repo için) |
| `docs/backend-integration.md` | Site-Engine | Panel entegrasyonu (site-engine repo'su) |

## Geliştirme Notları

1. **Dashboard** her zaman birincil veri kaynagıdır
2. **Site-Engine** Dashboard API'sini kullanarak proje oluşturur
3. **Webhook** ile Site-Engine, publish eventlerinden haberdar olur
4. **Her iki repository** aynı Supabase instance'ını kullanır (tenant izolasyonu)
5. **Public formlar** her zaman Dashboard API üzerinden gider (`/api/public/*`)

## Gelecek Özellikler

- [ ] Webhook entegrasyonu (Dashboard → Site-Engine)
- [ ] Site-Engine repository oluşturma
- [ ] Panel API client library (paylaşılan)
- [ ] Unified deployment pipeline
