# Agents Team Implementation Plan (Production Ready)

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu plan, agents team yapisini teoriden operasyonel calismaya gecirmek icin karar-tam (decision complete) yol haritasidir.

## 1. Hedef

Amac:
- `UX -> UI -> CSS -> Frontend -> Backend -> Review -> Test -> QA` zincirini her work item icin standart ve izlenebilir sekilde calistirmak.

Basari:
- Her work item icin stage gecisleri kayitli.
- Handoverlar zorunlu formatta.
- Quality gates calisiyor.
- QA final karari olmadan `done` yok.

## 2. Kapsam

Dahil:
- Agent konfig ve workflow standartlari
- Stage handover formatlari
- Severity ve blocking kararlari
- CI/PR quality gate kurallari
- Haftalik operasyon metrikleri

Haric:
- Yeni feature implementasyonu
- UI/DB refactor karar degisiklikleri
- Deployment stratejisi degisikligi

## 3. Kaynak Dokumanlar (Single Source of Truth)

- Team config: `.gemini/agents.json`
- Workflow tanimlari: `.agent/workflows/`
- Runbook: `docs/agent-ops/runbook.md`
- Handover sablonlari: `docs/handoff/agent-stage-templates.md`
- Severity policy: `docs/agent-ops/severity-policy.md`
- Quality gates: `docs/agent-ops/quality-gates.md`
- Pilot template: `docs/agent-ops/pilot-retrospective-template.md`
- Weekly metrics template: `docs/agent-ops/weekly-metrics-template.md`

## 4. Hazirlik (T0)

Sorumlu:
- Tech Lead + Agent Orchestrator

Gorevler:
1. Agent konfig dogrula:
   - `pnpm run validate:agents-team`
2. Pipeline trigger isimlerini lock et:
   - `/ux-agent`, `/ui-agent`, `/css-agent`, `/frontend-agent`, `/backend-agent`, `/code-reviewer`, `/test-engineer`, `/qa-agent`
3. Work item durumlarini lock et:
   - `ready-for-ux`, `ready-for-ui`, `ready-for-css`, `ready-for-fe`, `ready-for-be`, `ready-for-review`, `ready-for-test`, `ready-for-qa`, `done`
4. Handover formatini zorunlu ilan et (sablon disi gecis yok).

Exit criteria:
- Validate komutu pass.
- Stage sirasi ekipte paylasildi.
- Durum akisi board/tool uzerinde tanimli.

## 5. Faz Bazli Uygulama Plani

## Faz 1 - Operasyon Aktivasyonu (Gun 1)

Sorumlu:
- Agent Orchestrator

Adimlar:
1. Runbook kickoff toplantisi (30 dk).
2. Her stage owner icin sorumluluk teyidi.
3. Bloklayici kriterlerin ekipce onayi.
4. Ilk pilot work item secimi (orta karmasiklik).

Ciktilar:
- Kickoff notu
- Pilot work item ID
- Owner listesi

Exit criteria:
- Zincirde her stage owner atanmis.
- Pilot item `ready-for-ux` durumunda.

## Faz 2 - Pilot Zincir (Gun 1-2)

Sorumlu:
- Tum stage ownerlari

Adimlar:
1. UX stage:
   - IA + screen spec + states cikisi
   - Handover: UX -> UI
2. UI stage:
   - Component spec + accessibility notlari
   - Handover: UI -> CSS
3. CSS stage:
   - Token degisim/plani + dark/light dogrulamasi
   - Handover: CSS -> Frontend
4. Frontend stage:
   - Sayfa/component implementasyon plani + state coverage
   - Handover: Frontend -> Backend
5. Backend stage:
   - API/DB/RLS/auth etkisi
   - Handover: Backend -> Review
6. Review stage:
   - Severity raporu + bloklayici karar
   - Handover: Review -> Test
7. Test stage:
   - Kritik path test raporu
   - Handover: Test -> QA
8. QA stage:
   - DoD checklist + gap listesi + final karar

Ciktilar:
- 8 stage handover kaydi
- 1 QA final raporu

Exit criteria:
- Kritik/Yuksek acik bulgu yok.
- Work item `done` veya net `blocked`.

## Faz 3 - Stabilizasyon (Gun 3-5)

Sorumlu:
- Tech Lead + QA Lead

