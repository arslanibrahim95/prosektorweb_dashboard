# Admin Panel Eksik Özellikler Uygulama Planı

## Genel Bakış

Bu plan, admin paneldeki "yakında eklenecek" olan özelliklerin implementasyonunu kapsar. Her özellik için gerekli backend API endpoint'leri, veritabanı şemaları ve frontend değişiklikleri belirtilmiştir.

---

## 1. Yedekleme (Backup) Özellikleri

### Mevcut Durum
- Frontend: [`apps/web/src/app/(dashboard)/admin/backup/page.tsx`](apps/web/src/app/(dashboard)/admin/backup/page.tsx) -placeholder fonksiyonlar var
- Backend: API endpoint yok

### Gerekenler

#### 1.1 Veritabanı Şeması
```sql
-- migrations/20260210000007_backup.sql
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('full', 'partial', 'config')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_backups_tenant_id ON backups(tenant_id);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);
```

#### 1.2 Backend API
```
API Endpoints:
- GET    /api/admin/backups        - Backup listesini getir
- POST   /api/admin/backups        - Yeni backup oluştur
- GET    /api/admin/backups/:id    - Backup detayını getir
- DELETE /api/admin/backups/:id    - Backup sil
- POST   /api/admin/backups/:id/restore - Backup geri yükle
- POST   /api/admin/backups/upload - Backup dosyası yükle
```

**Dosya:** `apps/api/src/app/api/admin/backup/route.ts`

#### 1.3 Frontend Güncellemeleri
- `useAdminBackups` hook ekle
- `BackupDialog` componenti ekle
- Toast mesajlarını gerçek API çağrılarıyla değiştir

---

## 2. Önbellek (Cache) Yönetimi

### Mevcut Durum
- Frontend: [`apps/web/src/app/(dashboard)/admin/cache/page.tsx`](apps/web/src/app/(dashboard)/admin/cache/page.tsx) - placeholder fonksiyonlar var
- Backend: In-memory cache var (`apps/api/src/server/cache.ts`)

### Gerekenler

#### 2.1 Veritabanı Şeması
```sql
-- migrations/20260210000008_cache_settings.sql
CREATE TABLE IF NOT EXISTS cache_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auto_purge BOOLEAN DEFAULT true,
    purge_interval VARCHAR(50) DEFAULT 'daily' CHECK (purge_interval IN ('hourly', 'every6hours', 'daily', 'weekly')),
    max_size_mb INTEGER DEFAULT 1024,
    enabled_types JSONB DEFAULT '["query", "api", "static"]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 2.2 Backend API
```
API Endpoints:
- GET    /api/admin/cache          - Cache istatistiklerini getir
- DELETE /api/admin/cache          - Cache temizle
- GET    /api/admin/cache/settings - Cache ayarlarını getir
- PUT    /api/admin/cache/settings - Cache ayarlarını güncelle
```

**Dosya:** `apps/api/src/app/api/admin/cache/route.ts`

#### 2.3 Frontend Güncellemeleri
- `useAdminCache`, `useAdminCacheSettings` hook ekle
- Cache istatistik kartları ekle
- Settings formunu aktif et

---

## 3. Güvenlik (Security) Özellikleri

### Mevcut Durum
- Frontend: [`apps/web/src/app/(dashboard)/admin/security/page.tsx`](apps/web/src/app/(dashboard)/admin/security/page.tsx) - placeholder fonksiyonlar var
- Backend: Sessions endpoint var, IP blocking yok

#### 3.1 Oturum Yönetimi (Var ama eksik)
- Mevcut: `GET /api/admin/security/sessions` (listeleme)
- Eksik: Session sonlandırma

```typescript
// Ek endpoint: apps/api/src/app/api/admin/security/sessions/[id]/route.ts
DELETE - Session sonlandır
POST   - Tüm sessionları sonlandır
```

#### 3.2 IP Engelleme (Yok)
```sql
-- migrations/20260210000009_ip_blocking.sql
CREATE TABLE IF NOT EXISTS ip_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ip_address CIDR NOT NULL,
    reason TEXT,
    blocked_until TIMESTAMPTZ, -- NULL = permanent
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ip_blocks_tenant_ip ON ip_blocks(tenant_id, ip_address);
```

#### 3.3 Backend API
```
API Endpoints:
- GET    /api/admin/security/ip-blocks       - IP block listesini getir
- POST   /api/admin/security/ip-blocks        - IP engelle
- DELETE /api/admin/security/ip-blocks/:id     - IP engelini kaldır
- DELETE /api/admin/security/sessions/:id     - Session sonlandır
- POST   /api/admin/security/sessions/terminate-all - Tüm sessionları sonlandır
```

**Dosyalar:**
- `apps/api/src/app/api/admin/security/ip-blocks/route.ts`
- `apps/api/src/app/api/admin/security/sessions/[id]/route.ts`

#### 3.4 Frontend Güncellemeleri
- `useAdminSessions`, `useAdminIpBlocks` hook ekle
- IP block dialog aktif et
- Session terminate fonksiyonlarını aktif et

---

## 4. Aktivite Logları (Logs)

### Mevcut Durum
- Frontend: [`apps/web/src/app/(dashboard)/admin/logs/page.tsx`](apps/web/src/app/(dashboard)/admin/logs/page.tsx) - oluşturuldu ama veri yok
- Backend: `audit_logs` tablosu var, API yok

### Gerekenler

#### 4.1 Mevcut Yapı
- `audit_logs` tablosu zaten mevcut
- `/admin/dashboard` endpoint'i son 10 logu döndürüyor

#### 4.2 Backend API
```
API Endpoints:
- GET /api/admin/logs - Filtreli log listesini getir
  Query params: search, level, action, page, limit, date_from, date_to
```

**Dosya:** `apps/api/src/app/api/admin/logs/route.ts`

#### 4.3 Frontend Güncellemeleri
- `useAdminLogs` hook'unu güncelle (`/api/admin/logs` kullanacak şekilde)
- Log tablosunu gerçek verilerle doldur
- Filtreleme fonksiyonlarını aktif et

---

## Uygulama Öncelik Sırası

| Öncelik | Özellik | Karmaşıklık | Tahmini Süre |
|---------|---------|-------------|--------------|
| 1 | Logs API & Frontend | Düşük | 1-2 gün |
| 2 | Cache yönetimi | Orta | 2-3 gün |
| 3 | Security - IP Blocking | Orta | 2-3 gün |
| 4 | Security - Session Terminate | Düşük | 1 gün |
| 5 | Backup sistemi | Yüksek | 3-5 gün |

---

## Teknik Notlar

### Rate Limiting
Tüm admin endpoint'leri için mevcut rate limiting kullanılacak:
```typescript
const rateLimit = await enforceRateLimit(
    ctx.admin,
    rateLimitAuthKey("admin_feature", ctx.tenant.id, ctx.user.id),
    env.dashboardReadRateLimit,
    env.dashboardReadRateWindowSec,
);
```

### Yetkilendirme
Tüm endpoint'ler admin rolü gerektirir:
```typescript
assertAdminRole(ctx.role); // owner, admin, super_admin
```

### Audit Logging
Tüm değişiklik işlemleri (backup oluşturma, IP engelleme, cache temizleme) audit_logs tablosuna kaydedilecek.

---

## Sonraki Adımlar

1. Öncelikle Logs API ve frontend entegrasyonu ile başlanabilir
2. Ardından Cache yönetimi implementasyonu
3. Security özellikleri (IP blocking + session terminate)
4. En son Backup sistemi (en karmaşık)

Hangi özellikle başlamak istersiniz?