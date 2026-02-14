# Screen Specifications

Her ekran için: amaç, birincil CTA, 6 state, izinler.

---

## State Standardı

Her ekran 6 state destekler:

| State | Açıklama | UI |
|-------|----------|-----|
| **normal** | Verili, etkileşimli | Tam içerik |
| **empty** | Veri yok | EmptyState + CTA |
| **loading** | Veri yükleniyor | Skeleton |
| **error** | API hata | ErrorState + retry |
| **unauthorized** | Yetki yok | 403 screen |
| **success** | İşlem tamam | Toast |

---

## Home Dashboard

**Route:** `/home`
**Amaç:** Site durumu ve hızlı aksiyonlar
**Rol:** Tüm roller

| CTA | Aksiyon |
|-----|---------|
| Primary | "Sayfaları Düzenle" |
| Secondary | "Yayınla" |

### States
- **normal:** Widgets + activity
- **empty:** Setup checklist
- **loading:** Card skeletons
- **error:** ErrorState
- **unauthorized:** N/A (tüm roller görür)
- **success:** Toast on action

---

## Site: Pages

**Route:** `/site/pages`
**Amaç:** Sayfa listesi yönetimi
**Rol:** owner, admin

| CTA | Aksiyon |
|-----|---------|
| Primary | "+ Yeni Sayfa" |

### States
- **empty:** "İlk sayfanızı oluşturun"
- **loading:** TableSkeleton

---

## Site: Page Builder

**Route:** `/site/builder?page_id=`
**Amaç:** Görsel sayfa düzenleme
**Rol:** owner, admin

| CTA | Aksiyon |
|-----|---------|
| Primary | "Kaydet" |
| Secondary | "Yayınla" |

### States
- **empty:** "Blok ekleyin" prompt
- **loading:** Canvas skeleton
- **success:** "Kaydedildi" toast

**Özel:** Auto-save her 30 saniye

---

## Site: Domains

**Route:** `/site/domains`
**Amaç:** Domain ve SSL yönetimi
**Rol:** owner, admin

| CTA | Aksiyon |
|-----|---------|
| Primary | "+ Domain Ekle" |

### States
- **empty:** "Alan adı ekleyin"
- **loading:** Card skeleton
- **success:** SSL provisioned toast

### Wizard Steps
1. Domain gir
2. DNS kayıtları (copy button)
3. Verify
4. SSL otomatik

---

## Site: SEO

**Route:** `/site/seo`
**Amaç:** Varsayılan SEO ayarları
**Rol:** owner, admin

| CTA | Aksiyon |
|-----|---------|
| Primary | "Kaydet" |

### States
- **loading:** Form skeleton
- **success:** "Kaydedildi" toast

---

## Site: Publish

**Route:** `/site/publish`
**Amaç:** Staging/Production yayın
**Rol:** owner, admin

| CTA | Aksiyon |
|-----|---------|
| Primary | "Yayınla" |
| Secondary | "Staging'e Gönder" |

### States
- **normal:** Environment tabs + changes list
- **empty:** "Değişiklik yok"
- **success:** "Yayınlandı" toast

---

## Modules: Offer Settings

**Route:** `/modules/offer`
**Amaç:** Teklif modülü konfigürasyonu
**Rol:** owner, admin

| CTA | Aksiyon |
|-----|---------|
| Primary | "Kaydet" |

### Fields
- Modül aktif/pasif (switch)
- Alıcı email adresleri
- Başarı mesajı
- KVKK metni (select)

---

## Modules: Contact Settings

**Route:** `/modules/contact`
**Amaç:** İletişim modülü konfigürasyonu
**Rol:** owner, admin

| CTA | Aksiyon |
|-----|---------|
| Primary | "Kaydet" |

### Fields
- İletişim bilgileri (adres, telefon, email)
- Form aktif/pasif
- KVKK metni

---

## Modules: Legal (KVKK)

**Route:** `/modules/legal`
**Amaç:** Yasal metin kütüphanesi
**Rol:** owner, admin

| CTA | Aksiyon |
|-----|---------|
| Primary | "+ Yeni Metin" |

### States
- **empty:** "İlk metni oluşturun"

---

## HR: Job Posts

**Route:** `/modules/hr/job-posts`
**Amaç:** İş ilanları CRUD
**Rol:** owner, admin

| CTA | Aksiyon |
|-----|---------|
| Primary | "+ Yeni İlan" |

### CRUD
- Create (Dialog)
- Edit (Dialog)
- Toggle status (inline)
- Duplicate
- Delete (confirm)

### States
- **empty:** "İlk ilanınızı oluşturun"
- **success:** "İlan kaydedildi" toast

**Hız Hedefi:** < 2 dakika ilan oluşturma

---

## Inbox: Offers

**Route:** `/inbox/offers`
**Amaç:** Teklif taleplerini görüntüleme
**Rol:** editor+

| CTA | Aksiyon |
|-----|---------|
| Secondary | "Dışa Aktar" |

### Pattern
DataTable + Drawer

### States
- **empty:** "Henüz teklif talebi yok"
- **loading:** TableSkeleton

---

## Inbox: Contact

**Route:** `/inbox/contact`
**Amaç:** İletişim mesajlarını görüntüleme
**Rol:** editor+

### States
- **empty:** "Henüz mesaj yok"

---

## Inbox: Applications

**Route:** `/inbox/applications`
**Amaç:** İş başvurularını görüntüleme
**Rol:** editor+

### Özel
- Job filter dropdown
- CV download link (signed URL)

### States
- **empty:** "Henüz başvuru yok"

---

## Settings: Users & Roles

**Route:** `/settings/users`
**Amaç:** Ekip yönetimi
**Rol:** owner only

| CTA | Aksiyon |
|-----|---------|
| Primary | "+ Davet Et" |

### Actions
- Invite (email)
- Change role
- Remove user

---

## Settings: Notifications

**Route:** `/settings/notifications`
**Amaç:** Bildirim tercihleri
**Rol:** Tüm roller

| CTA | Aksiyon |
|-----|---------|
| Primary | "Kaydet" |

---

## Settings: Billing

**Route:** `/settings/billing`
**Amaç:** Abonelik ve fatura
**Rol:** owner only

| CTA | Aksiyon |
|-----|---------|
| Primary | "Plan Değiştir" |

### Sections
- Mevcut plan
- Ödeme yöntemi
- Fatura geçmişi

---

## Analytics

**Route:** `/analytics`
**Amaç:** Site istatistikleri
**Rol:** admin+

### Widgets
- Görüntülenme
- Ziyaretçi
- Ortalama süre
- Form gönderimi

### States
- **empty:** "Veri yok" (yeni site)
- **loading:** Widget skeletons
