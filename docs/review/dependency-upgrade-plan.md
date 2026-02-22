# Dependency Upgrade Planı

**Tarih:** 2026-02-22  
**Durum:** Planlama  
**Risk Seviyesi:** Orta-Yüksek

---

## Özet

Bu belge, `pnpm outdated` ve `pnpm audit` sonuçlarına dayanarak güvenlik ve sürdürülebilirlik için gerekli dependency upgrade'lerini planlar.

---

## Mevcut Durum

### Güvenlik Açıkları (pnpm audit)

| Paket | CVE | Severity | Kaynak |
|-------|-----|----------|--------|
| `minimatch` < 10.2.1 | GHSA-3ppc-4f35-3m26 | HIGH | ESLint transitive |
| `ajv` < 6.14.0 / < 8.18.0 | GHSA-2g4f-4pwh-qvx6 | MODERATE | ESLit + shadcn/MCP |
| `qs` <= 6.14.1 | GHSA-xxxx | LOW | shadcn/MCP transitive |

### Outdated Dependencies

| Paket | Mevcut | Son | Risk |
|-------|--------|-----|------|
| `@supabase/supabase-js` | 2.95.3 | 2.97.0 | DÜŞÜK |
| `isomorphic-dompurify` | 2.36.0 | 3.0.0 | **YÜKSEK** (major) |
| `vitest` | 1.6.1 | 4.0.18 | **YÜKSEK** (major) |
| `eslint` | 9.39.2 | 10.0.1 | **YÜKSEK** (major) |
| `@types/node` | 20.19.33 | 25.3.0 | ORTA (major, gerek yok) |
| `@tailwindcss/postcss` | 4.1.18 | 4.2.0 | DÜŞÜK |
| `tailwindcss` | 4.1.18 | 4.2.0 | DÜŞÜK |
| `lucide-react` | 0.563.0 | 0.575.0 | DÜŞÜK |
| `react` / `react-dom` | 19.2.3 | 19.2.4 | DÜŞÜK |
| `@tanstack/react-query` | 5.90.20 | 5.90.21 | DÜŞÜK |

---

## Faz 1: Düşük Riskli Upgrades (Hemen Yapılabilir)

### 1.1 Patch/Minor Updates

```bash
# Güvenli patch/minor updates
pnpm update @supabase/supabase-js @tanstack/react-query @types/react react react-dom react-hook-form next-intl lucide-react tailwind-merge --latest
```

**Beklenen Etki:** Hiçbir breaking change yok.

**Test:** 
```bash
pnpm run build && pnpm test
```

### 1.2 Tailwind v4.2

```bash
pnpm update tailwindcss @tailwindcss/postcss --latest --filter web
```

**Beklenen Etki:** Minor improvements, yeni utility'ler.

---

## Faz 2: Orta Riskli Upgrades (Test Gerekli)

### 2.1 @types/node v20 → v25

**Durum:** Gerekli değil. v20 LTS olarak destekleniyor. Upgrade opsiyonel.

```bash
# İstenirse
pnpm update @types/node --latest --filter web --filter api
```

**Risk:** Bazı eski type definitions uyumsuz olabilir.

---

## Faz 3: Yüksek Riskli Upgrades (Breaking Changes)

### 3.1 isomorphic-dompurify 2.x → 3.x

**Kullanım:**
```
apps/api/src/server/security/file-validation.ts
apps/api/src/server/security/index.ts
```

**Breaking Changes:**
- ESM-first import değişiklikleri
- `DOMPurify.sanitize()` API değişiklikleri
- Browser detection logic farklı

**Plan:**
1. Branch oluştur: `feat/upgrade-dompurify`
2. Upgrade yap
3. Tüm sanitize call'ları test et
4. Security test suite'i çalıştır

```bash
# Upgrade
pnpm update isomorphic-dompurify --latest --filter api

# Test
pnpm run test --filter api
```

### 3.2 vitest 1.x → 4.x

**Kullanım:**
```
apps/web/vitest.config.ts
apps/api/vitest.config.ts
packages/testing/
```

**Breaking Changes:**
- Config format değişiklikleri
- Assertion API değişiklikleri
- Coverage provider değişiklikleri
- Mock API değişiklikleri

**Plan:**
1. Branch oluştur: `feat/upgrade-vitest`
2. Migration guide takip et: https://vitest.dev/guide/migration.html
3. Config dosyalarını güncelle
4. Test'leri çalıştır ve fix'le

```bash
# Upgrade
pnpm update vitest @vitest/coverage-v8 @vitest/ui --latest

# Migration
npx vitest migrate
```

### 3.3 eslint 9.x → 10.x

