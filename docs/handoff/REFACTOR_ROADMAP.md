# 🛠️ ProsektorWeb Refaktör ve Geliştirme Yol Haritası (Roadmap)

Bu doküman, projedeki büyük çaplı refaktör işlemlerini, biriken teknik borçları ve planlanan mimari değişiklikleri takip eder.

---

## 📅 1. Mevcut Refaktör Hedefleri (Active)

### 1.1. Admin Settings API (PATCH)
*   **Tamamlananlar:** Deep merge desteği, Zod validasyonları, Audit Log entegrasyonu.
*   **Kalanlar:** Race condition koruması için veritabanı seviyesinde `FOR UPDATE` kilitleme mekanizması.

### 1.2. Onboarding UX Entegrasyonu
*   **Durum:** %90 Tamamlandı.
*   **Tanım:** Kullanıcıyı zorunlu formlarla karşılamak yerine dashboard'a alıp, progresif şekilde verileri toplama.
*   **Kalan:** Staging ortamında kullanıcı akışının A/B test verileriyle izlenmesi.

### 1.3. AppShell & Sidebar Optimizasyonu
*   **Durum:** Tamamlandı.
*   **Kalan:** Mobil görünümlerde "swipe to close" hareket desteği.

---

## 🔮 2. Gelecek Planlar (Phase 2)

### 2.1. Site Engine & AI Entegrasyonu
*   Site temalarının kullanıcı tercihlerine göre AI tarafından üretilmesi.
*   Tema Editörü sayfasının Phase-2 kapsamında canlı preview yeteneklerinin artırılması.

### 2.2. Global Arama (Command Palette)
*   `Cmd+K` ile tüm tenantlar, sayfalar ve ayarlar arasında hızlı arama.

---

## 🧹 3. Teknik Borçlar (Technical Debt)
1.  **`as any` Temizliği:** `apps/api` ve `apps/web` içindeki tip zorlamalarının shared kontratlara taşınması.
2.  **Test Kapsamı:** Özellikle `onboarding` ve `auth` flowları için E2E testlerin yazılması.
3.  **Dokümantasyon:** MCP sunucuları ve yeni eklenen kütüphanelerin entegrasyon rehberleri.

---

*Not: Tamamlanan görevleri `[x]` olarak işaretleyin ve yeni discovery'leri buraya ekleyin.*
