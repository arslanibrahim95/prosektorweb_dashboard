# 🔄 Refactoring Planı: Büyük Dosyaların Modülerleştirilmesi

## 🚨 Kural: Maksimum 500 Satır / Dosya

> [!IMPORTANT]
> **Hiçbir `.ts` / `.tsx` dosyası 500 satırı geçmemelidir.**
> - Yeni dosya oluştururken bu limiti aşmamaya dikkat et.
> - Mevcut dosyalarda 500 satırı aşan dosyalar tespit edilirse, mantıksal bölme noktalarından ikiye veya daha fazla modüle ayrılmalıdır.
> - Test dosyaları da bu kurala tabidir — `describe` blokları bazında bölünebilir.
> - Bu kural barrel/index dosyları ve type-only dosyalar dahil tüm dosyalar için geçerlidir.

## 📊 Özet

| Dosya | Mevcut Satır | Önerilen Modül Sayısı | Hedef Satır/Dosya |
|-------|---------------|----------------------|-------------------|
| `apps/api/src/openapi/spec.ts` | 2529 | 8-10 | ≤ 500 |
| `apps/web/src/lib/ui-utils/micro-interactions.tsx` | 952 | 6-8 | ≤ 500 |
| `apps/web/src/lib/ui-utils/performance.tsx` | 926 | 7-9 | ≤ 500 |
| `apps/web/src/lib/ui-utils/ai-accessibility.tsx` | 907 | 6-8 | ≤ 500 |


---

## 1️⃣ OpenAPI Spec Dosyası (2529 satır)

### 🔍 Analiz

**Mevcut Yapı:**
- Tüm API endpoint'leri tek dosyada
- Tags: Authentication, User, Dashboard, Analytics, Inbox, Content, Sites, Domains, Modules, HR, Team, Public, Admin, Publishing
- Components: securitySchemes, parameters, schemas, responses

**Sorunlar:**
- Tek dosyada bakım zorluğu
- Merge conflict riski yüksek
- Endpoint eklemek/zorlaştırmak karmaşık
- TypeScript build süresini uzatır

### 📦 Önerilen Dosya Yapısı

```
apps/api/src/openapi/
├── spec.ts                    # Ana spec dosyası (import birleştirme)
├── info.ts                    # API info, servers, tags (~100 satır)
├── paths/
│   ├── auth.ts               # /auth/* endpoints
│   ├── user.ts               # /me endpoint
│   ├── dashboard.ts           # /dashboard/* endpoints
│   ├── analytics.ts           # /analytics/* endpoints
│   ├── inbox.ts               # /inbox/* endpoints (hr-applications, contact, offers)
│   ├── content.ts             # /pages/*, /legal-texts/*
│   ├── sites.ts               # /sites/* endpoints
│   ├── domains.ts             # /domains/*
│   ├── modules.ts             # /modules/*
│   ├── hr.ts                  # /hr/* endpoints
│   ├── team.ts                # /tenant-members/*
│   ├── publishing.ts           # /publish
│   ├── public.ts               # /public/* endpoints
│   └── admin.ts               # /admin/* endpoints
└── components/
    ├── index.ts               # Components export
    ├── security.ts            # securitySchemes
    ├── parameters.ts          # Shared parameters (SiteId, Page, Limit, Search)
    ├── schemas.ts             # ErrorResponse, PaginatedResponse, SuccessResponse
    └── responses.ts           # Standard responses (BadRequest, Unauthorized, etc.)
```

### 🗂️ Bölme Kriterleri

| Modül | Endpoint Sayısı | Tahmini Satır |
|-------|----------------|---------------|
| `info.ts` | - | ~100 |
| `paths/auth.ts` | 1 | ~60 |
| `paths/user.ts` | 1 | ~70 |
| `paths/dashboard.ts` | 1 | ~70 |
| `paths/analytics.ts` | 2 | ~110 |
| `paths/inbox.ts` | 10 | ~400 |
| `paths/content.ts` | 8 | ~350 |
| `paths/sites.ts` | 5 | ~200 |
| `paths/domains.ts` | 3 | ~120 |
| `paths/modules.ts` | 2 | ~80 |
| `paths/hr.ts` | 5 | ~200 |
| `paths/team.ts` | 4 | ~150 |
| `paths/public.ts` | 3 | ~150 |
| `paths/admin.ts` | 6 | ~300 |
| `components/*.ts` | - | ~150 |
| **Toplam** | **~50** | **~2500** |

### 🔗 Import Yapısı

