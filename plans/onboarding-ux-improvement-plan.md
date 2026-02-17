# Onboarding UX İyileştirmesi - Kapsamlı İmplementasyon Planı

## 📊 Mevcut Durum

### Tamamlanan İşler (Sprint 1)
- ✅ Yeni `(onboarding)` layout grubu oluşturuldu
- ✅ Welcome screen (`/onboarding/welcome`)
- ✅ Organization screen (`/onboarding/organization`)
- ✅ Completion screen (`/onboarding/complete`)
- ✅ Dashboard layout yönlendirmesi güncellendi

### Dosya Yapısı
```
apps/web/src/app/
├── (onboarding)/                    # YENİ - Onboarding layout grubu
│   ├── layout.tsx                   # ✅ Oluşturuldu
│   └── onboarding/
│       ├── welcome/page.tsx         # ✅ Oluşturuldu
│       ├── organization/page.tsx    # ✅ Oluşturuldu
│       └── complete/page.tsx        # ✅ Oluşturuldu
├── (dashboard)/
│   ├── layout.tsx                   # ✅ Güncellendi
│   └── onboarding/page.tsx          # ⚠️ Eski - Kaldırılacak
└── layout.tsx                       # Root layout (AuthProvider burada)
```

---

## 🐛 Tespit Edilen Bug'lar ve Sorunlar

### Kritik (P0)

#### 1. Auth Guard Eksikliği - Onboarding Layout
**Dosya:** `apps/web/src/app/(onboarding)/layout.tsx`
**Sorun:** Yeni onboarding layout'unda auth kontrolü yok. Giriş yapmamış kullanıcılar `/onboarding/welcome` adresine doğrudan erişebilir.
**Çözüm:** Layout'a `AuthProvider` zaten root layout'ta var ama onboarding sayfalarına auth guard eklenmeli.

```typescript
// apps/web/src/app/(onboarding)/layout.tsx - Güncelleme gerekli
function OnboardingGate({ children }) {
    const auth = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (auth.status === 'unauthenticated') {
            router.replace('/login');
        }
    }, [auth.status, router]);

    // Zaten tenant'ı varsa dashboard'a yönlendir
    useEffect(() => {
        if (auth.me?.tenant) {
            router.replace('/home');
        }
    }, [auth.me, router]);

    if (auth.status === 'loading') {
        return <LoadingScreen />;
    }

    if (!auth.session) {
        return <div className="min-h-screen" />;
    }

    return <>{children}</>;
}
```

#### 2. Sonsuz Yönlendirme Döngüsü Riski
**Dosya:** `apps/web/src/app/(dashboard)/layout.tsx:42-47`
**Sorun:** Dashboard layout `/onboarding/welcome`'a yönlendiriyor ama bu URL `(onboarding)` layout grubunda. Next.js route grupları farklı layout'lar kullanır, bu yüzden yönlendirme çalışmalı. Ancak eğer `(onboarding)` layout'u da auth kontrolü yapıp dashboard'a yönlendirirse döngü oluşabilir.
**Çözüm:** Auth durumuna göre net koşullar tanımlanmalı:
- `session yok` → `/login`
- `session var, tenant yok` → `/onboarding/welcome`
- `session var, tenant var` → `/home`

#### 3. Complete Sayfasına Doğrudan Erişim
**Dosya:** `apps/web/src/app/(onboarding)/onboarding/complete/page.tsx`
**Sorun:** Kullanıcı organizasyon oluşturmadan doğrudan `/onboarding/complete` adresine gidebilir.
**Çözüm:** Complete sayfasında `auth.me?.tenant` kontrolü yapılmalı. Tenant yoksa `/onboarding/organization`'a yönlendirilmeli.

### Yüksek (P1)

#### 4. Eski Onboarding Sayfası Hala Mevcut
**Dosya:** `apps/web/src/app/(dashboard)/onboarding/page.tsx`
**Sorun:** Eski onboarding sayfası hala `(dashboard)` layout grubunda duruyor. Kullanıcı `/onboarding` adresine giderse bu sayfa yüklenebilir.
**Çözüm:** Eski sayfayı kaldır veya yeni akışa redirect ekle.

#### 5. Organization Sayfasında Auth Token Güvenliği
**Dosya:** `apps/web/src/app/(onboarding)/onboarding/organization/page.tsx:52`
**Sorun:** `auth.accessToken` doğrudan fetch header'ına ekleniyor. Token null olabilir.
**Çözüm:** Token null kontrolü eklenmeli.

```typescript
if (!auth.accessToken) {
    toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
    router.replace('/login');
    return;
}
```

