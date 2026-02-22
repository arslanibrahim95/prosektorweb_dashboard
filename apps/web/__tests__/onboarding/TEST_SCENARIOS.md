# Onboarding Flow Test Scenarios

Bu dokümanda yeni onboarding akışı için manuel ve otomatik test senaryoları detaylandırılmıştır.

## Test Ortamı Hazırlığı

### Gereksinimler
- Test kullanıcı hesabı (yeni kayıt veya mevcut hesap)
- Temiz veritabanı durumu (tenant olmayan kullanıcı)
- Geliştirme ortamı çalışır durumda

### Test Verileri
```typescript
// Test kullanıcısı
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!'
};

// Test organizasyonu
const testOrganization = {
  name: 'Test Organization',
  slug: 'test-organization'
};
```

---

## 1. Authentication Guard Tests

### Test 1.1: Kimlik Doğrulaması Olmayan Erişim
**Amaç:** Oturum açmamış kullanıcıların onboarding sayfalarına erişememesi

**Adımlar:**
1. Tarayıcıda oturumu kapat (logout)
2. `/onboarding/welcome` adresine git
3. `/onboarding/organization` adresine git
4. `/onboarding/complete` adresine git

**Beklenen Sonuç:**
- Her üç sayfada da login sayfasına yönlendirilmeli
- URL'de `redirect` parametresi olmalı

**Öncelik:** P0 (Kritik)

---

### Test 1.2: Tenant Olan Kullanıcının Erişimi
**Amaç:** Zaten organizasyonu olan kullanıcıların onboarding'i atlayıp dashboard'a gitmesi

**Adımlar:**
1. Organizasyonu olan bir kullanıcı ile giriş yap
2. `/onboarding/welcome` adresine git
3. `/onboarding/organization` adresine git

**Beklenen Sonuç:**
- Dashboard'a (`/`) yönlendirilmeli
- Onboarding sayfaları görünmemeli

**Öncelik:** P0 (Kritik)

---

## 2. Welcome Page Tests

### Test 2.1: Welcome Sayfası Render
**Amaç:** Welcome sayfasının doğru içerikle yüklenmesi

**Adımlar:**
1. Tenant olmayan kullanıcı ile giriş yap
2. `/onboarding/welcome` adresine git

**Beklenen Sonuç:**
- "Hoş Geldiniz" başlığı görünmeli
- Platform özellikleri listelenmiş olmalı
- "Başlayalım" butonu aktif olmalı
- Loading state gösterilmemeli

**Öncelik:** P1 (Yüksek)

---

### Test 2.2: Welcome'dan Organization'a Geçiş
**Amaç:** "Başlayalım" butonunun doğru çalışması

**Adımlar:**
1. Welcome sayfasında "Başlayalım" butonuna tıkla

**Beklenen Sonuç:**
- `/onboarding/organization` sayfasına yönlendirilmeli
- Smooth transition olmalı
- Analytics event tetiklenmeli: `onboarding_welcome_viewed`

**Öncelik:** P1 (Yüksek)

---

## 3. Organization Page Tests

### Test 3.1: Form Render ve Validasyon
**Amaç:** Organizasyon oluşturma formunun doğru çalışması

**Adımlar:**
1. `/onboarding/organization` sayfasına git
2. Formu boş bırakıp "Organizasyon Oluştur" butonuna tıkla

**Beklenen Sonuç:**
- "Organizasyon adı gereklidir" hatası görünmeli
- "Slug gereklidir" hatası görünmeli
- Form submit edilmemeli

**Öncelik:** P1 (Yüksek)

---

### Test 3.2: Slug Auto-Generation
**Amaç:** Organizasyon adından otomatik slug oluşturulması

**Adımlar:**
1. Organization name alanına "Test Organization" yaz
2. Slug alanını gözlemle

