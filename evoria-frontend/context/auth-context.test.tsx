import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

import { AuthProvider, useAuth } from './auth-context';

/** Builds a minimal (unsigned) JWT whose payload survives a roundtrip through atob. */
function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    push.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('login() persists the token and decodes the user', async () => {
    const token = makeJwt({ sub: '1', email: 'mira@evoria.live', role: 'organizer', name: 'Mira' });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: Awaited<ReturnType<typeof result.current.login>>;
    await act(async () => {
      outcome = await result.current.login({ email: 'mira@evoria.live', password: 'pw' });
    });

    expect(outcome!).toEqual({ ok: true });
    expect(result.current.user?.role).toBe('organizer');
    expect(window.localStorage.getItem('token')).toBe(token);
    expect(push).toHaveBeenCalledWith('/');
  });

  it('register() reports validation errors', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ errors: { email: 'taken' }, message: 'Validation failed' }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: Awaited<ReturnType<typeof result.current.register>>;
    await act(async () => {
      outcome = await result.current.register({
        name: 'Test',
        email: 'a@b.co',
        password: 'longenough-pw',
        role: 'attendee',
      });
    });

    expect(outcome!.ok).toBe(false);
    // Narrow via a runtime cast – the project has strictNullChecks disabled,
    // which trips up TS's discriminated-union narrowing.
    const fail = outcome! as Extract<typeof outcome, { ok: false }>;
    if (fail.type === 'validation') {
      expect(fail.fields).toEqual({ email: 'taken' });
    } else {
      throw new Error('expected a validation failure');
    }
    expect(result.current.user).toBeNull();
  });

  it('register() stores the token returned from the server', async () => {
    const token = makeJwt({ sub: '7', email: 'new@user.co', role: 'attendee' });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ token }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.register({
        name: 'New',
        email: 'new@user.co',
        password: 'longenough-pw',
        role: 'attendee',
      });
    });

    expect(window.localStorage.getItem('token')).toBe(token);
    expect(result.current.user?.email).toBe('new@user.co');
  });

  it('logout() clears state and token', async () => {
    const token = makeJwt({ sub: '1', email: 'a@b.co', role: 'attendee' });
    window.localStorage.setItem('token', token);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.email).toBe('a@b.co'));

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(window.localStorage.getItem('token')).toBeNull();
  });
});