#### 6. Race Condition - refreshMe ve Router Push
**Dosya:** `apps/web/src/app/(onboarding)/onboarding/organization/page.tsx:67-73`
**Sorun:** `auth.refreshMe()` tamamlandıktan sonra 500ms bekleniyor ve ardından `router.push('/onboarding/complete')` çağrılıyor. Ancak `refreshMe` başarılı olursa `auth.me?.tenant` set edilir ve dashboard layout'undaki guard kullanıcıyı `/home`'a yönlendirebilir.
**Çözüm:** Complete sayfası `(onboarding)` layout grubunda olduğu için dashboard guard tetiklenmez. Ancak `refreshMe` sonrası `auth.me?.tenant` set edildiğinde onboarding layout'undaki guard kullanıcıyı `/home`'a yönlendirebilir. Bu durumda complete sayfası hiç gösterilmeyebilir.

**Çözüm Stratejisi:**
```typescript
// Organization sayfasında:
// refreshMe'yi complete sayfasına geçtikten SONRA çağır
router.push('/onboarding/complete');
// VEYA
// Complete sayfasında refreshMe çağır
```

### Orta (P2)

#### 7. Loading State Eksikliği
**Dosya:** Tüm onboarding sayfaları
**Sorun:** Sayfa geçişlerinde loading state yok.
**Çözüm:** Her sayfa için `loading.tsx` dosyası oluşturulmalı.

#### 8. Error Boundary Eksikliği
**Dosya:** `apps/web/src/app/(onboarding)/`
**Sorun:** Onboarding layout grubunda error boundary yok.
**Çözüm:** `error.tsx` dosyası oluşturulmalı.

---

## 🔒 Güvenlik Analizi

### 1. CSRF Koruması
**Durum:** API endpoint'i (`/api/onboarding/tenant`) sadece Bearer token kontrolü yapıyor. CSRF token kontrolü yok.
**Risk:** Orta - Bearer token zaten CSRF'e karşı koruma sağlar (cookie-based değil).
**Öneri:** Mevcut yapı yeterli.

### 2. Rate Limiting
**Dosya:** `apps/api/src/app/api/onboarding/tenant/route.ts`
**Durum:** Rate limiting uygulanmamış.
**Risk:** Yüksek - Kötü niyetli kullanıcı çok sayıda organizasyon oluşturabilir.
**Çözüm:** Rate limiter eklenmeli (mevcut `rate-limit.ts` kullanılabilir).

### 3. Input Sanitization
**Dosya:** `apps/api/src/app/api/onboarding/tenant/route.ts:39-46`
**Durum:** XSS sanitization mevcut ama yetersiz.
**Risk:** Düşük - HTML entity encoding yapılıyor.
**Öneri:** DOMPurify veya benzeri bir kütüphane kullanılabilir.

### 4. Tenant Oluşturma Limiti
**Durum:** Bir kullanıcının kaç tenant oluşturabileceği kontrol edilmiyor.
**Risk:** Orta - Spam tenant oluşturma.
**Çözüm:** Kullanıcı başına tenant limiti eklenmeli.

---

## 📋 Detaylı İmplementasyon Planı

### Sprint 2: Teknik Entegrasyon ve Güvenlik

#### Görev 2.1: Onboarding Layout Auth Guard
**Dosya:** `apps/web/src/app/(onboarding)/layout.tsx`
**Değişiklik:**
- Auth kontrolü ekleme (unauthenticated → login, has tenant → home)
- Loading state ekleme
- Session timeout uyarısı ekleme

