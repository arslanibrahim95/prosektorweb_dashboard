# 🧪 Testing Dokümanları

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu klasör, ProsektorWeb Dashboard test stratejilerini ve CI süreçlerini içerir.

---

## 📂 Dosya Yapısı

| Dosya | Açıklama |
|-------|----------|
| [`test-guide.md`](test-guide.md) | Test rehberi ve strateji |
| [`ci.md`](ci.md) | CI/CD pipeline tanımı |

---

## 🎯 Test Piramidi

```
        ┌─────────┐
        │   E2E   │  ← Playwright (Az, kritik path)
        ├─────────┤
        │Integration│ ← API tests (Orta)
        ├─────────┤
        │  Unit   │  ← Vitest (Çok, hızlı)
        └─────────┘
```

---

## ✅ Quality Gate

```bash
pnpm run validate:agents-team
pnpm lint
pnpm test:api
pnpm test:web
```

---

## 🔗 İlgili Kaynaklar

- [Test Matrix](../../packages/testing/test-matrix.md)
- [Testing Package](../../packages/testing/README.md)
- [Quality Gates](../agent-ops/quality-gates.md)
