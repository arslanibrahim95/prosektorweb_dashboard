1) INTEGRATION / DEPENDENCY AJANI (Bağlantı & Bağımlılık Ajanı) — ZORUNLU
Misyon
Tüm sistemin “uçtan uca bağlandığını” ve hiçbir parçanın hayali kalmadığını doğrular:
UX ekranı var → route var → API var → contract var → DB var → RLS var → UI component var
Public formlar: domain/token resolve → insert → inbox görünür
Storage: CV upload → path → signed read → tenant izolasyonu
Teslimatlar
/docs/integration/dependency-map.md
(modül bazlı harita: Screen → Route → API → Contract → DB table → RLS policy → Storage)
/docs/integration/open-items.md
(eksik bağlantılar, kırık referanslar, P0/P1/P2)
/docs/handoff/integration-checklist.md
(merge öncesi kontrol listesi)
Plan Modu Görevler
Dependency Map üret
Her ekran için:
Screen → (app route) → (API/server action) → (Zod schema) → (DB table) → (RLS policy) → (storage bucket?)
Contract coverage kontrolü
Frontend’in import ettiği Zod’lar /packages/contracts mı?
API response’ları aynı schema’yı garanti ediyor mu?
DB coverage kontrolü
Her kullanılan tablo için migration var mı?
RLS USING + WITH CHECK ikisi de var mı?
Public submit zinciri
site resolve yöntemi (domain/token) tek ve tutarlı mı?
rate limit + honeypot gerçekten uygulanıyor mu?
UI component coverage
Ekran templates → component inventory’de var mı?
Çakışma raporu
“UX şu ekranı istiyor ama API yok” gibi P0 listesi
Go/No-Go output
MVP ship için “bloklayıcı eksikler” net
DoD
Dependency map MVP ekranlarının %100’ünü kapsıyor
En az 10 kritik bağlantı (özellikle public form zinciri) doğrulanmış
P0 listesi çıkmış ve PR sırası önerilmiş
Bu ajan “kontrol ajanı” ile karışmasın:
Integration ajanı üretim sürecinde “bağlantıları kurdurur/tespit eder”.
Control ajanı en sonda “nihai kalite” raporu verir.
2) SECURITY / COMPLIANCE AJANI — Çok Önerilir (Türkiye/KVKK + Multi-tenant için)
Senin pazarda (OSGB) veri işleme ve kayıtlar KVKK hassas. Ayrıca multi-tenant sistemlerde en pahalı bug güvenlik bug’ıdır.
Misyon
KVKK form metinleri, saklama prensipleri, PII minimizasyonu
RLS yanlışları, storage erişim açıkları
Rate limit, abuse kontrolü
Audit log’un PII sızdırmaması
Teslimatlar
/docs/security/threat-model.md (MVP seviyesinde)
/docs/security/kvkk-checklist.md
/docs/security/storage-policy.md
Plan Modu Görevler (MVP minimal)
Public endpointlerde PII loglanıyor mu?
CV bucket yanlışlıkla public mi?
“tenant_id client’tan geliyor mu?” (P0)
KVKK metni seçimi ve zorunlu checkbox enforce ediliyor mu?
DoD
10 maddelik KVKK checklist
10 maddelik multi-tenant güvenlik checklist
P0 riskler listesi
Başka agent gerekir mi?
Gerekmeyebilir, ama iki tane daha “duruma bağlı” ajan var. Eğer gerçekten hız istiyorsan bunları opsiyonel tut:
3) DEVOPS / RELEASE AJANI (Opsiyonel)
staging/prod publish, env vars, domain/ssl flow, log/monitoring, rollback stratejisi
MVP’de sadece “nasıl deploy edilir” yazması bile büyük kazanç.
4) DATA/ANALYTICS AJANI (Şimdilik gerek yok)
Event tracking, dönüşüm metrikleri, dashboard analytics
Sen şu an “ürünü çalıştırma” aşamasındasın; bunu Phase-2 yap.
Sonuç: Minimal ama güçlü ajan seti
Zorunlu:
UX
UI
CSS/Design System
Backend
Frontend
Test
Integration/Dependency (yeni)
Control/QA (en sonda)
Çok önerilir:
9) Security/Compliance
Bu yapı “ajan enflasyonu” yapmadan, senin istediğin bağlantı/bağımlılık kontrolünü gerçek anlamda çözer; ayrıca multi-tenant’ın klasik “sessiz veri sızıntısı” riskini erkenden öldürür.