Adimlar:
1. Pilot retrospektif doldur:
   - `docs/agent-ops/pilot-retrospective-template.md`
2. Surec darbozazlarini siniflandir:
   - handover eksigi
   - review gecikmesi
   - test kapsami boslugu
3. En az 3 aksiyon tanimla:
   - owner + tarih + beklenen etki
4. Ikinci work item ile dogrulama yap.

Exit criteria:
- Pilot aksiyonlari atanmis.
- Ikinci itemde ayni kritik tekrar etmiyor.

## Faz 4 - Rutin Operasyon (Haftalik)

Sorumlu:
- Agent Orchestrator

Adimlar:
1. Haftalik metrik raporu doldur:
   - `docs/agent-ops/weekly-metrics-template.md`
2. KPI review:
   - lead time
   - rework orani
   - QA kritik sayisi
   - gate fail orani
3. Kirmizi metrikler icin aksiyon ac.

Exit criteria:
- Her hafta metrik raporu var.
- Iyilestirme aksiyonlarinin sahibi var.

## 6. Stage Gecis Kurallari (Hard Rules)

1. Sablonsuz handover kabul edilmez.
2. Kritik/Yuksek bulgu acikken stage gecisi olmaz.
3. QA `approved` olmadan `done` olmaz.
4. `tenant_id + auth + validation` backendde zorunlu kontrol setidir.
5. Frontendde `loading/error/empty` state seti zorunludur.

## 7. Quality Gates (PR Level)

Zorunlu:

```bash
pnpm run validate:agents-team
pnpm lint
pnpm test:api
pnpm test:web
```

Guclu kontrol (release/main):

```bash
pnpm test:db
pnpm test:e2e
```

Gate fail davranisi:
- PR merge edilmez.
- Ilgili stage handoveru guncellenir.
- Re-run sonucu rapora eklenir.

## 8. RACI (Kisa)

| Aktivite | Responsible | Accountable | Consulted | Informed |
|---------|-------------|-------------|-----------|----------|
| Pipeline kurulumu | Agent Orchestrator | Tech Lead | QA Lead | Tum ekip |
| Stage ciktilari | Ilgili Stage Owner | Tech Lead | Review/Test/QA | Tum ekip |
| Severity karari | Code Reviewer | QA Lead | Backend/Frontend | Tech Lead |
| Final onay | QA Agent | QA Lead | Tum ownerlar | Tum ekip |
| Haftalik metrik | Agent Orchestrator | Tech Lead | QA Lead | Tum ekip |

## 9. Riskler ve Karsi Onlemler

1. Risk: Handover eksikligi
   - Onlem: Sablon zorunlu + stage exit checklist

2. Risk: Review/Test gecikmesi
   - Onlem: SLA tanimi (ornek: review <= 24s, test <= 24s)

3. Risk: Multi-tenant guvenlik atlanmasi
   - Onlem: Backend + Review + QA uclusu kontrol zorunlu

4. Risk: Rework artis
   - Onlem: Pilot retrospektif aksiyonlari 1 hafta icinde uygulanir

## 10. Uygulama Checklisti (Copy/Paste)

Her yeni work item acilisinda:

- [ ] Work item scope ve success criteria yazildi
- [ ] Durum `ready-for-ux`
- [ ] UX handover tamam
- [ ] UI handover tamam
- [ ] CSS handover tamam
- [ ] Frontend handover tamam
- [ ] Backend handover tamam
- [ ] Review raporu tamam
- [ ] Test raporu tamam
- [ ] QA final karari alindi
- [ ] Tum zorunlu gate komutlari pass
- [ ] Durum `done`

## 11. Ilk 2 Hafta Operasyon Takvimi

Hafta 1:
- Gun 1: Faz 1 + pilot baslatma
- Gun 2: Pilot tamamlama
- Gun 3: Retrospektif + aksiyon atama
- Gun 4-5: Ikinci item validasyonu

Hafta 2:
- Haftalik metrik takibi
- Darbogaz odakli surec iyilestirmesi
- Ayni ritimde en az 2 work itemin zincirden gecirilmesi

Basari siniri:
- 2 hafta sonunda en az 2 work item tam zincirden gecmis olmali.
- Kritik bulgu acikken `done` etiketlenmis is olmamali.
