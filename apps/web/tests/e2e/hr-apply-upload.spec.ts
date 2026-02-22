import { test, expect, request } from '@playwright/test';

const BASE_URL = process.env.HR_BASE_URL ?? 'http://localhost:3000';
const SITE_TOKEN = process.env.HR_SITE_TOKEN;
const JOB_POST_ID = process.env.HR_JOB_POST_ID;

// These tests exercise the public HR apply API with a blank/unknown MIME type to
// guard against Safari/Android uploads being rejected prematurely. They run
// only when required env vars are provided.

test.describe('HR Apply upload with blank mime', () => {
  test.skip(!SITE_TOKEN || !JOB_POST_ID, 'HR env vars missing');
  test('accepts CV when browser provides blank mime type', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });

    const payload = {
      site_token: SITE_TOKEN!,
      job_post_id: JOB_POST_ID!,
      full_name: 'Playwright Blank MIME',
      email: 'blank-mime@example.com',
      phone: '5555555555',
      message: 'Automated test',
      kvkk_consent: 'true',
      honeypot: '',
    } satisfies Record<string, string>;

    const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF', 'utf8');

    const res = await api.post('/api/public/hr/apply', {
      multipart: {
        ...payload,
        cv_file: {
          name: 'resume.pdf',
          mimeType: '', // simulate Safari/Android sending empty content-type
          buffer: pdfBytes,
        },
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
  });

  test('rejects clearly invalid mime types', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });

    const res = await api.post('/api/public/hr/apply', {
      multipart: {
        site_token: SITE_TOKEN!,
        job_post_id: JOB_POST_ID!,
        full_name: 'Playwright Invalid MIME',
        email: 'invalid-mime@example.com',
        phone: '5555555555',
        kvkk_consent: 'true',
        honeypot: '',
        cv_file: {
          name: 'malicious.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('MZ'),
        },
      },
    });

    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