```typescript
// apps/api/src/openapi/spec.ts
import { openApiInfo } from './info';
import { authPaths } from './paths/auth';
import { userPaths } from './paths/user';
// ... diğer importlar

export const openApiSpec = {
  ...openApiInfo,
  paths: {
    ...authPaths,
    ...userPaths,
    // ...
  },
  components: {
    securitySchemes: securitySchemes,
    parameters: sharedParameters,
    schemas: sharedSchemas,
    responses: standardResponses,
  },
} as const;
```

### ✅ Uygulama Adımları

1. **Phase 1**: `info.ts`, `components/` dosyalarını oluştur
2. **Phase 2**: Endpoint'leri kategorilere göre ayır (paths/)
3. **Phase 3**: Ana `spec.ts` dosyasını yeniden yapılandır
4. **Phase 4**: Test ve doğrulama

---

## 2️⃣ Micro-Interactions Dosyası (952 satır)

### 🔍 Analiz

**Mevcut Bileşenler:**
- `ANIMATION_CONFIG` - Animasyon sabitleri
- `usePrefersReducedMotion` - Hook
- `useThrottledAnimation` - Hook
- `StaggerContainer` - Bileşen
- `MagneticButton` - Bileşen
- `TextReveal` - Bileşen
- `CountUp` - Bileşen
- `Shimmer` - Bileşen
- `SkeletonCard` - Bileşen
- `PageTransition` - Bileşen
- `HoverLift` - Bileşen
- `Confetti` - Bileşen
- `PulseRing` - Bileşen
- `MorphingIcon` - Bileşen

**Sorunlar:**
- Tek dosyada 14 farklı export
- Her bileşen farklı sorumluluk
- Bakım zorluğu
- Test yazımı karmaşık

### 📦 Önerilen Dosya Yapısı

```
apps/web/src/lib/ui-utils/
├── index.ts                   # Ana export dosyası
├── config.ts                  # ANIMATION_CONFIG (~50 satır)
├── hooks/
│   ├── index.ts
│   ├── use-prefers-reduced-motion.ts  # (~20 satır)
│   └── use-throttled-animation.ts     # (~60 satır)
└── components/
    ├── index.ts
    ├── stagger-container/
    │   ├── index.ts
    │   └── stagger-container.tsx      # (~80 satır)
    ├── magnetic-button/
    │   ├── index.ts
    │   └── magnetic-button.tsx         # (~90 satır)
    ├── text-reveal/
    │   ├── index.ts
    │   └── text-reveal.tsx            # (~70 satır)
    ├── count-up/
    │   ├── index.ts
    │   └── count-up.tsx               # (~120 satır)
    ├── shimmer/
    │   ├── index.ts
    │   ├── shimmer.tsx                # (~40 satır)
    │   └── skeleton-card.tsx          # (~40 satır)
    ├── page-transition/
    │   ├── index.ts
    │   └── page-transition.tsx        # (~60 satır)
    ├── hover-lift/
    │   ├── index.ts
    │   └── hover-lift.tsx             # (~50 satır)
    ├── confetti/
    │   ├── index.ts
    │   └── confetti.tsx               # (~100 satır)
    ├── pulse-ring/
    │   ├── index.ts
    │   └── pulse-ring.tsx             # (~40 satır)
    └── morphing-icon/
        ├── index.ts
        └── morphing-icon.tsx           # (~70 satır)
```

### 📊 Bölme Detayları

| Klasör | İçerik | Satır |
|--------|---------|-------|
| `config.ts` | ANIMATION_CONFIG | ~50 |
| `hooks/` | 2 hook | ~80 |
| `stagger-container/` | StaggerContainer | ~80 |
| `magnetic-button/` | MagneticButton | ~90 |
| `text-reveal/` | TextReveal | ~70 |
| `count-up/` | CountUp | ~120 |
| `shimmer/` | Shimmer, SkeletonCard | ~80 |
| `page-transition/` | PageTransition | ~60 |
| `hover-lift/` | HoverLift | ~50 |
| `confetti/` | Confetti | ~100 |
| `pulse-ring/` | PulseRing | ~40 |
| `morphing-icon/` | MorphingIcon | ~70 |
| **Toplam** | | **~790** |

### 🔗 Import Yapısı

```typescript
// apps/web/src/lib/ui-utils/index.ts
export { ANIMATION_CONFIG } from './config';
export { usePrefersReducedMotion, useThrottledAnimation } from './hooks';
export { StaggerContainer } from './components/stagger-container';
// ... diğer exportlar
```

---