**Beklenen Sonuç:**
- Slug otomatik olarak "test-organization" olmalı
- Türkçe karakterler dönüştürülmeli (ş→s, ı→i, vb.)
- Boşluklar tire (-) ile değiştirilmeli

**Öncelik:** P1 (Yüksek)

---

### Test 3.3: Slug Format Validation
**Amaç:** Slug formatının doğrulanması

**Adımlar:**
1. Slug alanına "Invalid Slug!" yaz
2. Form submit et

**Beklenen Sonuç:**
- "Slug sadece küçük harf, rakam ve tire içerebilir" hatası görünmeli
- Form submit edilmemeli

**Test Verileri:**
```typescript
const invalidSlugs = [
  'Invalid Slug!',    // Büyük harf ve özel karakter
  'test slug',        // Boşluk
  'test_slug',        // Alt çizgi
  'test@slug',        // @ işareti
  'UPPERCASE',        // Büyük harf
];

const validSlugs = [
  'test-slug',
  'test123',
  'my-org-2024',
  'organization-name',
];
```

**Öncelik:** P1 (Yüksek)

---

### Test 3.4: Başarılı Organizasyon Oluşturma
**Amaç:** Geçerli verilerle organizasyon oluşturulması

**Adımlar:**
1. Organization name: "Test Organization"
2. Slug: "test-organization"
3. "Organizasyon Oluştur" butonuna tıkla

**Beklenen Sonuç:**
- Loading state gösterilmeli
- API çağrısı başarılı olmalı
- `/onboarding/complete` sayfasına yönlendirilmeli
- Analytics events:
  - `onboarding_organization_created` (success)

**Öncelik:** P0 (Kritik)

---

### Test 3.5: Duplicate Slug Hatası
**Amaç:** Aynı slug ile ikinci organizasyon oluşturma denemesi

**Adımlar:**
1. Mevcut bir slug ile organizasyon oluşturmayı dene
2. Form submit et

**Beklenen Sonuç:**
- "Bu slug zaten kullanılıyor" hatası görünmeli
- Form submit edilmemeli
- Analytics event: `onboarding_organization_failed`

**Öncelik:** P1 (Yüksek)

---

### Test 3.6: Rate Limiting
**Amaç:** Saatte 3 organizasyon limitinin çalışması

**Adımlar:**
1. 3 farklı organizasyon oluştur (farklı sluglar)
2. 4. organizasyonu oluşturmayı dene

**Beklenen Sonuç:**
- "Rate limit aşıldı" hatası görünmeli (429 status)
- Form submit edilmemeli
- 1 saat sonra tekrar deneyebilmeli

**Öncelik:** P1 (Yüksek)

---

### Test 3.7: Tenant Limit
**Amaç:** Kullanıcı başına maksimum 5 organizasyon limitinin çalışması

**Adımlar:**
1. Kullanıcı için 5 organizasyon oluştur
2. 6. organizasyonu oluşturmayı dene

**Beklenen Sonuç:**
- "Maksimum organizasyon limitine ulaştınız" hatası görünmeli (403 status)
- Form submit edilmemeli

**Öncelik:** P1 (Yüksek)

---

### Test 3.8: Token Validation
**Amaç:** Geçersiz veya eksik token ile API çağrısı

**Adımlar:**
1. Browser DevTools'da localStorage'dan token'ı sil
2. Form submit et

**Beklenen Sonuç:**
- "Oturum açmanız gerekiyor" hatası görünmeli
- Login sayfasına yönlendirilmeli

**Öncelik:** P0 (Kritik)

---

## 4. Complete Page Tests

### Test 4.1: Success Message Render
**Amaç:** Başarı mesajının görüntülenmesi

**Adımlar:**
1. Organizasyon oluştur
2. Complete sayfasına yönlendir

**Beklenen Sonuç:**
- "Tebrikler!" başlığı görünmeli
- "Organizasyonunuz başarıyla oluşturuldu" mesajı görünmeli
- Loading spinner gösterilmeli (auth refresh sırasında)

