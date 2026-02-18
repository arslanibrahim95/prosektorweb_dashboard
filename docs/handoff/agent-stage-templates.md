# Agent Stage Handover Templates

Bu dosya, stage-to-stage devri standartlastirmak icin zorunlu handover sablonlarini tanimlar.

## 1. Genel Handover Template

```markdown
# Handover: <STAGE_FROM> -> <STAGE_TO>

## Work Item
- ID:
- Baslik:
- Hedef:

## Scope
- Dahil:
- Haric:

## Inputs Used
- Dokumanlar:
- Kod/kontrat referanslari:

## Changes / Outputs
- Uretilen ciktilar:
- Degisen dosyalar:

## Risks
- Kritik:
- Yuksek:
- Orta:

## Open Questions
- Soru 1:
- Soru 2:

## Acceptance Snapshot
- [ ] Stage DoD saglandi
- [ ] Bloklayici bulgu yok
- [ ] Sonraki stage icin gerekli tum girdiler mevcut
```

## 2. UX -> UI (Zorunlu Alanlar)

- IA diyagram linki veya dosyasi
- Ekran bazli `purpose/url/permission`
- Empty/loading/error state tanimlari
- Role-based akis farklari

## 3. UI -> CSS (Zorunlu Alanlar)

- Component envanteri
- Her component icin `props/variants/states`
- Accessibility notlari (keyboard/aria/focus)
- Gerekli token ihtiyaclari

## 4. CSS -> Frontend (Zorunlu Alanlar)

- Token degisim listesi
- Hardcoded degerden token'a gecis listesi
- Dark/light davranis notu
- Responsive kural notlari

## 5. Frontend -> Backend (Zorunlu Alanlar)

- Ekran/flow bazli API ihtiyac listesi
- Istek/yanit kontrat referansi (Zod)
- Auth ve role guard beklentisi
- Error state icin beklenen hata kodlari

## 6. Backend -> Code Review (Zorunlu Alanlar)

- API/DB/RLS degisen dosya listesi
- Migration etkisi
- Tenant isolation onlemleri
- Rate limit / validation / security notlari

## 7. Code Review -> Test (Zorunlu Alanlar)

- Severity bazli bulgu listesi
- Repro adimlari
- En riskli 3 senaryo
- Gerekli test kapsami onceligi

## 8. Test -> QA (Zorunlu Alanlar)

- Calisan test setleri (unit/integration/e2e)
- Fail -> fix -> rerun ozeti
- Bilinen test disi riskler
- Coverage etkisi (varsa)

## 9. QA Final (Zorunlu Alanlar)

- DoD checklist durumu
- Gap listesi (kritikten dusuge)
- Final karar (`approved` / `blocked`)
- Takip aksiyonlari ve sahipleri
