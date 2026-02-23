import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@prosektorweb/shared';

describe('ApiClient abort support', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes AbortSignal to fetch and rejects when aborted', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) {
          reject(new Error('signal missing'));
          return;
        }
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const client = new ApiClient('/api');
    const controller = new AbortController();
    const promise = client.get('/inbox/offers', { site_id: 's1' }, undefined, {
      signal: controller.signal,
    });

    controller.abort();

    // ApiClient wraps abort errors - actual error type depends on environment
    // (DOMException in browser, different in Node.js test environment)
    await expect(promise).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBe(controller.signal);
    expect(init.credentials).toBe('omit');
  });

  it('uses bearer token provider and omits credentials by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const client = new ApiClient('/api');
    client.setAccessTokenProvider(() => 'token-123');

    await client.get('/me');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.credentials).toBe('omit');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-123');
  });
});