**Öncelik:** P1 (Yüksek)

---

### Test 4.2: Auth Context Refresh
**Amaç:** Yeni tenant bilgisinin auth context'e yüklenmesi

**Adımlar:**
1. Complete sayfasına gel
2. Browser console'da auth state'i kontrol et

**Beklenen Sonuç:**
- `auth.refreshMe()` çağrılmalı
- `auth.tenant` güncellenmiş olmalı
- Yeni tenant bilgisi context'te olmalı

**Öncelik:** P0 (Kritik)

---

### Test 4.3: Auto Redirect to Dashboard
**Amaç:** 3 saniye sonra otomatik dashboard'a yönlendirme

**Adımlar:**
1. Complete sayfasına gel
2. 3 saniye bekle

**Beklenen Sonuç:**
- 3 saniye sonra `/` (dashboard) sayfasına yönlendirilmeli
- Countdown gösterilmeli
- Analytics event: `onboarding_complete_viewed`

**Öncelik:** P1 (Yüksek)

---

### Test 4.4: Direct Access Without Tenant
**Amaç:** Tenant oluşturmadan complete sayfasına erişim

**Adımlar:**
1. Tenant olmayan kullanıcı ile giriş yap
2. Direkt `/onboarding/complete` adresine git

**Beklenen Sonuç:**
- `/onboarding/organization` sayfasına yönlendirilmeli
- Complete sayfası görünmemeli

**Öncelik:** P0 (Kritik)

---

## 5. Loading States Tests

### Test 5.1: Welcome Loading State
**Adımlar:**
1. Network throttling'i "Slow 3G" yap
2. `/onboarding/welcome` sayfasına git

**Beklenen Sonuç:**
- Loading skeleton/spinner görünmeli
- Sayfa yüklenene kadar loading state devam etmeli

**Öncelik:** P2 (Orta)

---

### Test 5.2: Organization Loading State
**Adımlar:**
1. Network throttling'i "Slow 3G" yap
2. `/onboarding/organization` sayfasına git

**Beklenen Sonuç:**
- Loading skeleton/spinner görünmeli
- Form yüklenene kadar loading state devam etmeli

**Öncelik:** P2 (Orta)

---

### Test 5.3: Complete Loading State
**Adımlar:**
1. Network throttling'i "Slow 3G" yap
2. `/onboarding/complete` sayfasına git

**Beklenen Sonuç:**
- Loading skeleton/spinner görünmeli
- Auth refresh tamamlanana kadar loading state devam etmeli

**Öncelik:** P2 (Orta)

---

## 6. Error Boundary Tests

### Test 6.1: Runtime Error Handling
**Amaç:** Beklenmeyen hataların yakalanması

**Adımlar:**
1. Browser console'da bir runtime error simüle et
2. Onboarding sayfalarında gezin

**Beklenen Sonuç:**
- Error boundary devreye girmeli
- Kullanıcı dostu hata mesajı görünmeli
- "Tekrar Dene" butonu olmalı

**Öncelik:** P2 (Orta)

---

### Test 6.2: API Error Handling
**Amaç:** API hatalarının düzgün işlenmesi

**Adımlar:**
1. Network'ü offline yap
2. Organizasyon oluşturmayı dene

**Beklenen Sonuç:**
- "Bağlantı hatası" mesajı görünmeli
- Form tekrar submit edilebilmeli
- Analytics event: `onboarding_organization_failed`

**Öncelik:** P1 (Yüksek)

---

## 7. Analytics Tests

### Test 7.1: Event Tracking
**Amaç:** Tüm analytics eventlerinin doğru tetiklenmesi

**Adımlar:**
1. Browser console'da analytics eventlerini logla
2. Onboarding akışını tamamla

