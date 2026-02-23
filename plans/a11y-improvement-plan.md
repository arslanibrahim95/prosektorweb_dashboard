# Erişilebilirlik (A11y) İyileştirme Planı

## Mevcut Durum Analizi

Proje zaten iyi bir erişilebilirlik altyapısına sahip. Radix UI primitive'leri kullanılıyor ve birçok aria-label eklenmiş durumda.

### ✅ Zaten İyileştirilmiş Bileşenler

| Bileşen | Özellik | Durum |
|---------|---------|-------|
| Topbar - Mobil menü | `aria-label="Navigasyon menüsünü aç"` | ✓ |
| Topbar - Arama paleti | `aria-label="Arama komut paleti"` | ✓ |
| Topbar - Yardım | `aria-label="Yardım"` | ✓ |
| Topbar - Tema toggle | Dinamik aria-label | ✓ |
| Topbar - Bildirimler | Dinamik aria-label | ✓ |
| Topbar - Kullanıcı menüsü | `aria-label="Kullanıcı menüsünü aç"` | ✓ |
| Sidebar - Genişlet/Daralt | `aria-label` | ✓ |
| Sidebar - Nav items | `aria-expanded`, `aria-label` | ✓ |
| App-shell - Menü kapatma | `aria-label="Menüyü Kapat"` | ✓ |
| Breadcrumb | `aria-label="Breadcrumb"` | ✓ |
| Dialog/Sheet | Radix UI native focus trap | ✓ |
| DropdownMenu | Radix UI native focus management | ✓ |

---

## Yapılması Gereken İyileştirmeler

### 1. Dialog Bileşeninde Türkçe Kapatma Etiketi

**Dosya:** `apps/web/src/components/ui/dialog.tsx` (Satır 78)

**Sorun:** Kapanış butonunda "Close" İngilizce yazıyor.

```tsx
// Mevcut
<span className="sr-only">Close</span>

// Olması gereken
<span className="sr-only">Kapat</span>
```

### 2. Sheet Bileşeninde Türkçe Kapatma Etiketi

**Dosya:** `apps/web/src/components/ui/sheet.tsx` (Satır 80)

**Sorun:** Kapanış butonunda "Close" İngilizce yazıyor.

```tsx
// Mevcut
<span className="sr-only">Close</span>

// Olması gereken
<span className="sr-only">Kapat</span>
```

### 3. Mobile-Nav Bileşenine aria-label Ekleme

**Dosya:** `apps/web/src/components/layout/mobile-nav.tsx` (Satır 25-28)

**Sorun:** Navigation için aria-label eksik.

```tsx
// Mevcut
<nav
  className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-strong border-t border-border/50"
  style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
>

// Olması gereken
<nav
  aria-label="Mobil navigasyon"
  className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-strong border-t border-border/50"
  style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
>
```

---

## Radix UI Erişilebilirlik Özellikleri (Native)

Proje zaten Radix UI primitive'lerini kullanıyor ve aşağıdaki özellikler native olarak sağlanıyor:

### Dialog/Sheet (Modal)
- ✓ Focus trap - Odak modal içinde kalır
- ✓ Escape tuşu ile kapatma
- ✓ Açılışta ilk etkileşimli öğeye focus
- ✓ Dialog dışına çıkıldığında focus içeride tutma
- ✓ `aria-describedby` ile açıklama
- ✓ `role="dialog"` ve `aria-modal="true"`

### DropdownMenu
- ✓ Açılışta ilk menü öğesine focus
- ✓ Yukarı/aşağı ok tuşlarıyla navigasyon
- ✓ Tab ile dropdown dışına çıkışta dropdown'ı kapatma
- ✓ Escape tuşu ile kapatma
- ✓ `aria-orientation="vertical"`

---

## Test Senaryoları

### Screen Reader Testleri (NVDA/VoiceOver)

1. **Dialog Testi:**
   - Dialog açıldığında "Dialog, içerik başlığı" şeklinde duyulmalı
   - Tab ile içeride gezinilebilmeli
   - Escape ile kapatılabilmeli

2. **Dropdown Testi:**
   - Dropdown açıldığında ilk öğeye focus olmalı
   - Ok tuşlarıyla gezinilebilmeli
   - Her öğe için ekran okuyucu ismi duyulmalı

3. **Icon-Only Butonlar Testi:**
   - Her buton için aria-label doğru okunmalı
   - Türkçe isimler duyulmalı

### Klavye Navigasyonu Testleri

1. Tab ile sıralı gezinme
2. Ok tuşlarıyla menü navigasyonu
3. Enter/Space ile etkileşim
4. Escape ile kapatma

---

## Uygulama Adımları

### Code Modunda Yapılacak Değişiklikler

1. **dialog.tsx:** "Close" → "Kapat"
2. **sheet.tsx:** "Close" → "Kapat"  
3. **mobile-nav.tsx:** `aria-label="Mobil navigasyon"` ekle
4. **accessibility.test.tsx:** Yeni testler ekle

---

## Referanslar

- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix UI DropdownMenu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
