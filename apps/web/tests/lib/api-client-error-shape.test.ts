import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError } from '@prosektorweb/shared';

describe('ApiClient error-shape compatibility', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses root-level API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: { ids: ['Invalid id'] },
          }),
          {
            status: 400,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ) as unknown as typeof fetch,
    );

    const client = new ApiClient('/api');

    await expect(client.get('/inbox/offers')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      status: 400,
      details: { ids: ['Invalid id'] },
    } satisfies Partial<ApiError>);
  });

  it('parses nested error envelope for backward compatibility', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            version: '1.0',
            error: {
              code: 'FORBIDDEN',
              message: 'Forbidden',
            },
          }),
          {
            status: 403,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ) as unknown as typeof fetch,
    );

    const client = new ApiClient('/api');

    await expect(client.get('/publish')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Forbidden',
      status: 403,
    } satisfies Partial<ApiError>);
  });
});
