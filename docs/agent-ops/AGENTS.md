# AGENTS.md

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu dosya, ajanlar icin hizli operasyon referansidir. Kapsamli teknik dokuman `docs/agent-ops/agents-index.md` icindedir.

## Canonical Spec

- Ana dokuman: `docs/agent-ops/agents-index.md`
- Runbook: `docs/agent-ops/runbook.md`
- Severity politikasi: `docs/agent-ops/severity-policy.md`
- Kontrol rapor ornegi: `docs/review/control-report.md`
- UX/UI team kurgusu ve sprint template: `README.md`

## Raporlama Standarti (Zorunlu)

Tum gorev dokumanlari ve review ciktilari asagidaki sirada raporlanir:

1. `Status (Strict)` + `Sayim (P0/P1/P2)`
2. `Executive Summary`
3. `Scope` (dahil/haric)
4. `Findings` (P0/P1/P2 tablolar)
5. `Faz Bazli Uygulama Plani`
6. `Acceptance Checklist`
7. `Decision Log`

`Findings` satirlari su alanlari icermelidir:

- `severity`
- `dosya:satir` (mumkunse)
- `bulgu`
- `etki`
- `onerilen fix`
- `durum` (`open`, `fixed`, `accepted-risk`)

## Not

Sadece checkbox listesi halinde gorev notu acmak yerine yukaridaki rapor formati kullanilir.
