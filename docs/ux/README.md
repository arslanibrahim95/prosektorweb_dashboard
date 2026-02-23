# 🧭 UX Dokümanları

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu klasör, ProsektorWeb Dashboard kullanıcı deneyimi tasarımını içerir.

---

## 📂 Dosya Yapısı

| Dosya | Açıklama |
|-------|----------|
| [`ia.md`](ia.md) | Information Architecture (Bilgi Mimarisi) |
| [`workflows.md`](workflows.md) | Kritik kullanıcı akışları |
| [`screen-specs.md`](screen-specs.md) | Ekran spesifikasyonları (state, CTA, permissions) |

---

## 🎯 UX Hedefleri

1. **5 Dakikalık Onboarding** - Yeni müşteri hızlı aktif
2. **Self-Service** - Müşteri kendi işini kendi yapabilmeli
3. **Error Prevention** - Hata yapmayı zorlaştır
4. **Progressive Disclosure** - Karmaşıklığı kademeli göster

---

## 📱 State Standardı

Her ekran 6 state'i destekler:

| State | Açıklama |
|-------|----------|
| Loading | Skeleton / Spinner |
| Empty | Boş durum mesajı + CTA |
| Success | Normal görüntü |
| Error | Hata mesajı + Retry |
| Unauthenticated | Login redirect |
| Unauthorized | Permission denied |

---

## 🔗 İlgili Kaynaklar

- [Page Templates](../ui/page-templates.md)
- [Component Inventory](../ui/component-inventory.md)
- [Workflows](workflows.md)
