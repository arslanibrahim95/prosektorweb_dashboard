# 💾 Database Dokümanları

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu klasör, ProsektorWeb Dashboard veritabanı şemasını ve güvenlik politikalarını içerir.

---

## 📂 Dosya Yapısı

| Dosya | Açıklama |
|-------|----------|
| [`schema.md`](schema.md) | DB şema tanımları |
| [`rls.md`](rls.md) | Row Level Security politikaları |
| [`migration-governance.md`](migration-governance.md) | Migration yönetim kuralları |
| [`supabase-validation-checklist.md`](supabase-validation-checklist.md) | Supabase doğrulama checklist |
| [`supabase-backend-validation-walkthrough.md`](supabase-backend-validation-walkthrough.md) | Backend doğrulama rehberi |

---

## 🚨 Kritik Kurallar

1. **tenant_id Zorunlu** - Tüm tenant-scoped tablolarda
2. **RLS Zorunlu** - tenant_id bazlı izolasyon
3. **Migration Kaynağı** - `packages/db/migrations/*.sql`
4. **Service Role** - Sadece public endpoint'lerde, RLS bypass

---

## 🔗 İlgili Kaynaklar

- [API Contracts](../api/api-contracts.md)
- [Security - Authentication](../security/AUTHENTICATION.md)
- [Public Forms Security](../security/public-forms.md)