**Kullanım:** Tüm projelerde dev dependency

**Breaking Changes:**
- Config format değişiklikleri (flat config)
- Plugin API değişiklikleri
- Rule isimlendirmeleri

**Peer Dependency Sorunları:**
- `typescript-eslint` henüz ESLint 10'ı tam desteklemiyor
- `eslint-plugin-react` henüz ESLint 10 desteklemiyor
- `eslint-plugin-react-hooks` henüz ESLint 10 desteklemiyor

**Plan:**
1. **BEKLE** - Ecosystem ESLint 10'a hazır değil
2. Alternatif: ESLint 9.39.2'de kal, minimatch vulnerability'sini override ile çöz

```bash
# Temporary fix for minimatch vulnerability
# pnpm-workspace.yaml veya package.json'a ekle:
# 
# pnpm:
#   overrides:
#     minimatch: ^10.2.1
#     ajv: ^8.18.0
```

---

## Faz 4: Güvenlik Değerlendirmesi

### Dev Dependency Vulnerability Analizi

Aşağıdaki vulnerability'ler **sadece dev dependency'lerde** bulunuyor ve production bundle'da yer almıyor:

| Paket | Kaynak | Severity | Production Etkisi |
|-------|--------|----------|-------------------|
| `minimatch` < 10.2.1 | ESLint transitive | HIGH | ❌ Yok (dev-only) |
| `ajv` < 6.14.0 / < 8.18.0 | ESLint + shadcn/MCP | MODERATE | ❌ Yok (dev-only) |
| `qs` <= 6.14.1 | shadcn/MCP > express | LOW | ❌ Yok (dev-only) |
| `hono` < 4.11.10 | shadcn/MCP | LOW | ❌ Yok (dev-only) |

**Sonuç:** Bu vulnerability'ler development ortamında risk oluşturmuyor. Production bundle'da bu paketler yer almıyor. ESLint 10 upgrade'i ile çözülecek (Faz 3.3).

### Override Denemesi

pnpm overrides denendi ancak transitive dev dependency'ler için etkili olmadı:

```yaml
# pnpm-workspace.yaml (KALDIRILDI)
# pnpm:
#   overrides:
#     minimatch: ^10.2.1
#     ajv: ^8.18.0
#     qs: ^6.14.2
```

**Neden çalışmadı:** pnpm overrides sadece direct dependency'ler ve belirli senaryolarda çalışıyor. ESLint'in internal dependency'leri override edilemiyor.

---

## Zaman Çizelgesi

| Faz | Süre | Öncelik |
|-----|------|---------|
| Faz 1 (Patch/Minor) | 1 gün | Yüksek |
| Faz 4 (Security Overrides) | 1 saat | Yüksek |
| Faz 2 (@types/node) | Opsiyonel | Düşük |
| Faz 3.1 (DOMPurify) | 2-3 gün | Orta |
| Faz 3.2 (Vitest) | 2-3 gün | Orta |
| Faz 3.3 (ESLint 10) | BEKLE | Düşük |

---

## Checklist

### Faz 1 (Hemen)
- [ ] Patch/minor updates uygula
- [ ] Build test et
- [ ] Unit test çalıştır
- [ ] E2E test (varsa)

### Faz 4 (Security Overrides)
- [ ] `pnpm-workspace.yaml` overrides ekle
- [ ] `pnpm install` çalıştır
- [ ] `pnpm audit` doğrula

### Faz 3.1 (DOMPurify)
- [ ] Branch oluştur
- [ ] Upgrade yap
- [ ] sanitize call'ları review et
- [ ] Security test et
- [ ] PR aç

### Faz 3.2 (Vitest)
- [ ] Branch oluştur
- [ ] Migration guide takip et
- [ ] Config update
- [ ] Test fix'leri
- [ ] PR aç

### Faz 3.3 (ESLint 10)
- [ ] Ecosystem hazır olana kadar bekle
- [ ] typescript-eslint release notes takip et
- [ ] eslint-plugin-react release notes takip et

---

## Rollback Planı

Her major upgrade için:
1. Git branch'te çalış
2. PR aç, review al
3. Merge sonrası sorun çıkarsa:
   ```bash
   git revert <commit-hash>
   pnpm install
   ```

---

## Kaynaklar

- [Vitest Migration Guide](https://vitest.dev/guide/migration.html)
- [ESLint 10 Release Notes](https://eslint.org/blog/)
- [isomorphic-dompurify Changelog](https://github.com/kkomelin/isomorphic-dompurify/blob/master/CHANGELOG.md)
- [Supabase JS Changelog](https://github.com/supabase/supabase-js/releases)
