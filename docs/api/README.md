# 🔌 API Dokümanları

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu klasör, ProsektorWeb Dashboard API kontratlarını ve webhook mimarisini içerir.

---

## 📂 Dosya Yapısı

| Dosya | Açıklama |
|-------|----------|
| [`dashboard-api-contract.md`](dashboard-api-contract.md) | Tam API spesifikasyonu |
| [`api-contracts.md`](api-contracts.md) | API kontrat özeti |
| [`webhook-architecture.md`](webhook-architecture.md) | Webhook mimarisi (planlanan) |
| [`backend-hardening-inventory.md`](backend-hardening-inventory.md) | Backend güvenlik envanteri |

---

## 🎯 API Prensipleri

1. **RESTful** - Standart HTTP metodları
2. **Zod Validation** - Request/Response doğrulama
3. **Error Format** - `{code, message, details}`
4. **Tenant Isolation** - RLS ile otomatik

---

## 🔒 Public Endpoints

| Endpoint | Auth | Rate Limit |
|----------|------|------------|
| `/api/public/offer` | site_token | 10/dk |
| `/api/public/contact` | site_token | 5/dk |
| `/api/public/hr/apply` | site_token | 3/dk |

---

## 🔗 İlgili Kaynaklar

- [DB Schema](../db/schema.md)
- [RLS Policies](../db/rls.md)
- [Security](../security/)
