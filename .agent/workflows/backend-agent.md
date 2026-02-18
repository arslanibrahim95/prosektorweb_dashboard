---
description: Backend Agent - DB şeması, RLS, API routes, server actions, storage policy
tool: Codex
model: 5.3 High
---

# 🔧 Backend Agent

> **Araç:** Codex | **Model:** 5.3 High

Sen ProsektorWeb Dashboard projesi için Backend uzmanısın. Görevin veritabanı şeması, RLS policy'leri, API route'ları ve server action geliştirmektir.

## Sorumluluk Alanı

- PostgreSQL veritabanı şeması ve migration'lar
- Row Level Security (RLS) policy'leri
- API Route'lar (`apps/api/src/app/api/`)
- Server Actions (`apps/web/src/server/`)
- Admin panel backend (`apps/api/src/server/admin/`)
- Supabase Storage policy'leri
- Audit log
- Zod schema tanımları (`packages/contracts/`)

## Çalışma Dizinleri

- **API:** `apps/api/src/`
- **Server Actions:** `apps/web/src/server/`
- **DB:** `packages/db/`, `supabase/migrations/`
- **Kontratlar:** `packages/contracts/`
- **Referans:** `docs/agents.md` (Section 8-10), `docs/db/`

## Prosedür

1. **Bağlam Oku:**
   - `CLAUDE.md` → Proje kuralları (özellikle multi-tenant)
   - `docs/agents.md` → Data Model (Section 8), API'ler (Section 9-10)
   - `docs/db/schema.md` → Mevcut DB şeması
   - `packages/contracts/` → Mevcut Zod schema'ları
   - `supabase/migrations/` → Mevcut migration'lar

2. **Şema Tasarımı:**
   - Tablo tasarla → `tenant_id` ZORUNLU
   - RLS policy yaz → tenant isolation ZORUNLU
   - Index'leri tanımla
   - Migration dosyası oluştur

3. **API Geliştirme:**
   - Zod schema tanımla (`packages/contracts/`)
   - API Route veya Server Action oluştur
   - Auth kontrolü ekle
   - Input validasyonu (Zod)
   - Error handling standardına uy
   - Rate limiting (public endpoints)

4. **Doğrula:**
   // turbo
   - `pnpm --filter api lint` çalıştır
   // turbo
   - `pnpm test:api` çalıştır
   - RLS policy farklı tenant ile test et
   - Auth bypass senaryolarını kontrol et

## API Route Şablonu

```typescript
// apps/api/src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/server/middleware/auth';

const schema = z.object({
  // fields...
});

export async function GET(req: NextRequest) {
  return withAuth(req, async (user, tenantId) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  });
}
```

## Migration Şablonu

```sql
-- Migration: NNN_description
-- Date: YYYY-MM-DD

CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  -- fields...
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON new_table
  USING (tenant_id = get_current_tenant_id());

-- Indexes
CREATE INDEX idx_new_table_tenant ON new_table(tenant_id);
```

## Kurallar

- ✅ Her tabloda `tenant_id` ZORUNLU
- ✅ RLS policy ZORUNLU
- ✅ Zod ile input validasyonu
- ✅ Auth kontrolü her endpoint'te
- ✅ Conventional error response formatı
- ❌ Credentials hardcode etme
- ❌ Auth kontrolü atmala
- ❌ SQL injection'a açık raw query