## 3️⃣ Performance Dosyası (926 satır)

### 🔍 Analiz

**Mevcut Bileşenler:**
- Type tanımlamaları (WebVitalName, WebVitalMetric, etc.)
- `WEB_VITAL_THRESHOLDS` - Sabitler
- `PerformanceErrorBoundary` - Class component
- `PerformanceMonitor` - Bileşen
- `LazyLoad` - Bileşen
- `OptimizedImage` - Bileşen
- `VirtualScroll` - Bileşen
- `PerformanceBudget` - Bileşen
- `LoadingSkeleton` - Bileşen
- `ResourceHint` - Bileşen
- `Deferred` - Bileşen
- `useINPTracker` - Hook
- `PerformanceReport` - Bileşen

### 📦 Önerilen Dosya Yapısı

```
apps/web/src/lib/ui-utils/
├── performance/
│   ├── index.ts
│   ├── types.ts               # Tüm type tanımlamaları (~40 satır)
│   ├── constants.ts           # WEB_VITAL_THRESHOLDS (~15 satır)
│   ├── error-boundary.tsx     # PerformanceErrorBoundary (~30 satır)
│   ├── performance-monitor/
│   │   ├── index.ts
│   │   └── performance-monitor.tsx  # (~250 satır)
│   ├── lazy-load/
│   │   ├── index.ts
│   │   └── lazy-load.tsx      # (~50 satır)
│   ├── optimized-image/
│   │   ├── index.ts
│   │   └── optimized-image.tsx # (~80 satır)
│   ├── virtual-scroll/
│   │   ├── index.ts
│   │   └── virtual-scroll.tsx # (~85 satır)
│   ├── performance-budget/
│   │   ├── index.ts
│   │   └── performance-budget.tsx # (~40 satır)
│   ├── loading-skeleton/
│   │   ├── index.ts
│   │   └── loading-skeleton.tsx   # (~35 satır)
│   ├── resource-hint/
│   │   ├── index.ts
│   │   └── resource-hint.tsx     # (~45 satır)
│   ├── deferred/
│   │   ├── index.ts
│   │   └── deferred.tsx           # (~35 satır)
│   ├── hooks/
│   │   ├── index.ts
│   │   └── use-inp-tracker.ts    # (~50 satır)
│   └── performance-report/
│       ├── index.ts
│       └── performance-report.tsx # (~100 satır)
```

---

## 4️⃣ AI-Accessibility Dosyası (907 satır)

### 🔍 Analiz

**Mevcut Bileşenler:**
- Type tanımlamaları (Theme, Density, MotionPreference, ColorScheme)
- Error sınıfı (StorageError)
- Utility fonksiyonları (safeStorageSet, safeStorageGet)
- Context'ler (ThemeStateContext, ThemeDispatchContext)
- Hook'lar (useThemeState, useThemeDispatch, useSmartTheme)
- Provider (SmartThemeProvider)
- Bileşenler (AccessibleButton, SkipLink, LiveRegion, useAnnouncer)
- FocusTrap, VisuallyHidden, AccessibleTabs
- AIThemeToggle, AccessibilityBadge, ReducedMotion

### 📦 Önerilen Dosya Yapısı

```
apps/web/src/lib/ui-utils/
├── accessibility/
│   ├── index.ts
│   ├── types.ts               # Type tanımlamaları (~30 satır)
│   ├── storage.ts             # StorageError, safeStorageSet/Get (~45 satır)
│   ├── context/
│   │   ├── index.ts
│   │   ├── theme-context.tsx  # Context'ler (~30 satır)
│   │   └── theme-provider.tsx # SmartThemeProvider (~150 satır)
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── use-theme-state.ts
│   │   ├── use-theme-dispatch.ts
│   │   └── use-announcer.ts    # (~20 satır)
│   ├── accessible-button/
│   │   ├── index.ts
│   │   └── accessible-button.tsx  # (~70 satır)
│   ├── skip-link/
│   │   ├── index.ts
│   │   └── skip-link.tsx      # (~25 satır)
│   ├── live-region/
│   │   ├── index.ts
│   │   └── live-region.tsx    # (~30 satır)
│   ├── focus-trap/
│   │   ├── index.ts
│   │   └── focus-trap.tsx     # (~70 satır)
│   ├── visually-hidden/
│   │   ├── index.ts
│   │   └── visually-hidden.tsx # (~25 satır)
│   ├── accessible-tabs/
│   │   ├── index.ts
│   │   └── accessible-tabs.tsx # (~120 satır)
│   ├── ai-theme-toggle/
│   │   ├── index.ts
│   │   └── ai-theme-toggle.tsx # (~85 satır)
│   ├── accessibility-badge/
│   │   ├── index.ts
│   │   └── accessibility-badge.tsx # (~40 satır)
│   └── reduced-motion/
│       ├── index.ts
│       └── reduced-motion.tsx  # (~20 satır)
```

