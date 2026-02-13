# Backend <-> Panel Integration Guide

> **Hedef Repository:** `site-engine` (Ayrı bir repo)
> **Referans Repository:** `prosektorweb_dashboard` (Dashboard API)

Bu doküman, panel ekibinin **prosektorweb_dashboard** repodaki backend ile nasıl entegre olacağını teknik ve karar-verilebilir seviyede tanımlar.

> **OEM VEYGI:** Bu doküman ayri bir **site-engine** repository'si icin tasarlanmistir.
> Mevcut repository sadece **Dashboard API**'dir.

---

## Alternatif Dokümanlar

Bu dokümanin Turkce versiyonu yuklenmistir. Asagidaki referanslara bakiniz:

1. **Platform Architecture:** `docs/architecture.md` - İki repo arasindaki iliski
2. **Dashboard API Contract:** `docs/api/dashboard-api-contract.md` - Dashboard API tam referansi
3. **Webhook Architecture:** `docs/api/webhook-architecture.md` - Gelecek webhook plani

---

## 1) Scope ve Amaç

Bu repo (`prosektorweb_dashboard`) panel uygulaması degildir.
Bu repo:
- Dis panel API'sinden site verisini okur
- Kendi `api/projects/*` endpointleri ile proje olusturma/uretim/yayin akisını yonetir
- Panel publish event'i geldiginde cache revalidate eder

Site-Engine (ayrı repo) ise:
- Proje oluşturma ve AI içerik uretimi yapar
- Panel API'den site verilerini okur
- Publish sonrasi webhook alir

## 2) Topoloji

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Panel UI       │────────>│  Panel API       │────────>│   Supabase      │
│  (Dashboard)    │         │  (Bu Repo)      │         │   (Database)     │
└─────────────────┘         └────────┬────────┘         └─────────────────┘
                                    │
                                    │ panel-client
                                    │