**Beklenen Events:**
```typescript
// Welcome page
{ event: 'onboarding_welcome_viewed', data: { step: 'welcome' } }

// Organization page
{ event: 'onboarding_organization_viewed', data: { step: 'organization' } }

// Success
{ 
  event: 'onboarding_organization_created', 
  data: { 
    step: 'organization',
    organizationName: 'Test Organization',
    organizationSlug: 'test-organization'
  } 
}

// Complete page
{ event: 'onboarding_complete_viewed', data: { step: 'complete' } }

// Failure (if error)
{ 
  event: 'onboarding_organization_failed', 
  data: { 
    step: 'organization',
    error: 'Error message'
  } 
}
```

**Öncelik:** P2 (Orta)

---

## 8. Responsive Design Tests

### Test 8.1: Mobile View (375px)
**Adımlar:**
1. Tarayıcıyı 375px genişliğe ayarla
2. Tüm onboarding sayfalarını gez

**Beklenen Sonuç:**
- Tüm elementler görünür olmalı
- Form alanları kullanılabilir olmalı
- Butonlar tıklanabilir olmalı
- Scroll çalışmalı

**Öncelik:** P1 (Yüksek)

---

### Test 8.2: Tablet View (768px)
**Adımlar:**
1. Tarayıcıyı 768px genişliğe ayarla
2. Tüm onboarding sayfalarını gez

**Beklenen Sonuç:**
- Layout düzgün görünmeli
- Form alanları uygun boyutta olmalı

**Öncelik:** P2 (Orta)

---

### Test 8.3: Desktop View (1920px)
**Adımlar:**
1. Tarayıcıyı 1920px genişliğe ayarla
2. Tüm onboarding sayfalarını gez

**Beklenen Sonuç:**
- Layout merkezi hizalanmış olmalı
- Maksimum genişlik sınırı olmalı
- Boşluklar dengeli olmalı

**Öncelik:** P2 (Orta)

---

## 9. Browser Compatibility Tests

### Test 9.1: Chrome/Edge
**Öncelik:** P1 (Yüksek)

### Test 9.2: Firefox
**Öncelik:** P1 (Yüksek)

### Test 9.3: Safari
**Öncelik:** P1 (Yüksek)

---

## 10. Performance Tests

### Test 10.1: Page Load Time
**Metrik:** Her sayfa 2 saniyeden kısa sürede yüklenmeli

**Adımlar:**
1. Chrome DevTools Performance tab'ı aç
2. Her sayfayı yükle ve süreyi ölç

**Beklenen Sonuç:**
- Welcome: < 1s
- Organization: < 1.5s
- Complete: < 1s

**Öncelik:** P2 (Orta)

---

### Test 10.2: API Response Time
**Metrik:** Organizasyon oluşturma API'si 1 saniyeden kısa sürmeli

**Adımlar:**
1. Network tab'ı aç
2. Organizasyon oluştur
3. `/api/onboarding/tenant` endpoint'inin süresini ölç

**Beklenen Sonuç:**
- Response time < 1000ms

**Öncelik:** P2 (Orta)

---

## 11. Security Tests

### Test 11.1: XSS Prevention
**Adımlar:**
1. Organization name alanına `<script>alert('XSS')</script>` yaz
2. Form submit et

**Beklenen Sonuç:**
- Script çalışmamalı
- Input sanitize edilmeli

**Öncelik:** P0 (Kritik)

---

### Test 11.2: SQL Injection Prevention
**Adımlar:**
1. Slug alanına `'; DROP TABLE tenants; --` yaz
2. Form submit et

**Beklenen Sonuç:**
- Validation hatası vermeli
- SQL injection gerçekleşmemeli

**Öncelik:** P0 (Kritik)

---

### Test 11.3: CSRF Protection
**Adımlar:**
1. Farklı bir origin'den API çağrısı yap
2. CORS headers'ı kontrol et

**Beklenen Sonuç:**
- CORS hatası alınmalı
- Unauthorized request reddedilmeli

**Öncelik:** P0 (Kritik)

---

## 12. E2E Test Scenarios (Playwright)

