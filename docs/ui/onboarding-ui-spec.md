# Onboarding UI Specification & Component Inventory

## 1. Component Inventory

Aşağıdaki bileşenler Onboarding akışında rol almaktadır ve `apps/web/src/components/onboarding/` dizininde veya ilgili kök dizinlerde yer alır.

| Bileşen Tipi | Bileşen Adı | Durum | shadcn/ui Bağımlılığı |
|--------------|-------------|-------|-----------------------|
| **Form** | `CreateOrganizationForm` | Mevcut | Button, Input, Label |
| **Overlay** | `TenantOnboardingDrawer` | Mevcut | Sheet |
| **Feedback** | `OnboardingBanner` | Mevcut | Card, Button |

---

## 2. Component Specifications

### 2.1 `TenantOnboardingDrawer`

Sağ taraftan açılan (slide-over) modal yapısı. `shadcn/ui`'ın **Sheet** bileşeni üzerine inşa edilmiştir.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| - | - | - | Global event ve Context ile durumunu kendi yönetir (Stateless-like usage). |

**Variants:** `side="right"`, genişlik `w-[400px]` mobile, `w-[540px]` (sm/desktop).
**States:**
- `open` durumu `useState` ve `window.dispatchEvent` (custom event: `prosektorweb:open-onboarding-drawer`) ile kontrol edilir.
- SessionStorage `tenant-onboarding-dismissed` ile sayfa yenilemelerinde anlamsız açılışlar engellenir.
**Accessibility:** Sheet bileşeninin sunduğu dahili focus yönetimi, ESC ile kapatılabilirlik, `aria-describedby` özellikleri aktiftir.

---

### 2.2 `OnboardingBanner`

Sayfa içerisine render edilen dismissible (kapatılabilir) uyarı kartı.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onDismiss` | `() => void` | `undefined` | "Daha Sonra" butonuna tıklanınca tetiklenir (opsiyonel state yönetimi için). |
| `className` | `string` | `undefined` | Ekstra stil atamaları (`cn()` ile birleştirilir). |

**Styles:** `border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5` (Marka renklerine uygun hafif gradyan).
**States:** Default, Hover (butonlar).
**Accessibility:** Görsel ikon (`Rocket`) dekoratiftir.

---

### 2.3 `CreateOrganizationForm`

Gerçek veri mutasyonunu yöneten form.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSuccess` | `() => void` | `undefined` | API 200 dönerse tetiklenir. |
| `onCancel` | `() => void` | `undefined` | İptal butonuna basılırsa tetiklenir. |
| `showCancel` | `boolean` | `false` | İptal butonunu görünür/gizli yapar. |

**States:** `loading` (API isteğinde input/buton disabled), default.
**UI Patterns:**
- Karakter sınırı limiti UI'da görsel olarak `text-warning` rengi ile uyarı verir (length > %90).
- Buton üzerinde gradient (`gradient-primary text-white`).

---

## 3. Design System & Token Integration

- **Renkler:** `primary` ve `primary/10` gibi Tailwind opacity modifier'ları ile marka kimliği yansıtılıyor. Form butonunda `gradient-primary` utility class'ı kullanılmış.
- **İkonografi:** `lucide-react`'ten `Rocket` ve `ArrowRight` (Micro-feedback).
- **Bildirimler:** API sonuçları için `sonner` (`toast.success` ve `toast.error`) kullanılmıştır.
