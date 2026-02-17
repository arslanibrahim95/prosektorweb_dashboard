# Active Context - Şu An Ne Yapıyoruz?

> **Son Güncelleme:** 2026-02-18
> **Bu dosya, o anki çalışmanın odak noktasını tutar.**

---

## 🎯 Aktif Görev

**Durum:** 🔄 DEVAM EDİYOR

**Açıklama:** A/B Test Özelliği Uygulaması - Veritabanı şeması ve frontend sayfaları oluşturuluyor.

---

## 📂 Çalışılan Dosyalar

| Dosya | Durum |
|-------|-------|
| apps/api/src/app/api/auth/token/route.ts | ✅ Rate-limit tenant kaynağı sertleştirildi |
| apps/api/src/server/rate-limit.ts | ✅ Production trusted proxy davranışı eklendi |
| apps/api/src/server/security/file-validation.ts | ✅ Extension zorunluluğu + AV akışı eklendi |
| apps/api/src/server/security/av-scan.ts | ✅ Yeni ClamAV INSTREAM modülü eklendi |
| docker-compose.yml | ✅ Güvenlik env passthrough eklendi |
| deploy/env/prod.security.env.example | ✅ Production profile (fail-open) eklendi |
| deploy/env/prod.strict.env.example | ✅ Production strict profile (fail-closed) eklendi |
| docs/security/PRODUCTION_ENV_PROFILE.md | ✅ Profil dokümanı eklendi/güncellendi |
| .claude/memory/progress.md | ✅ Güncellenecek |
| .claude/memory/activeContext.md | ✅ Bu dosya |

---

## 🔄 Son İşlem

- Pen-test benzeri backend güvenlik kontrolleri çalıştırıldı
- API testleri geçti (`297/297`)
- Token exchange rate-limit key tenant kaynağı güvenli hale getirildi
- `X-Forwarded-For` için production trusted-hop mantığı eklendi
- CV upload hattına extension fail-closed + malware imza kontrolü + opsiyonel ClamAV eklendi
- Production env profili ve strict profil şablonları oluşturuldu

---

## ⏭️ Sıradaki Adımlar

1. Üretim ortamında `TRUSTED_PROXY_COUNT` değeri gerçek proxy zinciri ile doğrulanacak.
2. ClamAV servisi (container/service) canlı ortamda ayağa alınıp bağlantı testi yapılacak.
3. AV için 7 günlük gözlem sonrası `AV_SCAN_FAIL_CLOSED=true` geçişi değerlendirilecek.

---

## 🚧 Engeller / Dikkat Edilecekler

- ClamAV canlı bağlantı testi bu oturumda yapılmadı (kod + konfig hazır).
- Repository'de kullanıcıya ait başka değişiklikler var; dokunulmadı.

---

## 📝 Notlar

- Memory Bank akışı aktif olarak kullanılmaya başlandı.
- İş bitimlerinde `progress.md` güncellemesi zorunlu tutuluyor.

---

> **Kural:** Bu dosya her görev değişiminde güncellenir. Eski görev tamamlanınca "Tamamlandı" olarak işaretlenir.
