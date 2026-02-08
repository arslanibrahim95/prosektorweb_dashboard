Bağımsız Kontrol AJANI — Plan Modu (En Sonda)
Amaç
Diğer ajanların çıktısını “gerçekçi MVP” ve “güvenlik/izolasyon” açısından doğrulamak; açıkları ve çakışmaları raporlamak.
Girdi
/docs/ux/*
/docs/ui/*
/packages/contracts/*
/packages/db/*
/apps/web/*
Çıktı
/docs/review/control-report.md
İçerik: Bulgu listesi (P0/P1/P2), eksikler, çakışan kontratlar, riskler, önerilen düzeltme PR sırası.
Görevler
Kontrat uyumu kontrolü
UI’nin beklediği alanlar API’de var mı?
Zod şemaları frontend/backendlle aynı mı?
RLS ve tenant izolasyon testi senaryoları
“Tenant A ile Tenant B verisi okunabiliyor mu?” negatif test
Public endpoint güvenliği
rate limit/honeypot var mı?
CV upload limitleri net mi?
UX completeness
Her ekranda states var mı?
Nav/permission tutarlı mı?
MVP şişmesi
Phase-2 sızmış özellikleri kırp (pipeline, notes, assignment vb.)
Sonuç raporu
P0 (release blocker) / P1 / P2 şeklinde netleştir
Düzeltme için PR sırası öner
DoD (Kontrol)
En az 15 kontrol maddesi olan rapor
En az 5 P0/P1 tespit yoksa “ship-ready” beyanı
Çakışan tüm varsayımlar “tek doğru”ya indirgenmiş