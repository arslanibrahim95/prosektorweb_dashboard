# 🤖 Agent Operations

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23
> **Kapsam:** 8 aşamalı geliştirme zinciri (Planning → Execution → Verification)

Bu dizin, ProsektorWeb Dashboard için otomatik agent pipeline dokümantasyonunu içerir.

---

## 📋 Doküman İndeksi

| Dosya | Açıklama | Kullanım |
|-------|----------|----------|
| [`agents-index.md`](agents-index.md) | Ana teknik spesifikasyon (54KB) | Tüm agent'lar için canonical referans |
| [`AGENTS.md`](AGENTS.md) | Hızlı operasyon referansı | Günlük operasyonlar için kısa özet |
| [`runbook.md`](runbook.md) | Operasyonel runbook | Pipeline çalıştırma prosedürleri |
| [`roles-and-checklists.md`](roles-and-checklists.md) | Rol tanımları ve checklistler | DoD (Definition of Done) şablonları |
| [`quality-gates.md`](quality-gates.md) | Kalite kapıları | PR merge öncesi zorunlu kontroller |
| [`severity-policy.md`](severity-policy.md) | Severity ve blocking politikası | Bulguların sınıflandırılması |
| [`implementation-plan.md`](implementation-plan.md) | Implementasyon planı | Faz bazlı uygulama roadshow |
| [`weekly-metrics-template.md`](weekly-metrics-template.md) | Haftalık metrik şablonu | Performans takibi |
| [`pilot-retrospective-template.md`](pilot-retrospective-template.md) | Retrospektif şablonu | Sprint değerlendirme |

---

## 🔄 Pipeline Akışı

```
┌─────────────────────────────────────────────────────────────────────┐
│                        8-AŞAMALI GELİŞTİRME ZİNCİRİ                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PLANNING (3 stage)                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                        │
│  │ UX Agent │ → │ UI Agent │ → │ CSS Agent│                        │
│  │  Kimi 2.5│   │  Kimi 2.5│   │   GLM5   │                        │
│  └──────────┘   └──────────┘   └──────────┘                        │
│       ↓                                                             │
│  EXECUTION (2 stage)                                                │
│  ┌──────────────┐   ┌──────────────┐                               │
│  │Frontend Agent│ → │Backend Agent │                               │
│  │   Kimi 2.5   │   │ Codex 5.3 Hi │                               │
│  └──────────────┘   └──────────────┘                               │
│       ↓                                                             │
│  VERIFICATION (3 stage)                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────┐                   │
│  │Code Reviewer│ → │Test Engineer│ → │QA Agent │                   │
│  │   Kimi 2.5  │   │ Codex 5.3 Hi│   │Opus 4.6 │                   │
│  └─────────────┘   └─────────────┘   └─────────┘                   │
│       ↓                                                             │
│     ✅ DONE                                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Hızlı Başlangıç

### Tek Stage Tetikleme
```bash
/ux-agent <feature açıklaması>
/ui-agent <UX çıktısı>
/css-agent <UI çıktısı>
/frontend-agent <implementasyon planı>
/backend-agent <API/DB ihtiyaçları>
/code-reviewer <değişiklik listesi>
/test-engineer <test planı>
/qa-agent <QA checklist>
```

### Tam Pipeline (Tek Komut)
```bash
/pipeline-orchestrator <work item açıklaması>
```

### Work Item Durum Akışı
```
ready-for-ux → ready-for-ui → ready-for-css → ready-for-fe →
ready-for-be → ready-for-review → ready-for-test → ready-for-qa → done
```

---

## ✅ Quality Gate (PR Öncesi Zorunlu)

```bash
pnpm run validate:agents-team && pnpm lint && pnpm test:api && pnpm test:web
```

> Detaylar: [`quality-gates.md`](quality-gates.md)

---

## 🚨 Severity Politikası

| Seviye | Tanım | Merge Etkisi |
|--------|-------|--------------|
| Kritik | Güvenlik açığı, tenant izolasyon ihlali | 🔴 Bloklayıcı |
| Yüksek | Feature bozukluğu, auth zafiyeti | 🔴 Bloklayıcı |
| Orta | Davranış uyumsuzluğu, performans | 🟡 Düzeltilmeli |
| Düşük | Dokümantasyon, naming | 🟢 Bloklamaz |

> Detaylar: [`severity-policy.md`](severity-policy.md)

---

## 📂 İlgili Kaynaklar

| Kaynak | Konum |
|--------|-------|
| Pipeline Config | `.gemini/agents.json` |
| Workflow Templates | `.agent/workflows/*.md` |
| Handover Templates | `docs/handoff/agent-stage-templates.md` |
| Ana Dokümantasyon | `docs/README.md` |

---

## 🔗 Geri Bağlantılar

- **Ana Sayfa:** [`docs/README.md`](../README.md)
- **Proje Anayasası:** [`CLAUDE.md`](../../CLAUDE.md)
- **Skills:** [`SKILLS.md`](../../SKILLS.md)