---

## 🎯 Tekrar Eden Kod Kalıpları (DRY)

### 1. usePrefersReducedMotion Hook Tekrarı

**Sorun:** `usePrefersReducedMotion` hem `micro-interactions.tsx` hem `ai-accessibility.tsx` içinde var.

**Çözüm:** Tek bir hook dosyasına taşı
```typescript
// apps/web/src/lib/ui-utils/hooks/use-prefers-reduced-motion.ts
```

### 2. Error Handling Tekrarı

**Sorun:** Her provider'da benzer error handling pattern'i.

**Çözüm:** Ortak error handler hook oluştur.

### 3. Animation Config Tekrarı

**Sorun:** `ANIMATION_CONFIG` sadece micro-interactions'ta var ama diğer dosyalarda da benzer sabitler olabilir.

**Çözüm:** Merkezi config dosyası oluştur.

---

## 📋 Uygulama Öncelik Sırası

| Öncelik | Dosya | Sebep |
|---------|-------|-------|
| 1 | `openapi/spec.ts` | En büyük dosya, en çok bakım zorluğu |
| 2 | `micro-interactions.tsx` | En fazla bileşen, sık kullanılan UI |
| 3 | `performance.tsx` | Performance monitoring, nadir kullanım |
| 4 | `ai-accessibility.tsx` | Erişilebilirlik, orta kullanım |

---

## ⚠️ Dikkat Edilmesi Gerekenler

### Backward Compatibility
- Tüm export isimleri aynı kalmalı
- `index.ts` dosyaları eski import yollarını desteklemeli

### Test Coverage
- Her modül için ayrı test dosyası
- Integration testleri korunmalı

### Bundle Size
- Tree-shaking için barrel export'tan kaçınılmalı
- Lazy import desteği

### Migration Stratejisi
1. Yeni dosyaları oluştur
2. Eski dosyada re-export yap
3. Kullanımları kademeli olarak güncelle
4. Tamamlandığında eski dosyayı sil

---

## 📈 Bağımlılık Haritası

```
openapi/
├── info.ts (minimal bağımlılık)
├── paths/* (info.ts'e bağımlı)
└── components/* (bağımsız)

micro-interactions/
├── config.ts (bağımsız)
├── hooks/* (bağımsız)
└── components/* (hooks ve config'e bağımlı)

performance/
├── types.ts (bağımsız)
├── constants.ts (bağımsız)
├── error-boundary.tsx (types'a bağımlı)
└── components/* (birbirine bağımlı)

accessibility/
├── types.ts (bağımsız)
├── storage.ts (logger'a bağımlı)
├── context/* (types ve storage'a bağımlı)
├── hooks/* (context'e bağımlı)
└── components/* (hooks ve context'e bağımlı)
```

---

## 5️⃣ Phase 5: Kalan >500 Satır Dosyaların Bölünmesi

**Hedef:** Tüm Codebase'de 500 satır kuralının uygulanması.

### `apps/web`
1. `apps/web/src/app/(dashboard)/admin/users/page.tsx` (681 satır) -> Tablolar, filtreler ve modal'lar ayrı componentlere taşınacak.
2. `apps/web/src/app/(dashboard)/admin/i18n/page.tsx` (674 satır) -> Tablo, import/export araçları ayrı componentlere taşınacak.
3. `apps/web/src/app/(dashboard)/admin/notifications/page.tsx` (597 satır) -> Form ve liste yapıları ayrılacak.
4. `apps/web/src/app/(dashboard)/modules/contact/page.tsx` (519 satır) -> İletişim formu ve listesi modüller arası ayrılacak.

### `apps/api`
1. `apps/api/src/server/security/file-validation.ts` (686 satır) -> TypeGuard'lar, Const'lar, Core Validation ayrı dosyalara modülerleştirilecek.
2. `apps/api/src/server/auth/dual-auth.ts` (600 satır) -> Supabase işlemleri, role yönetim, utilities ayrılacak.
3. `apps/api/src/server/ab-testing/statistics.ts` (507 satır) -> İstatistik algoritmaları, Z-test / T-test logic'leri ayrı modüllere ayrılacak.
