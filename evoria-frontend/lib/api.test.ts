import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDelete, apiGet, apiPost, apiPut, toFailure } from './api';

/**
 * Builds a Response-like object accepted by our typed `fetch` mock.
 * Using a real `Response` keeps the .json() / headers semantics intact.
 */
function mockResponse(body: unknown, init: ResponseInit & { contentType?: string | null } = {}) {
  const headers = new Headers();
  if (init.contentType !== null) {
    headers.set('content-type', init.contentType ?? 'application/json');
  }
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

describe('lib/api', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET → returns parsed data on 200', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ hello: 'world' }));
    const result = await apiGet<{ hello: string }>('/api/test');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ hello: 'world' });
      expect(result.status).toBe(200);
    }
  });

  it('POST → forwards body as JSON', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ id: 'abc' }, { status: 201 }));

    await apiPost('/api/events', { title: 'Solstice' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ title: 'Solstice' }));
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('attaches the stored Bearer token to every request', async () => {
    window.localStorage.setItem('token', 'eyJ.test.jwt');
    fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));

    await apiGet('/api/me');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer eyJ.test.jwt');
  });

  it('400 → returns a validation result with normalised fields', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ errors: { email: 'taken' }, message: 'Validation failed' }, { status: 400 }),
    );

    const result = await apiPost('/auth/register', { email: 'a@b' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = toFailure(result);
      if (failure.type !== 'validation') throw new Error('expected a validation failure');
      expect(failure.errors.fields).toEqual({ email: 'taken' });
      expect(failure.errors.message).toBe('Validation failed');
      expect(failure.status).toBe(400);
    } else {
      throw new Error('expected a validation failure');
    }
  });

  it('401 → returns unauthorized and clears the stored token', async () => {
    window.localStorage.setItem('token', 'stale');
    // jsdom doesn't allow assigning window.location.href to a relative URL
    // → stub it so the redirect side-effect can be exercised safely.
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new Proxy(window.location, {
        set(_t, prop, value) {
          if (prop === 'href') {
            hrefSetter(value);
            return true;
          }
          return Reflect.set(_t, prop, value);
        },
      }),
    });
    fetchMock.mockResolvedValueOnce(mockResponse(null, { status: 401, contentType: null }));

    const result = await apiGet('/api/me');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = toFailure(result);
      expect(failure.type).toBe('unauthorized');
      expect(failure.status).toBe(401);
    }
    expect(window.localStorage.getItem('token')).toBeNull();
    expect(hrefSetter).toHaveBeenCalledWith('/login');
  });

  it('5xx → returns server_error with the message body', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ message: 'database down' }, { status: 503 }),
    );

    const result = await apiPut('/api/events/1', { title: 'x' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = toFailure(result);
      if (failure.type !== 'server_error') throw new Error('expected a server_error');
      expect(failure.message).toBe('database down');
      expect(failure.status).toBe(503);
    } else {
      throw new Error('expected a server_error');
    }
  });

  it('network failure → returns network_error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await apiDelete('/api/events/1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = toFailure(result);
      if (failure.type !== 'network_error') throw new Error('expected a network_error');
      expect(failure.message).toContain('Failed to fetch');
      expect(failure.status).toBeNull();
    } else {
      throw new Error('expected a network_error');
    }
  });

  it('204 No Content → returns ok with undefined data', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(undefined, { status: 204, contentType: null }));
    const result = await apiDelete<void>('/api/events/1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBeUndefined();
      expect(result.status).toBe(204);
    }
  });
});