┌─────────────────┐         ┌────────┴────────┐
│  Site-Engine UI  │────────>│  Site-Engine     │
│                 │         │  (Ayrı Repo)    │
└─────────────────┘         └─────────────────┘
```

1. Panel UI → Panel API (`/sites`, `/pages`, `/modules`, `/public/*`)
2. Site-Engine (`panel-client`) → Panel API (JWT/Bearer ile)
3. Site-Engine UI (`/projects/*`) → Site-Engine API (`/api/projects/*`)
4. Publish sonrası panel → Site-Engine webhook (`POST /api/internal/publish`)

## 3) Environment Contract

Zorunlu:

```env
DASHBOARD_API_HOST="https://dashboard.example.com"
WEBHOOK_SECRET="shared-secret-with-panel"
PANEL_API_TOKEN="<service-jwt-or-service-role-key>"
```

Fallback env:
- `PANEL_API_HOST`
- `DASHBOARD_PUBLIC_API_BASE`
- `PANEL_API_JWT`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_PUBLISH_SECRET`
- `DEMO_PUBLISH_WEBHOOK_SECRET`

Not:
- `panel-client` base URL'e otomatik `/api` suffix'ini ekler
- Ornek: `DASHBOARD_API_HOST=https://dashboard.example.com` → hedef `https://dashboard.example.com/api/...`

## 4) Dashboard API Endpoints (Site-Engine tarafindan cagrilan)

Dashboard API (`prosektorweb_dashboard`) endpointleri:

| Endpoint | Method | Auth | Aciklama |
|----------|--------|------|----------|
| `/api/me` | GET | Yes | Mevcut kullanici bilgisi |
| `/api/sites` | GET | Yes | Siteleri listele |
| `/api/sites` | POST | Yes | Site olustur |
| `/api/sites/:id` | GET | Yes | Site detayi |
| `/api/sites/:id` | PATCH | Yes | Site guncelle |
| `/api/sites/:id/site-token` | GET | Yes | Public form JWT |
| `/api/sites/:id/seo` | GET/PATCH | Yes | SEO ayarlari |
| `/api/pages?site_id=:siteId` | GET | Yes | Sayfalari listele |
| `/api/pages` | POST | Yes | Sayfa olustur |
| `/api/pages/:id` | PATCH | Yes | Sayfa guncelle |
| `/api/pages/:id/revisions` | GET | Yes | Revizyonlari listele |
| `/api/pages/:id/revisions` | POST | Yes | Yeni revizyon |
| `/api/modules?site_id=:siteId` | GET | Yes | Modulleri listele |
| `/api/modules/:id` | PATCH | Yes | Modul guncelle |
| `/api/public/contact/submit` | POST | site_token | Iletisim formu |
| `/api/public/offer/submit` | POST | site_token | Teklif formu |
| `/api/public/hr/apply` | POST | site_token + multipart | Is basvurusu |

**Tam referans:** `docs/api/dashboard-api-contract.md`

## 5) Site-Engine API Contract (Panel ekibinin tuketebilecegi)

### 5.1 `GET /api/projects`

Response:
```json
{
  "success": true,
  "projects": [
    {
      "id": "...",
      "name": "...",
      "description": "...",
      "template": "...",
      "industry": "...",
      "status": "DRAFT",
      "updatedAt": "2026-02-12T..."
    }
  ]
}
```

### 5.2 `POST /api/projects`

Body (`projectCreateSchema`):
```json
{
  "name": "Acme OSGB",
  "description": "Opsiyonel",
  "template": "corporate-clean",
  "industry": "OSGB",
  "contact": {
    "phone": "0212...",
    "email": "info@...",
    "address": "...",
    "city": "Istanbul",
    "district": "Kadikoy"
  }
}
```

Kurallar:
- `name`: zorunlu, min 3
- `description`: opsiyonel
- `slug` input olarak alinmaz; backend unique slug uretir

### 5.3 `GET /api/projects/:id`

Response:
```json
{
  "success": true,
  "project": {
    "id": "...",
    "name": "...",
    "slug": "...",
    "uiSettings": { ... }
  }
}
```

### 5.4 `PATCH /api/projects/:id`

Sadece `uiSettings` update eder.

Body:
```json
{
  "uiSettings": {
    "navigationLinks": [{ "label": "Ana Sayfa", "href": "/" }],
    "footerLinks": [{ "label": "Iletisim", "href": "/iletisim" }],
    "headerCtaLabel": "Teklif Al",
    "headerCtaHref": "/iletisim",
    "themeTokens": {
      "primaryColor": "#0f6ad7",
      "secondaryColor": "#0b4ca4",
      "accentColor": "#f59e0b",
      "backgroundColor": "#f6f8fb",
      "fontHeading": "Sora",
      "fontBody": "Manrope"
    },
    "layoutConfig": {
      "pages": {
        "/": {
          "sectionOrder": ["hero", "services", "about", "cta", "content"],
          "hiddenSections": ["faq"]
        }
      }
    },
    "sectionVariants": {
      "hero": "spotlight",
      "services": "list",
      "about": "card",
      "cta": "minimal",
      "contact": "compact"
    }
  }
}
```

### 5.5 `GET /api/projects/:id/pages`

Response:
```json
{
  "success": true,
  "pages": [
    {
      "id": "...",
      "name": "Ana Sayfa",
      "slug": "",
      "content": "<p>...</p>",
      "updatedAt": "2026-02-12T..."
    }
  ]
}
```

### 5.6 `POST /api/projects/:id/generate`

Body (`generationSchema`):
```json
{
  "companyName": "Acme OSGB",
  "description": "Is sagligi ve guvenligi...",
  "services": "Is Guvenligi Uzmanligi, Risk Degerlendirmesi",
  "phone": "0212...",
  "email": "info@...",
  "address": "..."
}
```

Response: `success + pages[]`

### 5.7 `POST /api/projects/:id/publish`

Body (opsiyonel):
```json
{
  "qaScore": 85,
  "escalationLevel": "low",
  "force": false,
  "minQaScore": 70,
  "requireQaScore": true
}
```

Response:
```json
{
  "success": true,
  "project": { ... },
  "pagesPublished": 4,
  "webhook": {
    "ok": true,
    "traceId": "..."
  },
  "qualityGate": {
    "qaScore": 85,
    "threshold": 70,
    "escalationLevel": "low",
    "forced": false
  }
}
```

## 6) `site.settings` Canonical Keys

Panelin yazmasi onerilen canonical keyler:

```typescript
interface SiteSettings {
  navigation_links: Array<{ label: string; href: string }>;
  footer_links: Array<{ label: string; href: string }>;
  header_cta_label?: string;
  header_cta_href?: string;
  theme_tokens?: ThemeTokens;
  layout_config?: LayoutConfig;
  section_variants?: Record<string, string>;
}
```

### 6.1 Layout ve Variant Kurallari

Desteklenen sayfalar:
- `/`, `/hakkimizda`, `/hizmetler`, `/iletisim`, `/blog`

Desteklenen bolum tipleri:
- `hero`, `services`, `about`, `cta`, `contact`, `faq`, `team`, `stats`, `gallery`, `testimonials`, `content`

Izinli variant seti:
- `hero`: `default`, `spotlight`, `compact`
- `services`: `cards`, `list`, `compact`
- `about`: `default`, `card`
- `cta`: `banner`, `minimal`
- `contact`: `default`, `compact`

Renk tokenlari: HEX (`#RGB` veya `#RRGGBBAA`) olmali

## 7) Publish Webhook Contract

Dashboard → Site-Engine webhook ile beslenir.

### Endpoint

- `POST /api/internal/publish`
- `POST /api/revalidate` (alias)

### Headers (Zorunlu)

```http
x-signature: sha256=<hex>
x-timestamp: <unix-timestamp>
x-trace-id: <uuid>
```

### Body

```json
{
  "event": "publish",
  "traceId": "evt_...",
  "publishedAt": "2026-02-12T20:00:00.000+03:00",
  "site": {
    "id": "uuid",
    "slug": "ornek-osgb",
    "status": "published"
  },
  "pages": ["/", "/hizmetler", "/iletisim"],
  "source": "panel"
}
```

### Imza Hesaplama

Digest: `${x-timestamp}.${rawBody}`
HMAC: sha256
Header: `x-signature: sha256=<hex>`

Validasyon:
- Max skew: 300s
- `x-trace-id` = body `traceId`

### Basarili Cevap

```json
{
  "ok": true,
  "traceId": "evt_...",
  "event": "publish",
  "siteSlug": "ornek-osgb",
  "revalidated": ["/ornek-osgb", "/ornek-osgb/hizmetler"],
  "warned": [],
  "warnings": []
}
```

## 8) Error Model

Site-Engine API'leri:
```json
{ "success": false, "error": "..." }
```

Durum kodlari:
- `400`: validation
- `401`: webhook imza / auth
- `404`: proje bulunamadi
- `500`: sunucu / config

Panel API kaynakli hatalar `PanelApiError` ile normalize edilir.

## 9) Hizli Smoke Test

```bash
# 1) Proje olustur
curl -X POST http://localhost:3001/api/projects \
  -H 'content-type: application/json' \
  -d '{"name":"Demo OSGB","description":"Ornek proje"}'

# 2) Icerik uret
curl -X POST http://localhost:3001/api/projects/<projectId>/generate \
  -H 'content-type: application/json' \
  -d '{"companyName":"Demo OSGB","description":"ISG hizmetleri"}'

# 3) Yayinla
curl -X POST http://localhost:3001/api/projects/<projectId>/publish \
  -H 'content-type: application/json' \
  -d '{}'
```
