# Admin Settings PATCH Refactor - Backend Uygulama Raporu

**Tarih:** 2026-02-19  
**Owner:** Backend Agent / Codex  
**Status (Strict):** READY-FOR-IMPLEMENTATION  
**Sayim:** P0=3, P1=6, P2=5

## Ship-Ready Kurali (Strict)

- `P0 > 0` veya `P1 > 0` ise: `NOT SHIP-READY`
- Bu dokuman bir "uygulama raporu" oldugu icin ilk durum `NOT SHIP-READY` kabul edilir.
- Hedef: tum `P0` ve `P1` bulgularini `fixed` durumuna cekmek.

---

## Executive Summary (En Kritik 5)

- `PATCH /api/admin/settings` akisi shallow merge nedeniyle nested ayarlarda veri kaybi riski tasiyor.
- `security/backup/i18n/theme` bloklari icin coklu read-modify-write deseni race condition uretiyor.
- `PATCH` uzerinde write rate-limit eksigi var; abuse ve brute update riski acik.
- Zod validasyon sinirlari guvenlik acisindan yeterince siki degil (ozellikle `security` payload).
- Audit log insert hatasinin ana update islemini dusurme riski var; non-blocking hale getirilmeli.

---

## Scope

- Dahil: `apps/api/src/app/api/admin/settings/route.ts` PATCH refactor
- Dahil: Admin settings Zod semalarinin paylasimli hale getirilmesi
- Dahil: Testlerin ortak schema importuna alinmasi
- Haric: Farkli endpointlerdeki benzer anti-patternlerin toplu refactori

---

## Findings

### P0 (Release Blocker)

| ID | severity | dosya:satir | Bulgu | Etki | Onerilen Fix | Durum |
|---|---|---|---|---|---|---|
| P0-01 | kritik | `apps/api/src/app/api/admin/settings/route.ts` | PATCH merge akisinda shallow merge/spread kullanimiyla nested alanlar overwrite oluyor. | Veri kaybi ve ayar tutarsizligi | Memory uzerinde `deepMerge` ile mevcut + patch birlestir; spread ile nested birlestirme yapma. | open |
| P0-02 | kritik | `apps/api/src/app/api/admin/settings/route.ts` | Her ayar blogu icin ayri read-modify-write donguleri var. | Race condition ve stale write riski | Tek `SELECT` + memory deep merge + tek `UPDATE` modeline gec. | open |
| P0-03 | kritik | `apps/api/src/app/api/admin/settings/route.ts` | PATCH akisinin basinda write rate limit yok. | Abuse/resource exhaustion ve audit spam riski | `enforceAdminRateLimit(ctx, "admin_settings", "write")` kontrolunu parse oncesi ekle. | open |

### P1 (Onemli)

| ID | severity | dosya:satir | Bulgu | Etki | Onerilen Fix | Durum |
|---|---|---|---|---|---|---|
| P1-01 | yuksek | `apps/api/src/app/api/admin/settings/route.ts` | `currentTenant` null donerse guard yok. | Runtime exception ve belirsiz hata cevabi | `if (!currentTenant)` ile explicit hata dondur. | open |
| P1-02 | yuksek | `apps/api/src/app/api/admin/settings/route.ts` | `security` semasi sinirsiz key/value kabul ediyor. | JSON bomb/resource exhaustion | Kabul edilen alanlari whitelist et veya strict key + depth/size limiti uygula. | open |
| P1-03 | yuksek | `apps/api/src/app/api/admin/settings/route.ts` | `languages[].code` benzersizlik kontrolu yok. | Cakisan locale davranislari | `refine` ile unique dil kodu zorunlu kil. | open |
| P1-04 | yuksek | `apps/api/src/app/api/admin/settings/route.ts` | `security/backup/i18n/theme` icin tekrarlayan query/update bloklari var. | Kod karmasasi + bakim maliyeti + hata riski | Blok bazli sorgulari tamamen sil; tek akista isle. | open |
| P1-05 | yuksek | `apps/api/src/app/api/admin/settings/route.ts` | Sonuc payload'i parca parca overwrite edilerek kuruluyor. | Tutarsiz response modeli | Tek merge sonucu uzerinden temiz `results.settings` olustur. | open |
| P1-06 | yuksek | `apps/api/src/app/api/admin/settings/route.ts` | Audit log insert her blokta ayri tetikleniyor. | Gereksiz DB roundtrip, gecikme | `auditLogsToInsert[]` topla, en sonda bulk insert yap. | open |

