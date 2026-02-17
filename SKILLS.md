# SKILLS.md - Özel Yetenekler Çantası

> **Versiyon:** 1.0.0 | **Son Güncelleme:** 2026-02-18
> **Bu dosya, Claude'un özel prosedürlerini ve iş akışlarını içerir.**

---

## 🎯 Skill 1: Feature Geliştirme Akışı

### Tetikleyici
"Yeni özellik ekle" veya "Şu özelliği yap" talebi

### Prosedür
```
1. docs/agents.md'den spesifikasyonu oku
2. Mevcut kodu incele (grep, glob)
3. Memory Bank'a yaz: activeContext.md
4. Kodu yaz
5. Test et
6. progress.md'ye kaydet
```

### Çıktı
- Çalışan kod
- Güncel activeContext.md
- Güncel progress.md

---

## 🎨 Skill 2: UI Component Geliştirme

### Tetikleyici
"Component oluştur" veya UI ile ilgili talep

### Prosedür
```
1. shadcn/ui mevcut mu kontrol et
2. Tailwind v4 uyumunu kontrol et
3. Mevcut component pattern'lerini incele
4. Component oluştur
5. Storybook yoksa test dosyası ekle
```

### Uyum Kuralları
```typescript
// Her zaman:
// - TypeScript strict mode
// - Props için interface tanımla
// - cn() utility kullan
// - forwardRef kullan (gerekiyorsa)
```

---

## 🔧 Skill 3: Backend/API Geliştirme

### Tetikleyici
"API ekle", "Endpoint oluştur" talebi

### Prosedür
```
1. Supabase schema kontrol et
2. RLS policy kontrol et
3. Zod schema oluştur (packages/contracts)
4. Server Action veya API Route oluştur
5. Auth kontrolü ekle
6. Error handling standardına uy
```

### Zorunlu Kontroller
```typescript
// Her API'de:
// 1. Auth kontrolü
// 2. tenant_id filtreleme
// 3. Input validasyonu (Zod)
// 4. Error response standardı
```

---

## 🗄️ Skill 4: Database Migration

### Tetikleyici
"Tablo ekle", "Schema değiştir" talebi

### Prosedür
```
1. Mevcut schema'yı oku (docs/db/schema.md)
2. Migration dosyası oluştur
3. RLS policy ekle
4. tenant_id ZORUNLU
5. Index ekle (performans için)
6. Test et
```

### Migration Formatı
```sql
-- Migration: 001_add_new_table
-- Date: 2026-02-18
-- Author: Claude

CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  -- ... other fields
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy
ALTER TABLE example ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON example
  USING (tenant_id = get_current_tenant_id());
```

---

## 🐛 Skill 5: Bug Fix Akışı

### Tetikleyici
Hata raporu veya "Şu çalışmıyor" talebi

### Prosedür
```
1. Hatayı reproduce et
2. İlgili kodu bul
3. Root cause analizi yap
4. Fix'i planla
5. Fix'i uygula
6. Test et
7. progress.md'ye kaydet
```

### Hata Kategorileri
| Kategori | Öncelik | Örnek |
|----------|---------|-------|
| Critical | 🔴 Hemen | Auth bypass, data leak |
| High | 🟠 1 gün içinde | Form submit çalışmıyor |
| Medium | 🟡 Hafta içinde | UI bug, typo |
| Low | 🟢 Backlog | Minor UX issue |

---

## 📝 Skill 6: Dokümantasyon Güncelleme

### Tetikleyici
Önemli değişiklik sonrası

### Prosedür
```
1. Hangi dosyalar etkilendi belirle
2. İlgili docs/ dosyalarını güncelle
3. progress.md'ye kaydet
```

### Doküman Mapping
| Değişiklik | Güncellenecek Döküman |
|------------|----------------------|
| API değişikliği | docs/api/ |
| DB değişikliği | docs/db/schema.md |
| UI değişikliği | docs/ui/ |
| UX değişikliği | docs/ux/ |
| Yeni feature | docs/agents.md |

---

## 🧪 Skill 7: Test Yazma

### Tetikleyici
Kritik iş mantığı kodu

### Prosedür
```
1. Test dosyasını belirle (__tests__/)
2. Test senaryolarını yaz
3. Edge case'leri kapsa
4. pnpm test çalıştır
```

### Test Pattern
```typescript
describe('Feature: X', () => {
  it('should do Y when Z', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## 🔄 Skill 8: Memory Bank Yönetimi

### activeContext.md Güncelleme
```
Her işe başlarken:
- Ne yapıyorsun?
- Hangi dosyalarla çalışıyorsun?
- Son durum ne?
```

### progress.md Güncelleme
```
Her iş bitiminde:
- Tarih
- Yapılan iş
- Çıktılar
- Sonraki adımlar (varsa)
```

---

## 🚀 Skill 9: Deployment Hazırlığı

### Tetikleyici
"Deploy et", "Production'a al" talebi

### Checklist
```
□ pnpm lint (hata yok)
□ pnpm typecheck (hata yok)
□ pnpm test (geçti)
□ pnpm build (başarılı)
□ .env değişkenleri kontrol
□ Migration'lar uygulandı
□ RLS policy'ler aktif
```

---

## 🎯 Skill 10: Öncelik Belirleme

### Framework
```
1. Security > Functionality > Performance > DX
2. MVP özellikleri > Nice-to-have
3. Kullanıcı etkisi yüksek > Düşük
4. Blocking issue > Non-blocking
```

---

## 📋 Skill 11: Code Review Protocol

### Kendi Kodumu Review Etme
```
1. Diff'i oku
2. Edge case'ler düşündüm mü?
3. Error handling var mı?
4. Type safety tamam mı?
5. Test yazdım mı?
6. Docstring/comment gerekli mi?
```

---

## 🔗 Skill Referansları

| Skill | İlgili Dosya |
|-------|--------------|
| Feature Development | docs/agents.md |
| UI Components | docs/ui/ |
| API Development | docs/api/ |
| Database | docs/db/ |
| Security | docs/security/ |

---

> **Hatırlatma:** Bu skill'ler CLAUDE.md'deki kurallara tabidir. Önce kurallara uy, sonra skill'leri uygula.
