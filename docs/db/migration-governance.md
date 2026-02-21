# Migration Governance

## Amaç
`packages/db/migrations` ile `supabase/migrations` arasında drift oluşmasını engellemek ve migration süreçlerini tekrar edilebilir hale getirmek.

## Kaynak Kuralı
- **Primary source:** `packages/db/migrations/*.sql`
- `supabase/migrations/*.sql` klasörü, mümkün olduğu kadar bu dosyalara symlink ile işaret etmelidir.
- `supabase/migrations` altındaki standalone dosyalar yalnızca zorunlu Supabase platform migration'ları için kullanılmalıdır.

## Naming ve Sıralama
- Dosya adı formatı: `NNNN_description.sql` (örn: `0017_feature_flag.sql`)
- Sıralama strictly monotonik artmalıdır.
- Her migration tek sorumluluk prensibine yakın olmalıdır (tek domain değişiklik grubu).

## Güvenlik ve Uyumluluk
- No-breaking yaklaşımı: drop/rename yerine additive değişiklik + deprecate akışı.
- RLS/policy değişiklikleri migration ile birlikte versionlanmalı.
- Geri alma (rollback) notu migration PR açıklamasında zorunlu olmalı.

## Kontrol Komutları
- Rapor: `pnpm db:migrations:sync-report`
- Strict check: `pnpm db:migrations:sync-check`

## PR Checklist (DB)
- [ ] Yeni migration `packages/db/migrations` altına eklendi.
- [ ] `supabase/migrations` eşleşmesi/symlinki doğrulandı.
- [ ] RLS/policy etkisi değerlendirildi.
- [ ] API/contracts etkisi (schema/type) değerlendirildi.
- [ ] Rollback stratejisi not edildi.

