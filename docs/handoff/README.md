# 🤝 Handoff Dokümanları

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu klasör, agent'lar arası ve ekipler arası geçiş (handoff) dokümanlarını içerir.

---

## 📂 Dosya Yapısı

| Dosya | Açıklama | Yön |
|-------|----------|-----|
| [`agent-stage-templates.md`](agent-stage-templates.md) | Stage-to-stage handover şablonları | Agent → Agent |
| [`backend-to-frontend.md`](backend-to-frontend.md) | Backend'den Frontend'e geçiş | BE → FE |
| [`frontend-to-test.md`](frontend-to-test.md) | Frontend'den Test'e geçiş | FE → QA |
| [`REFACTOR_ROADMAP.md`](REFACTOR_ROADMAP.md) | Refaktör yol haritası | Planlama |

---

## 🔄 Agent Handover Akışı

```
UX → UI → CSS → Frontend → Backend → Review → Test → QA
 ↓     ↓     ↓       ↓         ↓        ↓       ↓      ↓
Spec  Comp  Tokens  Pages    APIs   Report  Tests  Sign-off
```

---

## 📋 Handover Template Formatı

Her handover dokümanı şunları içerir:

1. **Work Item ID ve Başlık**
2. **Değişiklik Listesi**
3. **Kontrat Referansları**
4. **Test Gereksinimleri**
5. **Bilinen Sorunlar**
6. **Onay Checklist**

---

## 🔗 İlgili Kaynaklar

- [Agent Runbook](../agent-ops/runbook.md)
- [Quality Gates](../agent-ops/quality-gates.md)
- [Test Guide](../testing/test-guide.md)
