# ProsektorWeb Platform Architecture

> **Versiyon:** 2.0.0 | **Güncelleme:** 2026-02-18
> **Vizyon:** Vibe Coding + Özel Siteler (Her firma için benzersiz)

---

## 🧠 Memory Bank Referansı

Bu proje Memory Bank sistemi ile yönetilir. Detaylar için:
- **Ana Kurallar:** `CLAUDE.md`
- **Özel Yetenekler:** `SKILLS.md`
- **Aktif Bağlam:** `.claude/memory/activeContext.md`

---

## Overview

ProsektorWeb platformu iki ana repository'den oluşur:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ProsektorWeb Platform                                 │
├─────────────────────────────────┬───────────────────────────────────────────────┤
│   prosektorweb_dashboard        │      site-engine (Ayrı Repo)                  │
│   = Yönetim Paneli              │      = AI Site Üretimi (Vibe Coding)          │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│ Ana Odak: Yönetim & Inbox       │ Ana Odak: Her firma için benzersiz site       │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│ • Site CRUD & Publish           │ • Prompt'tan custom site üretimi              │
│ • Inbox (Teklif, İletişim, HR)  │ • AI ile unique tasarım                       │
│ • Domain & SSL                  │ • Özel içerik oluşturma                       │
│ • Basit içerik düzenleme        │ • Önizleme (QA)                               │
│ • Kullanıcı yönetimi            │ • Yayına alma (Publish)                       │
│ • HR (İlan + Başvuru)           │                                               │
│                                 │ • Panel API entegrasyonu                      │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│ ❌ YOK: Page Builder            │ ✅ VAR: AI Site Generator                     │
│ ❌ YOK: Şablon Sistemi          │ ✅ VAR: Vibe Coding                           │
│ ❌ YOK: Blok Editör             │ ✅ VAR: Custom Design per Site               │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│ API Endpoints:                  │ API Endpoints:                                │
│ /api/sites                      │ /api/projects                                 │
│ /api/inbox/*                    │ /api/projects/[id]/generate                   │
│ /api/hr/*                       │ /api/projects/[id]/publish                    │
│ /api/domains                    │ /api/internal/publish (webhook)               │
│ /api/public/*                   │                                               │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│ Supabase Backend                │ Panel API Client                              │
│ • Postgres Database             │ • panel-client.ts                             │
│ • Auth (JWT)                    │ • Bearer token auth                           │
│ • Storage (CV, Media)           │ • Webhook signature verification              │
│ • RLS (Row Level Security)      │                                               │
└─────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 🎯 Vizyon: Vibe Coding

**Her firma için benzersiz site:**
- Müşteri prompt'u → AI → Custom site
- Şablon YOK, her site unique
- Tasarım, içerik, yapı AI tarafından üretilir
- Dashboard sadece yönetim için

---

## Repository İlişkisi

### prosektorweb_dashboard (Bu Repo)

**Amaç:** Site yönetimi ve inbox
**Teknoloji:** Next.js 15 + Supabase + Tailwind CSS v4

**Sorumlulukler:**
- Site listesi ve publish kontrolü
- Form gönderimleri (Inbox)
- Domain & SSL yönetimi
- Kullanıcı ve tenant yönetimi
- HR (İş ilanları + başvurular)
- **Basit** içerik düzenleme (SEO, meta, contact info)
- Public form API'leri

**Ana Paketler:**
- `apps/web` - Dashboard UI
- `apps/api` - Dashboard API
- `packages/contracts` - TypeScript Zod schemaları
- `packages/design-tokens` - Tasarım tokenları

### site-engine (Ayrı Repo)

**Amaç:** AI ile custom site üretimi (Vibe Coding)
**Teknoloji:** Next.js + OpenAI SDK

**Sorumlulukler:**
- Prompt'tan site oluşturma
- AI ile unique tasarım üretimi
- Custom içerik oluşturma
- QA skorlama
- Yayına alma (publish) yönetimi
- Panel API entegrasyonu

**Ana Paketler:**
- `src/features/projects` - Proje yönetimi
- `src/features/generator` - AI site üretimi
- `src/app/api/projects` - Proje API'leri

---

## Veri Akışı

### 1. Site Oluşturma Akışı (site-engine)

```
Müşteri (site-engine UI)
    │
    ├─> Prompt gir (firma bilgileri, istekler)
    │
    ├─> AI site üret (/api/projects/[id]/generate)
    │   ├─> OpenAI API
    │   ├─> Custom tasarım
    │   └─> Unique içerik
    │
    ├─> Önizle (QA)
    │   └─> Skor hesapla
    │
    └─> Publish isteği
        └─> Dashboard'a kayıt oluştur
```

### 2. Yayına Alma Akışı

```
site-engine
    │
    └─> POST /api/internal/publish (Webhook)
        │
        └─> Dashboard
            ├─> Site kaydı oluştur
            ├─> Domain atanır
            └─> Publish status güncellenir
```

### 3. Form Akışı (Dashboard)

```
Ziyaretçi (Site)
    │
    ├─> Teklif formu doldur
    │   └─> POST /api/public/offer/submit
    │       └─> Inbox'ta görünür
    │
    ├─> İletişim formu doldur
    │   └─> POST /api/public/contact/submit
    │       └─> Inbox'ta görünür
    │
    └─> İş başvurusu yap
        └─> POST /api/public/hr/apply
            └─> Inbox'ta görünür + CV kaydedilir
```

---

## Dashboard Özellikleri (Bu Repo)

### ✅ VAR

| Özellik | Açıklama |
|---------|----------|
| Site Listesi | Tüm müşteri sitelerini görüntüle |
| Publish Kontrolü | Site yayına alma / durdurma |
| Inbox | Teklif, İletişim, İş Başvuruları |
| Domain & SSL | Custom domain bağlama |
| HR Modülü | İş ilanları + başvuru yönetimi |
| Kullanıcı Yönetimi | Tenant üyeleri, roller |
| Basit Düzenleme | SEO meta, iletişim bilgileri |

### ❌ YOK (site-engine'de)

| Özellik | Neden |
|---------|-------|
| Page Builder | Site AI ile üretiliyor |
| Blok Editör | Her site custom |
| Şablon Sistemi | Vibe coding = unique |
| Theme Builder | Tasarım AI'den |
| Menü Builder | Otomatik |

---

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

---

## Deployment

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────>│   Supabase  │────>│   GitHub    │
│ (Dashboard) │     │ (Backend)   │     │ (Git)       │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│   Docker    │────>│  Dashboard   │
│ (site-engine)│     │   API        │
└─────────────┘     └─────────────┘
```

---

## İlişkili Dokümanlar

| Doküman | Repository | Amaç |
|----------|------------|------|
| `docs/api/dashboard-api-contract.md` | Dashboard | Dashboard API tam referansı |
| `docs/api/webhook-architecture.md` | Dashboard | Webhook planı |
| `docs/site-engine-integration.md` | Dashboard | Site-Engine için entegrasyon kılavuzu |

---

## Geliştirme Notları

1. **site-engine** AI ile unique site üretir (vibe coding)
2. **Dashboard** sadece yönetim ve inbox için
3. **Webhook** ile site-engine publish eventlerini Dashboard'a bildirir
4. **Her iki repository** aynı Supabase instance'ını kullanır
5. **Public formlar** her zaman Dashboard API üzerinden gider (`/api/public/*`)

---

## Gelecek Özellikler

- [ ] site-engine repository oluşturma
- [ ] AI site generator implementasyonu
- [ ] Webhook entegrasyonu (site-engine → Dashboard)
- [ ] Panel API client library (paylaşılan)