### P2 (Iyilestirme)

| ID | severity | dosya:satir | Bulgu | Etki | Onerilen Fix | Durum |
|---|---|---|---|---|---|---|
| P2-01 | orta | `apps/api/src/app/api/admin/settings/route.ts` + `apps/api/tests/api/admin-settings-schema.test.ts` | Zod semalari route/test icinde tekrar ediyor. | DRY ihlali ve drift riski | Ortak schema dosyasi (`apps/api/src/schemas/admin-settings.ts`) olustur. | open |
| P2-02 | orta | `apps/api/src/app/api/admin/settings/route.ts` | `baseFontSize` int kontrolu yok. | Semantik dogrulama eksigi | `z.number().int().min(12).max(24)` kullan. | open |
| P2-03 | orta | `apps/api/src/app/api/admin/settings/route.ts` | Theme color validasyonu yalnizca 6 haneli HEX'e asiri bagli. | Kullanici girdisinde gereksiz red | `#rgb`, `#rrggbb`, `rgb()`, `rgba()` destekleyen validator kullan. | open |
| P2-04 | orta | `apps/api/src/app/api/admin/settings/route.ts` | Tenant update disinda olasi site update akisi tekil degilse daginik kalabilir. | Eslestirme hatasi olasiligi | Varsa site update'i de ilgili blokta tek sorguda finalize et. | open |
| P2-05 | orta | `apps/api/src/app/api/admin/settings/route.ts` | Audit insert hatasi ana akisla hard-fail olabilir. | Basarili update'e ragmen 500 donusu | Audit insert hata verirse `console.error` ile logla ve `200` donmeye devam et. | open |

---

## Faz Bazli Uygulama Plani

| Faz | Is Kalemi | Cikti | Dogrulama |
|---|---|---|---|
| Faz 1 | Schema'lari ortak dosyaya tasima + strict validasyonlar | `apps/api/src/schemas/admin-settings.ts` + route/test import gunceli | Schema testleri + typecheck |
| Faz 2 | PATCH basina write rate-limit + null guard | Guvenlik ve hata yonetimi guclendirilmis route | API test: abuse/null path |
| Faz 3 | Tek select + deep merge + tek update + temiz response | Race condition azaltilmis, veri kaybi engellenmis endpoint | Integration test + query count kontrolu |
| Faz 4 | Audit logs bulk insert + non-blocking hata davranisi | Performansli ve dayanikli audit akisi | Audit fail senaryosu testi |

---

## Acceptance Checklist (Definition of Done)

- [ ] Ortak Zod schema dosyasi olusturuldu ve route/test importlari guncellendi
- [ ] `security` payload sinirlari uygulandi
- [ ] `baseFontSize` icin `.int()` zorunlu hale geldi
- [ ] Theme color validator `#rgb/#rrggbb/rgb/rgba` destekliyor
- [ ] `languages[].code` unique kontrolu eklendi
- [ ] PATCH basinda `enforceAdminRateLimit(..., "write")` var
- [ ] `currentTenant` null guard eklendi
- [ ] N+1 SELECT/UPDATE bloklari kaldirildi
- [ ] Tek `SELECT` + memory deep merge + tek `UPDATE` tamamlandi
- [ ] `results.settings` tek ve temiz modelden donuyor
- [ ] Audit loglar bulk insert ile yaziliyor
- [ ] Audit insert hatasinda endpoint basarili donmeye devam ediyor
- [ ] Ilgili testler guncellendi/eklendi

---

## Decision Log

| # | Karar | Gerekce |
|---|---|---|
| 1 | PATCH update akisi tek transaction benzeri lineer yapida kurgulanacak | Race condition penceresini daraltmak ve query sayisini dusurmek |
| 2 | Deep merge mecburi, spread ile nested merge yasak | Veri kaybi riskini kapatmak |
| 3 | Audit hatasi non-blocking olacak | Is kurali: ana ayar guncellemesi basariliysa kullaniciya hata yansitilmamali |
| 4 | Schema tekrarlarini ortak dosyada toplama zorunlu | Route/test drift ve bakim maliyetini dusurmek |

---

## Uygulama Sonrasi Raporlama Beklentisi

Refactor tamamlandiginda ayni formatta ikinci rapor uretilir:
- `Status (Strict)` guncellenir
- `Sayim` tekrar hesaplanir
- Tum bulgular `fixed/open/accepted-risk` olarak isaretlenir
- Calisan test komutlari ve ciktilari eklenir
