# 🔐 Security Dokümanları

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu klasör, ProsektorWeb Dashboard güvenlik standartlarını ve protokollerini içerir.

---

## 📂 Dosya Yapısı

| Dosya | Açıklama | Dil |
|-------|----------|-----|
| [`AUTHENTICATION.md`](AUTHENTICATION.md) | Kimlik doğrulama güvenliği | 🇬🇧 |
| [`TESTING.md`](TESTING.md) | Güvenlik test prosedürleri | 🇬🇧 |
| [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md) | Production deployment checklist | 🇬🇧 |
| [`PRODUCTION_ENV_PROFILE.md`](PRODUCTION_ENV_PROFILE.md) | Production ortam profili | 🇬🇧 |
| [`SECURITY_FIXES_SUMMARY.md`](SECURITY_FIXES_SUMMARY.md) | Güvenlik düzeltmeleri özeti | 🇬🇧 |
| [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) | Güvenlik migrasyon rehberi | 🇬🇧 |
| [`public-forms.md`](public-forms.md) | Public form güvenliği | 🇹🇷 |

---

## 🚨 Kritik Güvenlik Kuralları

1. **JWT Secrets:** Supabase ve Custom JWT için ayrı secret'lar kullanılır
2. **RLS:** Tüm tenant-scoped tablolarda RLS zorunludur
3. **Public Forms:** Rate-limit + honeypot + site_token doğrulama
4. **Environment:** Production'da `.env.local` kullanılır, asla `.env` commit edilmez

---

## 🔗 İlgili Kaynaklar

- [RLS Policies](../db/rls.md)
- [API Contracts](../api/api-contracts.md)
- [Quality Gates](../agent-ops/quality-gates.md)
