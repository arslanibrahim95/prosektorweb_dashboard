# CLAUDE.md - ProsektorWeb Dashboard Anayasası

> **Versiyon:** 2.0.0 | **Son Güncelleme:** 2026-02-18
> **Vizyon:** Vibe Coding + Özel Siteler (Her firma için benzersiz)
> **Bu dosya, Claude'un bu projeyle çalışırken uyması gereken temel kuralları içerir.**

---

## 🎯 Proje Kimliği

**Proje Adı:** ProsektorWeb Dashboard  
**Tip:** Multi-tenant Yönetim Paneli (OSGB'ler için)  
**Teknoloji Stack:** Next.js 15 (App Router) + Supabase + Tailwind CSS v4 + shadcn/ui  
**Hedef:** Ship edilebilir MVP

### ⚠️ ÖNEMLİ: Vibe Coding Vizyonu

```
┌─────────────────────────────────────────────────────────────┐
│  site-engine (Ayrı Repo)    │  Dashboard (Bu Repo)          │
│  ─────────────────────────  │  ─────────────────────────    │
│  ✅ AI ile site üretimi     │  ✅ Site yönetimi              │
│  ✅ Vibe coding             │  ✅ Inbox (Teklif, İletişim)   │
│  ✅ Custom tasarım          │  ✅ HR (İlan + Başvuru)        │
│  ✅ Unique içerik           │  ✅ Domain & SSL               │
│                             │  ✅ Publish kontrolü           │
│  ❌ YOK: Şablon             │  ❌ YOK: Page Builder          │
│  ❌ YOK: Blok editör        │  ❌ YOK: Şablon sistemi        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Temel Kurallar (Asla İhlal Edilemez)

### 1. MVP Prensibi
```
❌ YAPMA: Page Builder, Blok Editör, Şablon Sistemi
✅ YAP: Inbox + Domain + HR + Basit düzenleme
❌ YAPMA: Pipeline/CRM özellikleri ekleme
```

### 2. Multi-Tenant Zorunluluğu
```typescript
// HER tabloda tenant_id ZORUNLU
// RLS (Row Level Security) ZORUNLU
// tenant_id olmadan veri erişimi YASAK
```

### 3. Güvenlik Kuralları
```
❌ Asla .env dosyalarını commit etme
❌ Asla credentials'ları kod içinde hardcode etme
❌ Asla public endpoint'lerde auth kontrolü atlama
✅ Her zaman rate-limit + honeypot kullan (public forms)
✅ Her zaman KVKK consent zorunlu kıl
```

### 4. Kod Kalitesi
```bash
# Her değişiklik sonrası ÇALIŞTIR:
pnpm lint
pnpm typecheck
pnpm test (kritik iş mantığı için)
```

### 5. Commit Kuralları
```
❌ Asla kullanıcı istemeden commit yapma
✅ Conventional commit formatı kullan:
   feat: yeni özellik
   fix: hata düzeltme
   refactor: kod iyileştirme
   docs: dokümantasyon
   test: test ekleme/düzeltme
```

---

## 🤖 Çalışma Stili (Robot Karakteri)

### Odaklanma Prensibi
```
KONUŞMA UZADIĞINDA → Memory Bank'a bak
                  → activeContext.md oku
                  → "Şu an ne yapıyorduk?" sorusuna cevap bul
```

### Adım Adım Çalışma
```
1. Önce araştır (grep, glob, read)
2. Sonra planla (ne değişecek?)
3. Sonra uygula (edit, write)
4. Sonra doğrula (lint, typecheck, test)
```

### Sorumluluk Alanları
```
┌─────────────────────────────────────────────────────────────┐
│ BU PROJEDE SORUMLU OLDUĞUM ALANLAR:                         │
├─────────────────────────────────────────────────────────────┤
│ ✅ Frontend (Next.js, React, Tailwind)                      │
│ ✅ Backend (Supabase, Server Actions)                       │
│ ✅ Database (PostgreSQL, RLS, Migrations)                   │
│ ✅ API Routes                                               │
│ ✅ UI Components (shadcn/ui)                                │
│ ✅ Form Validation (Zod, React Hook Form)                   │
│ ❌ Site üretimi (site-engine repo'sunda)                    │
│ ❌ AI/Vibe Coding (site-engine repo'sunda)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Proje Yapısı (Kısa Referans)

```
/apps/web/           → Dashboard UI (Next.js App Router)
/apps/api/           → Dashboard API routes
/packages/db/        → SQL migrations, RLS policies
/packages/contracts/ → Zod schemas, TypeScript types
/docs/               → Tüm dokümantasyon
/.claude/memory/     → Memory Bank (activeContext, progress)
```

---

## 🔗 Önemli Dosyalar

| Dosya | Amaç |
|-------|------|
| `CLAUDE.md` | Bu dosya - Anayasa |
| `SKILLS.md` | Özel yetenekler ve prosedürler |
| `.claude/memory/activeContext.md` | Şu an ne yapılıyor? |
| `.claude/memory/progress.md` | Neler bitirildi? |
| `docs/agents.md` | Detaylı teknik spesifikasyon |
| `docs/architecture.md` | Sistem mimarisi |

---

## 🚨 Acil Durum Protokolü

### Hata Algılandığında
```
1. Hatayı log'la
2. Kullanıcıya açıkla
3. Çözüm öner
4. İzin almadan düzeltme yapma
```

### Bağlam Kaybedildiğinde
```
1. activeContext.md oku
2. progress.md oku
3. Son commit'lere bak
4. Kullanıcıya sor: "Şu an X yapıyorduk, devam edeyim mi?"
```

---

## 💡 Hatırlatmalar

```
🧠 "Ben unutkan bir robotum, Memory Bank benim notlarım"
📝 "Her önemli adımda progress.md güncelle"
🎯 "Odaklan - sadece bir şey yap"
✅ "Bitmiş = Çalışıyor + Test Edildi + Dokümante Edildi"
🎨 "Site üretimi site-engine'de, Dashboard sadece yönetim"
```

---

## 📞 Dokümantasyon Bağlantıları

Detaylı bilgi için:
- **Teknik Spesifikasyon:** `docs/agents.md`
- **Sistem Mimarisi:** `docs/architecture.md`
- **API Kontratları:** `docs/api/`
- **Veritabanı Şeması:** `docs/db/schema.md`
- **UX/Dizayn:** `docs/ux/`

---

> **ÖNEMLİ:** Bu dosya projenin anayasasıdır. Her işe başlamadan önce bu dosyayı oku. Kurallar asla ihlal edilmemeli.
