# Agent Pipeline Quality Gates

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu dokuman, PR merge oncesi minimum kalite kapilarini tanimlar.

## 1. Zorunlu Gate Seti

```bash
pnpm run validate:agents-team
pnpm lint
pnpm test:api
pnpm test:web
```

Opsiyonel (main/release oncesi guclu kontrol):

```bash
pnpm test:db
pnpm test:e2e
```

## 2. Gate Sonucu Kurali

- Tum zorunlu gate'ler `pass` olmadan PR `ready-to-merge` olamaz.
- `validate:agents-team` fail ise pipeline konfig bozulmus kabul edilir.
- Test fail durumunda ilgili stage handover'u guncellenmeden ilerleme olmaz.

## 3. Stage Bazli Kabul Kriteri

| Stage | Minimum Kabul |
|------|----------------|
| UX | IA + ekran state tanimlari tamam |
| UI | Component spec + accessibility notlari mevcut |
| CSS | Token standardizasyonu ve dark/light kontrolu tamam |
| Frontend | Loading/error/empty ve role guard kontrolu tamam |
| Backend | Auth + tenant_id + validation + (gerekliyse) RLS notu tamam |
| Review | Severity raporu ve bloklayici karar net |
| Test | Kritik path testleri calisiyor |
| QA | DoD checklist + final karar verilmis |

## 4. CI Uyum Notu

`docs/testing/ci.md` dokumani pipeline seviyesindeki CI stratejisini aciklar.
Bu dosya ise agent zinciri icin PR-level gate kararlarini sabitler.
