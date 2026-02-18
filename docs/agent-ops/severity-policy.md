# Severity and Blocking Policy

Agent pipeline icinde tum bulgular asagidaki seviyelerle raporlanir.

## Severity Seviyeleri

| Seviye | Tanim | Merge Etkisi |
|-------|-------|--------------|
| Kritik | Guvenlik/acik, tenant izolasyon ihlali, data corruption riski | Bloklayici |
| Yuksek | Feature bozumu, auth/rbac zafiyeti, ciddi regresyon | Bloklayici |
| Orta | Davranis uyumsuzlugu, performans sorunu, eksik edge-case | Duzeltilmeli veya acik risk olarak kayda alinmali |
| Dusuk | Dokumantasyon/naming/nitpick | Merge'i bloklamaz |

## Bloklayici Karar Kurali

Asagidaki hallerde stage `blocked` olur:

- Kritik bulgu acik
- Yuksek bulgu acik
- Orta bulgu acik + owner atanmamis
- Test raporunda kritik path fail
- QA checklist kritik maddeleri eksik

## Rapor Formati

Her raporda asagidaki alanlar zorunlu:

- `severity`
- `dosya:satir` (munkunse)
- bulgu aciklamasi
- etkisi
- onerilen cozum
- durum (`open`, `fixed`, `accepted-risk`)

## Accepted Risk Kurali

`accepted-risk` sadece su kosullarda kullanilir:

- Kritik/Yuksek degilse
- Is owner ve tarih atanmis ise
- QA raporunda acikca not edilmis ise