### E2E Test 1: Happy Path
```typescript
test('complete onboarding flow successfully', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  
  // 2. Welcome page
  await expect(page).toHaveURL('/onboarding/welcome');
  await expect(page.locator('h1')).toContainText('Hoş Geldiniz');
  await page.click('text=Başlayalım');
  
  // 3. Organization page
  await expect(page).toHaveURL('/onboarding/organization');
  await page.fill('[name="name"]', 'Test Organization');
  await page.fill('[name="slug"]', 'test-organization');
  await page.click('button[type="submit"]');
  
  // 4. Complete page
  await expect(page).toHaveURL('/onboarding/complete');
  await expect(page.locator('h1')).toContainText('Tebrikler');
  
  // 5. Auto redirect to dashboard
  await page.waitForURL('/', { timeout: 5000 });
  await expect(page).toHaveURL('/');
});
```

**Öncelik:** P0 (Kritik)

---

### E2E Test 2: Error Recovery
```typescript
test('recover from API error', async ({ page }) => {
  // Simulate API error
  await page.route('**/api/onboarding/tenant', route => {
    route.fulfill({ status: 500, body: 'Internal Server Error' });
  });
  
  await page.goto('/onboarding/organization');
  await page.fill('[name="name"]', 'Test Organization');
  await page.fill('[name="slug"]', 'test-organization');
  await page.click('button[type="submit"]');
  
  // Error message should appear
  await expect(page.locator('.error-message')).toBeVisible();
  
  // Remove route mock and retry
  await page.unroute('**/api/onboarding/tenant');
  await page.click('button[type="submit"]');
  
  // Should succeed
  await expect(page).toHaveURL('/onboarding/complete');
});
```

**Öncelik:** P1 (Yüksek)

---

## Test Execution Checklist

### Pre-Release Testing
- [ ] Tüm P0 testler geçmeli
- [ ] Tüm P1 testler geçmeli
- [ ] En az %80 P2 testler geçmeli
- [ ] E2E testler başarılı olmalı
- [ ] Performance metrikleri hedefleri karşılamalı
- [ ] Security testleri geçmeli

### Test Environments
- [ ] Development
- [ ] Staging
- [ ] Production (smoke tests)

### Test Data Cleanup
- [ ] Test organizasyonları silinmeli
- [ ] Test kullanıcıları temizlenmeli
- [ ] Rate limit counters sıfırlanmalı

---

## Automated Test Implementation

### Unit Tests (Vitest)
```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test:watch
```

### E2E Tests (Playwright)
```bash
# Run E2E tests
pnpm test:e2e

# Run in headed mode
pnpm test:e2e --headed

# Run specific test
pnpm test:e2e onboarding-flow.spec.ts
```

---

## Bug Reporting Template

```markdown
### Bug Title
[Kısa ve açıklayıcı başlık]

### Severity
- [ ] P0 - Kritik (Blocker)
- [ ] P1 - Yüksek
- [ ] P2 - Orta
- [ ] P3 - Düşük

### Environment
- Browser: [Chrome 120 / Firefox 121 / Safari 17]
- OS: [macOS 14 / Windows 11 / Ubuntu 22.04]
- Screen Size: [1920x1080 / 375x667]

### Steps to Reproduce
1. [Adım 1]
2. [Adım 2]
3. [Adım 3]

### Expected Result
[Beklenen davranış]

### Actual Result
[Gerçekleşen davranış]

### Screenshots/Videos
[Ekran görüntüleri veya video]

### Console Errors
```
[Console log çıktısı]
```

### Additional Context
[Ek bilgiler]
```

---

## Test Coverage Goals

- **Unit Tests:** %80+
- **Integration Tests:** %70+
- **E2E Tests:** Critical paths %100
- **Manual Tests:** All P0 and P1 scenarios

---

## Continuous Testing

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test Onboarding Flow

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test --run",
      "pre-push": "pnpm test:e2e"
    }
  }
}
```
