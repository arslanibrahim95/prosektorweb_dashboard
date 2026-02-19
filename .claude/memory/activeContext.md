# Active Context - Şu An Ne Yapıyoruz?

> **Son Güncelleme:** 2026-02-18
> **Bu dosya, o anki çalışmanın odak noktasını tutar.**

---

## 🎯 Aktif Görev

**Durum:** ✅ TAMAMLANDI

**Açıklama:** Admin Users Sayfası Veri Düzeltmesi — Pilot pipeline (8-stage) tamamlandı

**Sonuç:**
- `pages` için `origin` modeli eklendi (`panel | site_engine | unknown`)
- Panel kullanıcıları sadece `origin=panel` sayfaları düzenleyebilir
- `super_admin` için site-engine yazma bypass korundu
- `/site/pages` ve `/site/builder` ekranları geri getirildi

---

## 📂 Çalışılan Dosyalar

| Dosya | Durum |
|-------|-------|
| `packages/db/migrations/0015_pages_origin.sql` | ✅ Yeni migration |
| `packages/contracts/pages.ts` | ✅ `origin` alanı eklendi |
| `apps/api/src/server/pages/origin-guard.ts` | ✅ Yeni guard helper |
| `apps/api/src/app/api/pages/*` | ✅ Panel-origin edit guard |
| `apps/api/src/app/api/builder/layouts/[pageId]/route.ts` | ✅ Panel-origin edit guard |
| `apps/web/src/app/(dashboard)/site/pages/page.tsx` | ✅ Yeni sayfa yönetimi UI |
| `apps/web/src/app/(dashboard)/site/builder/page.tsx` | ✅ Yeni builder UI (origin-aware) |
| `apps/web/src/components/layout/sidebar.tsx` | ✅ Site menüsü güncellendi |
| `apps/web/src/app/(dashboard)/admin/content/page.tsx` | ✅ Origin badge + read-only aksiyon |

---

## ⏭️ Sıradaki Adımlar

1. DB migration'ı hedef ortamlarda çalıştır
2. site-engine token akışını `super_admin` beklentisine göre doğrula
3. İstenirse panel-origin filtreleme/sıralama UI'sı geliştir

---

## 🚧 Engeller / Dikkat Edilecekler

- `apps/api` genel typecheck hâlâ mevcut unrelated hatalar nedeniyle fail ediyor (A/B test route + client-ip test dosyası)
- `vitest` koşumu ortamda `@vitejs/plugin-react` eksikliği nedeniyle çalışmadı

---

## 📝 Notlar

- Web typecheck geçti: `pnpm --filter web exec tsc --noEmit`
- Değiştirilen web/api dosyalarında lint geçti (targeted)

---

> **Kural:** Bu dosya her görev değişiminde güncellenir. Eski görev tamamlanınca "Tamamlandı" olarak işaretlenir.
