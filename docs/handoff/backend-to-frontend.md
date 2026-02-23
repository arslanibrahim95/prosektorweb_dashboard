# Backend to Frontend Handoff (MVP)

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Bu dokuman frontend implementasyonu icin backend varsayimlarini ve kontrat kullanimini netlestirir.

## Kontrat Kaynagi (Tek Kaynak)

- Zod schema'larin tek kaynagi: `/packages/contracts`
- Frontend tarafinda Zod schema kopyalanmaz. Import edilir:
  - `import { publicOfferSubmitSchema, meResponseSchema } from "@prosektor/contracts"`

## Site Resolve (Public Forms)

MVP yontemi: **signed `site_token`**.

- Public formlar payload icinde `site_token` gonderir.
- Server token'i dogrular ve `site_id` cikarir.
- `tenant_id` client tarafindan gonderilmez; server `sites` tablosundan hesaplar.

Gerekli env:

- `SITE_TOKEN_SECRET` (server-only)

Token uretimi (Dashboard / authenticated):

- `GET /api/sites/:id/site-token` endpoint'i `site_token` dondurur.
- Frontend bu token'i public formlara (website tarafina) embed eder.

## Public Submit Endpoint'leri

### Offer

`POST /api/public/offer/submit` (JSON)

Ornek body:

```json
{
  "site_token": "<signed>",
  "full_name": "Ada Yilmaz",
  "email": "ada@example.com",
  "phone": "+905551112233",
  "company_name": "ACME",
  "message": "Teklif rica ederim",
  "kvkk_consent": true,
  "honeypot": ""
}
```

Success:

```json
{ "id": "<uuid>" }
```

### Contact

`POST /api/public/contact/submit` (JSON)

Ornek body:

```json
{
  "site_token": "<signed>",
  "full_name": "Ada Yilmaz",
  "email": "ada@example.com",
  "phone": "+905551112233",
  "subject": "Randevu",
  "message": "Merhaba",
  "kvkk_consent": true,
  "honeypot": ""
}
```

### HR Apply (CV dahil)

`POST /api/public/hr/apply` (`multipart/form-data`)

- fields: `publicJobApplyFieldsSchema`
- file field: `cv_file`

Notlar:

- Server dosyayi dogrular (mime/size) ve Supabase Storage `private-cv` bucket'a yukler.
- Client `cv_path` gondermez.

## Inbox Endpoint'leri (Tenant)

- `GET /api/inbox/offers?site_id=...&page=...&limit=...&search=...`
- `GET /api/inbox/contact?site_id=...&page=...&limit=...&search=...`
- `GET /api/inbox/hr-applications?site_id=...&job_post_id=...&page=...&limit=...&search=...`

Inbox constraints:
- `limit` default `50`, max `100`
- `search` minimum `2` karakter (opsiyonel)
- Auth endpointlerinde rate-limit header'lari donulebilir: `X-RateLimit-*`

Export endpoint'leri:
- `GET /api/inbox/offers/export?site_id=...`
- `GET /api/inbox/contact/export?site_id=...`
- `GET /api/inbox/applications/export?site_id=...`
- `site_id` zorunlu, `limit` default `1000`, max `2000`

Dashboard summary:
- `GET /api/dashboard/summary?site_id=...`
- Home ekrani bu endpoint'i tek cagriyla kullanacak sekilde tasarlanmistir.

Okundu isaretleme:

- `PATCH /api/inbox/hr-applications/:id/read` body: `{ "is_read": true }`

CV indirme:

- `GET /api/job-applications/:id/cv-url` response: `{ url, expires_at }`

## Error Format

Tum hata response'lari:

```json
{ "code": "SOME_CODE", "message": "..." , "details": {} }
```

Onerilen kodlar:

- `VALIDATION_ERROR`
- `FORBIDDEN`
- `NOT_FOUND`
- `RATE_LIMITED`
- `SPAM_DETECTED`
