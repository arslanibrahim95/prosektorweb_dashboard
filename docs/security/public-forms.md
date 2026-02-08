# Public Forms Security (MVP)

Bu dokuman, auth olmayan public endpoint'lerin (offer/contact/hr apply) spam'e dayanimi ve tenant izolasyonu icin zorunlu kurallari tanimlar.

## Site Resolve (Secilen Yontem)

MVP icin **B) signed site_token** yontemi kullanilir.

- Client payload icinde `site_token` gonderir.
- Server `SITE_TOKEN_SECRET` ile token'i dogrular ve `site_id` cikarir.
- `tenant_id` **asla** client'tan alinmaz. `site_id -> sites.tenant_id` server tarafinda bulunur.

Token icerigi onerisi:

- `site_id` (uuid)
- `iat` (issued at)
- opsiyonel: `exp` (token rotation icin)

## Zorunlu Kontroller (Tum Public Endpoint'lerde)

- Zod validation: `/packages/contracts/public-submit.ts`
- Honeypot: `honeypot` alani **bos olmak zorunda**.
  - Doluysa: kayit olusturma.
  - Tercih: `204 No Content` (spam botuna sinyal vermemek icin).
- KVKK: `kvkk_consent=true` zorunlu.
  - DB'de `kvkk_accepted_at = now()` yazilir.
- Module enabled: ilgili `module_instances` kaydi `enabled=true` olmali.
  - Degilse: `404` veya `409` tercih edilebilir (MVP icin `404` daha az bilgi sizar).

## Rate Limiting

Anahtar:

- `ip + endpoint + site_id`

Onerilen limit (MVP):

- `5 req / 60 dakika` (endpoint bazinda ayarlanabilir)

Uygulama secenekleri:

1. Redis/Edge (tercih edilen): Upstash Redis.
2. DB tabanli throttle (MVP fallback):
   - request basina bir counter kaydi guncellenir ve window icinde limit kontrol edilir.
   - IP saklama KVKK kapsaminda PII oldugu icin minimum tutulur ve kisa TTL ile temizlenir.

Rate limit asiminda:

- HTTP `429`
- Body: `{ "code": "RATE_LIMITED", "message": "Too many requests" }`

## HR CV Dosyasi (Server-Side Enforce)

CV icin zorunlu server-side kurallar:

- MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Max size: `5MB` (module settings ile artirilabilir ama server yine enforce eder)
- Upload hedefi: Supabase Storage bucket `private-cv`

Object key:

- `tenant_<tenant_id>/cv/<timestamp>_<random>_<original_filename>`

DB yazimi:

- `job_applications.cv_path` server tarafinda uretilen storage key olmalidir.
- Client'tan `cv_path` alinmaz.

## Audit Log / PII

- `audit_logs` icine public form PII (isim, email, telefon, mesaj, ip) yazilmaz.
- Public submit'ler icin audit gerekiyorsa:
  - sadece teknik meta (site_id, module_key, success/fail code) yazilir.
  - PII icin inbox tablolari zaten kaynak.

## Error Standard

Tum endpoint'ler icin standart:

```json
{ "code": "SOME_CODE", "message": "Human readable", "details": {} }
```

Onerilen kodlar:

- `VALIDATION_ERROR`
- `SITE_NOT_FOUND`
- `MODULE_DISABLED`
- `SPAM_DETECTED`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

