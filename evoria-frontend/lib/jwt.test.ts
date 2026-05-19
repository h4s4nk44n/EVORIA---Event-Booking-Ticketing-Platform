import { describe, expect, it } from 'vitest';
import {
  decodeJwtPayload,
  extractUser,
  isTokenExpired,
  removeToken,
  retrieveToken,
  storeToken,
} from './jwt';

/** Builds a fake (unsigned) JWT with a base64url-encoded payload. */
function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.signature`;
}

describe('lib/jwt – decode helpers', () => {
  it('decodes a well-formed payload', () => {
    const token = makeJwt({ sub: '42', email: 'a@b.com', role: 'attendee' });
    expect(decodeJwtPayload(token)).toEqual(
      expect.objectContaining({ sub: '42', email: 'a@b.com', role: 'attendee' }),
    );
  });

  it('returns null for a malformed token', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
    expect(decodeJwtPayload('a.b')).toBeNull();
    expect(decodeJwtPayload('a.@@@.c')).toBeNull();
  });

  it('extractUser fills missing name from email', () => {
    const token = makeJwt({ sub: '7', email: 'mira@evoria.live', role: 'organizer' });
    expect(extractUser(token)).toEqual({
      id: '7',
      email: 'mira@evoria.live',
      name: 'mira@evoria.live',
      role: 'organizer',
    });
  });

  it('extractUser prefers explicit name and id', () => {
    const token = makeJwt({ id: '99', name: 'Deniz', email: 'd@d.co', role: 'attendee' });
    expect(extractUser(token)).toEqual({
      id: '99',
      name: 'Deniz',
      email: 'd@d.co',
      role: 'attendee',
    });
  });

  it('extractUser returns null when mandatory fields are missing', () => {
    expect(extractUser(makeJwt({ name: 'lonely' }))).toBeNull();
  });

  it('isTokenExpired – future exp returns false', () => {
    const future = Math.floor(Date.now() / 1000) + 60 * 60;
    expect(isTokenExpired(makeJwt({ exp: future }))).toBe(false);
  });

  it('isTokenExpired – past exp returns true', () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    expect(isTokenExpired(makeJwt({ exp: past }))).toBe(true);
  });

  it('isTokenExpired – missing exp is treated as non-expired', () => {
    expect(isTokenExpired(makeJwt({ sub: '1' }))).toBe(false);
  });
});

describe('lib/jwt – storage helpers', () => {
  it('storeToken / retrieveToken roundtrip', () => {
    storeToken('abc.def.ghi');
    expect(retrieveToken()).toBe('abc.def.ghi');
  });

  it('removeToken clears the value', () => {
    storeToken('xyz');
    removeToken();
    expect(retrieveToken()).toBeNull();
  });
});
