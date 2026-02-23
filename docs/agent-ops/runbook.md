# Agents Team Runbook

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu runbook, dashboard repo icinde agent zincirinin standart ve tekrarlanabilir bicimde calismasi icin operasyonel kilavuzdur.

## 1. Pipeline Ozeti

| Sira | Asama | Agent | Tool / Model | Trigger |
|------|-------|-------|--------------|---------|
| 1 | Planning | UX Agent | OpenCode / Kimi 2.5 | `/ux-agent` |
| 2 | Planning | UI Agent | OpenCode / Kimi 2.5 | `/ui-agent` |
| 3 | Planning | CSS/Design System Agent | OpenCode / GLM5 | `/css-agent` |
| 4 | Execution | Frontend Agent | OpenCode / Kimi 2.5 | `/frontend-agent` |
| 5 | Execution | Backend Agent | Codex / 5.3 High | `/backend-agent` |
| 6 | Verification | Code Reviewer | MiniMax / 2.5 | `/code-reviewer` |
| 7 | Verification | Test Engineer | Codex / 5.3 High | `/test-engineer` |
| 8 | Verification | QA Agent | Opus / 4.6 | `/qa-agent` |

Tek kaynak konfig:
- `.gemini/agents.json`
- `.agent/workflows/*.md`

## 2. Is Paketi Yasam Dongusu

Durumlar asagidaki sirayla kullanilir:

1. `ready-for-ux`
2. `ready-for-ui`
3. `ready-for-css`
4. `ready-for-fe`
5. `ready-for-be`
6. `ready-for-review`
7. `ready-for-test`
8. `ready-for-qa`
9. `done`

Kural:
- Bir asama `approved` olmadan sonraki duruma gecilmez.
- Bloklayici bir bulgu varsa durum bir onceki asamaya geri cekilir.

## 3. Asama Giris/Cikis Sozlesmesi

| Asama | Giris (zorunlu) | Cikis (zorunlu) |
|------|------------------|-----------------|
| UX | Is paketi tanimi + hedef rol/persona | IA + ekran spec + state tanimlari |
| UI | UX ciktisi | Component spec + wireframe/pattern notlari |
| CSS | UI ciktisi + mevcut token durumu | Token degisim listesi + dark/light kontrolu |
| Frontend | UX/UI/CSS ciktisi + kontrat referansi | Sayfa/component degisiklik listesi + state coverage |
| Backend | FE ihtiyaclari + data kontrati | API/DB/RLS degisiklik listesi + auth/tenant notlari |
| Code Review | FE/BE degisiklikleri | Severity bazli risk raporu |
| Test | Review geri bildirimleri + degisiklik listesi | Unit/integration/e2e test raporu |
| QA | Tum onceki asama ciktilari | DoD checklist + gap listesi + final karar |

## 4. Bloklayici Kriterler

Asagidaki durumlar stage ilerlemesini bloklar:

- Backend:
  - `tenant_id` izolasyonu eksik
  - auth guard eksik veya bypass riski
  - RLS etkisi olan degisiklikte policy/plana yer verilmemesi
- Frontend:
  - loading/error/empty state tanimsiz
  - rol bazli erisim gereken ekranda guard eksigi
- Test:
  - kritik path icin test yok
  - mevcut testlerde yeni regresyon
- QA:
  - DoD checklist'te kritik madde eksik
  - kritik/yuksek bulgu kapatilmadan onay istenmesi

Detayli severity politikasi:
- `docs/agent-ops/severity-policy.md`
- `docs/agent-ops/implementation-plan.md`

## 5. Handover Kurali

Her stage cikisi tek bir handover notu ile bir sonraki stage'e devredilir.

Zorunlu handover formati:
- `docs/handoff/agent-stage-templates.md`

Zorunlu alanlar:
- Scope
- Degisen dosyalar
- Riskler
- Acik sorular
- Kabul kriteri durumu

## 6. Kalite Kapilari (Pre-Merge)

PR birlesmeden once minimum calismasi gereken komutlar:

```bash
pnpm run validate:agents-team
pnpm lint
pnpm test:api
pnpm test:web
```

E2E stratejisi ve CI baglami:
- `docs/testing/ci.md`
- `docs/agent-ops/quality-gates.md`

## 7. Pilot Calisma Proseduru

Ilk pilot veya yeni pipeline degisikliklerinde:

1. Orta karmasiklikta tek bir is paketi sec.
2. Zinciri 1->8 sirasiyla tam calistir.
3. Her asamada sure, blokaj, yeniden is oranini logla.
4. Pilot cikisinda retrospektif notu cikar.

Pilot kayit sablonu:
- `docs/agent-ops/pilot-retrospective-template.md`

## 8. Haftalik Operasyon Metrikleri

Takip edilmesi gereken minimum KPI:

- Is paketi basina toplam lead time
- Rework orani (`geri donen is / toplam is`)
- QA kritik bulgu sayisi
- Review guvenlik bulgu sayisi
- Gate fail orani (lint/test)

Rapor sablonu:
- `docs/agent-ops/weekly-metrics-template.md`

## 9. Escalation Kurali

Asagidaki durumlarda escalation zorunludur:

- Kritik guvenlik bulgusu
- Tenant isolation riski
- Data loss veya migration rollback ihtiyaci
- Pipeline'da ard arda iki stage fail

Escalation kaydi minimum:
- Olay ozeti
- Etkilenen dosya/modul
- Gecici onlem
- Kalici onlem aksiyonu ve sahip
