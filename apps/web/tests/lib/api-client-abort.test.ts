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

    await expect(promise).rejects.toThrow(/Abort/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBe(controller.signal);
  });
});