#### Görev 2.2: Complete Sayfası Guard
**Dosya:** `apps/web/src/app/(onboarding)/onboarding/complete/page.tsx`
**Değişiklik:**
- `auth.me?.tenant` kontrolü ekleme
- Tenant yoksa organization'a yönlendirme
- refreshMe çağrısını burada yapma (organization'dan kaldır)

#### Görev 2.3: Organization Sayfası Race Condition Fix
**Dosya:** `apps/web/src/app/(onboarding)/onboarding/organization/page.tsx`
**Değişiklik:**
- refreshMe'yi kaldır, sadece router.push yap
- Complete sayfasında refreshMe çağır
- Token null kontrolü ekle

#### Görev 2.4: Loading State'leri
**Yeni Dosyalar:**
- `apps/web/src/app/(onboarding)/onboarding/welcome/loading.tsx`
- `apps/web/src/app/(onboarding)/onboarding/organization/loading.tsx`
- `apps/web/src/app/(onboarding)/onboarding/complete/loading.tsx`

#### Görev 2.5: Error Boundary
**Yeni Dosya:** `apps/web/src/app/(onboarding)/error.tsx`
**İçerik:** Kullanıcı dostu hata mesajı, tekrar dene butonu

#### Görev 2.6: Eski Onboarding Sayfası Temizliği
**Dosya:** `apps/web/src/app/(dashboard)/onboarding/page.tsx`
**Değişiklik:** Yeni akışa redirect ekle veya dosyayı kaldır

### Sprint 3: API ve Backend İyileştirmeleri

#### Görev 3.1: Rate Limiting
**Dosya:** `apps/api/src/app/api/onboarding/tenant/route.ts`
**Değişiklik:**
- Rate limiter import et ve uygula
- Kullanıcı başına 3 tenant/saat limiti

#### Görev 3.2: Tenant Oluşturma Limiti
**Dosya:** `apps/api/src/app/api/onboarding/tenant/route.ts`
**Değişiklik:**
- Kullanıcının mevcut tenant sayısını kontrol et
- Maksimum tenant limiti uygula (örn: 5)

#### Görev 3.3: Onboarding Step Tracking API (Opsiyonel)
**Yeni Dosya:** `apps/api/src/app/api/onboarding/step/route.ts`
**İçerik:**
- POST: Onboarding adımını kaydet
- GET: Mevcut onboarding durumunu getir

### Sprint 4: Test ve Analytics

#### Görev 4.1: Unit Testler
**Yeni Dosyalar:**
- `apps/web/src/__tests__/onboarding/welcome.test.tsx`
- `apps/web/src/__tests__/onboarding/organization.test.tsx`
- `apps/web/src/__tests__/onboarding/complete.test.tsx`

**Test Senaryoları:**
1. Welcome sayfası render kontrolü
2. Organization form validasyonu (min/max karakter)
3. Organization oluşturma API çağrısı (başarılı/başarısız)
4. Complete sayfası auto-redirect
5. Auth guard yönlendirmeleri
6. Unauthenticated kullanıcı erişim engeli
7. Zaten tenant'ı olan kullanıcı yönlendirmesi

#### Görev 4.2: E2E Testler
**Yeni Dosya:** `apps/web/e2e/onboarding.spec.ts`

**Test Senaryoları:**
1. Tam onboarding akışı (welcome → org → complete → dashboard)
2. Geri butonu navigasyonu
3. Form validasyon hataları
4. API hata durumları
5. Mobil responsive kontrol

#### Görev 4.3: Analytics Entegrasyonu
**Yeni Dosya:** `apps/web/src/lib/onboarding-analytics.ts`

**Takip Edilecek Event'ler:**
- `onboarding_started` - Welcome sayfası görüntülendi
- `onboarding_org_form_viewed` - Organization formu görüntülendi
- `onboarding_org_created` - Organizasyon oluşturuldu
- `onboarding_completed` - Complete sayfası görüntülendi
- `onboarding_dashboard_redirect` - Dashboard'a yönlendirildi
- `onboarding_step_time` - Her adımda geçirilen süre

---

## 🎨 UX İyileştirme Önerileri

### 1. Keyboard Navigation
- Welcome: Enter ile devam
- Organization: Enter ile form submit
- Tab navigasyonu

### 2. Responsive Tasarım Kontrolleri
- Mobil: Tek sütun layout
- Tablet: 2 sütun feature grid
- Desktop: 3 sütun feature grid

### 3. Accessibility (a11y)
- ARIA labels ekleme
- Focus management
- Screen reader uyumluluğu
- Renk kontrastı kontrolü

### 4. Performans
- Lazy loading (dynamic import)
- Image optimization
- Prefetch sonraki sayfa

---

## 📊 Öncelik Matrisi

| Görev | Öncelik | Etki | Risk |
|-------|---------|------|------|
| Auth Guard (2.1) | P0 | Yüksek | Güvenlik açığı |
| Complete Guard (2.2) | P0 | Yüksek | Kırık akış |
| Race Condition Fix (2.3) | P0 | Yüksek | Bug |
| Loading States (2.4) | P1 | Orta | UX |
| Error Boundary (2.5) | P1 | Orta | UX |
| Eski Sayfa Temizliği (2.6) | P1 | Düşük | Teknik borç |
| Rate Limiting (3.1) | P1 | Yüksek | Güvenlik |
| Tenant Limiti (3.2) | P2 | Orta | Güvenlik |
| Step Tracking (3.3) | P3 | Düşük | Opsiyonel |
| Unit Testler (4.1) | P1 | Yüksek | Kalite |
| E2E Testler (4.2) | P2 | Orta | Kalite |
| Analytics (4.3) | P3 | Düşük | İzleme |
