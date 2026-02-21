# AppShell QA ve Doğrulama Planı (Kalan Görevler)

`app-shell.tsx` ve `entities.ts` üzerinde yapılan mimari refactoring işlemleri (Hydration çözümü, Lazy Loading, Performans optimizasyonları ve Erişilebilirlik - A11y) kodsal olarak tamamlandı ve derleme uyarıları (linting/type) giderildi. 

Kodun `main` (production) ortama çıkmadan önce aşağıda listelenen QA (Kalite Güvencesi - Quality Assurance) senaryolarının **fiziksel olarak tarayıcı üzerinde** test edilmesi gerekmektedir.

## ✅ Tamamlananlar
- [x] **Tip Güvenliği:** `User` arayüzü `entities.ts` içine taşındı ve global yapıyla bağlandı.
- [x] **Zombi State Koruması:** `window.matchMedia` üzerinden viewport dinlenip orphan (sahipsiz) state temizlendi.
- [x] **Hydration Uyumu:** İstemci tarafı hydration adımı bitene dek lazy loading ve localStorage uyuşmazlıkları güvene alındı.
- [x] **Erişilebilirlik (A11y):** Mobil overlay tab-index, semantik rol ve klavye etkileşimleriyle uyumlu hale getirildi.
- [x] **Hata Yakalama:** ErrorBoundary için re-render dostu bileşen yapısı onarıldı (`fallback={<.../>}` yerine `fallback={() => <.../>}`).

---

## 🧪 Kalan Manuel Test (QA) Görevleri

Bu adım bir yazılım test uzmanı (Test Engineer - QA) veya geliştirici tarafından yerel (local) ortamda manuel olarak doğrulanmalıdır.

### 1. Hydration ve SSR Doğrulaması
- [ ] Terminalde `npm run build` komutunu çalıştırarak projenin sorunsuz derlendiğinden emin olun.
- [ ] `npm start` (veya test ediyorsanız dev server) ile projeyi ayağa kaldırın.
- [ ] Tarayıcıda uygulamayı açın (Masaüstü görünümde).
- [ ] `F12` Developer Tools > **Console** sekmesini açın.
- [ ] Sayfayı yenileyerek (F5 / CMD+R) konsolda *"Warning: Prop className did not match"* benzeri React Hydration hatalarının **olmadığını** teyit edin.
- [ ] Sayfa ilk yüklendiğinde kenar çubuğunda (sidebar) istem dışı göz kırpma (flicker) veya genişlik sıçraması olmadığını teyit edin.

### 2. Viewport / Zombi State Testi
- [ ] Tarayıcıyı daraltarak veya Chrome DevTools Device Toolbar (Mobil Görünüm) kullanarak ekranı telefon boyutuna getirin.
- [ ] Hamburger (Menü) butonuna basarak mobil kenar çubuğunu açın (Siyah arkaplanlı overlay tetiklenmeli).
- [ ] Siyah overlay **açık durumdayken**, tarayıcı penceresini tutup hızlıca **genişletin** (1024px üstüne çıkarın).
- [ ] Mobil menünün sorunsuz kaybolduğunu ve normal masaüstü kenar çubuğuna yatayda takılma olmadan geçiş yapıldığını teyit edin.
- [ ] Tarayıcıyı tekrar daralttığınızda siyah mobil menünün **kendi kendine tekrar GELMEDİĞİNİ** (Zombi state'in öldüğünü) doğrulayın.

### 3. A11y (Erişilebilirlik / Klavye Navigasyonu) Testi
- [ ] Ekranı daraltıp mobil menüyü tekrar fareyle açın.
- [ ] Farenizi kullanmayı bırakın. Klavyede `Tab` tuşuna basarak odak (focus) halkanızı siyah boşluk (overlay) üzerine getirin.
- [ ] Sırasıyla `Enter`, `Space` ve `Escape` tuşlarına bastığınızda her seferinde menünün doğru ve sorunsuz kapandığını teyit edin.

### 4. Lazy Loading (Ağ Ön Bellek) Kontrolü
- [ ] `F12` Developer Tools > **Network (Ağ)** sekmesini açın.
- [ ] Sayfayı tamamen yenileyin. Network trafiği durduğunda Command Palette, Yardım Formu gibi büyük JS parçalarının gereksiz yere inmediğini inceleyin.
- [ ] Uygulama içinde klavye kısayolu ile (Örn: CMD+K / CTRL+K) veya arama butonlarıyla `CommandPalette`'i açın. Ağ sekmesinde JS paketinin o an asenkron olarak indirildiğini ve saniyelik bir gecikmeyle (Crash olmadan) ekrana geldiğini teyit edin.

### 5. Error Boundary (Hata Sınırı) İzolasyon Testi
- [ ] Geçici süreliğine test amaçlı `app/(dashboard)/home/page.tsx` (veya benzeri bir içerik componentine) kasıtlı bir JavaScript hatası ekleyin. (Örn: kodun en üstüne `throw new Error("Test Hata Sınırı");` yazın).
- [ ] Sayfaya girin.
- [ ] Tüm uygulamanın bembeyaz çökmediğinden; sadece **içerik (content) alanında** yazdığımız *“Dashboard yüklenirken kritik bir hata oluştu”* yazısının çıktığından, ancak üst menü (Topbar) ve yan menünün (Sidebar) hala sapasağlam çalışmaya devam ettiğinden emin olun.
- [ ] (Test bittikten sonra kasıtlı çıkardığınız hatayı koddan geri silmeyi unutmayın.)

---
**Sonuç:** Bu adımlar başarıyla tamamlandıysa, refactoring kusursuz entegre edilmiş demektir ve kod Push/Merge işlemi için güvendedir.
