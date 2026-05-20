'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthProfile, Role } from '../types';
import { decodeJwtPayload, makeDemoJwt, removeToken, retrieveToken, storeToken } from '../lib/jwt';

export const ROLE_PROFILES: Record<Role, AuthProfile> = {
  attendee:  { role: 'attendee',  name: 'Carol Attendee',  email: 'carol@evoria.com' },
  organizer: { role: 'organizer', name: 'Alice Organizer', email: 'alice@evoria.com' },
  admin:     { role: 'admin',     name: 'Admin User',      email: 'admin@evoria.com' },
};

const ROLE_BY_EMAIL: Record<string, Role> = {
  'carol@evoria.com': 'attendee',
  'alice@evoria.com': 'organizer',
  'admin@evoria.com': 'admin',
};

type AuthContextValue = {
  auth: AuthProfile | null;
  /**
   * `false` until the provider has read its persisted state from localStorage.
   * Route guards must wait for this flag before redirecting unauthenticated
   * users, otherwise they will fire on the first render — before hydration —
   * and bounce a logged-in user to /login.
   */
  hasHydrated: boolean;
  login: (email: string) => void;
  register: (info: { role: Role; name: string; email: string }) => void;
  logout: () => void;
  setRole: (role: Role) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'evoria.auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthProfile | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Hydrate from localStorage on mount (client-only to avoid SSR mismatch).
  // We flip `hasHydrated` in the same effect so guards know when it's safe
  // to act on the resulting `auth` value.
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setAuth(JSON.parse(raw) as AuthProfile);
    } catch {
      /* ignore */
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Don't overwrite localStorage with the initial `null` before hydration
    // has finished – that would wipe a perfectly good persisted session.
    if (!hasHydrated) return;
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    else localStorage.removeItem(STORAGE_KEY);
  }, [auth, hasHydrated]);

  // Keep the middleware-visible JWT cookie aligned with `auth.role`. The Edge
  // guard reads the cookie's `role` claim, so if `setRole` or a fresh demo
  // login leaves a stale cookie behind, the user gets "Access Denied" even
  // though the UI thinks they're authorised. We only rewrite the cookie when
  // its role actually disagrees, so a real backend token survives untouched.
  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated) return;
    if (!auth) return;
    const existing = retrieveToken();
    const claimRole = existing ? (decodeJwtPayload(existing)?.role ?? '') : '';
    if (claimRole.toUpperCase() === auth.role.toUpperCase()) return;
    storeToken(makeDemoJwt(auth.email, auth.role));
  }, [auth, hasHydrated]);

  const login = useCallback((email: string) => {
    const role: Role = ROLE_BY_EMAIL[email] || 'attendee';
    setAuth({ ...ROLE_PROFILES[role], email });
  }, []);

  const register = useCallback((info: { role: Role; name: string; email: string }) => {
    setAuth({ role: info.role, name: info.name, email: info.email });
  }, []);

  const logout = useCallback(() => {
    // Clear the JWT cookie + localStorage entry the middleware uses, otherwise
    // a logged-out user can still pass through the Edge route guard.
    removeToken();
    setAuth(null);
  }, []);
  const setRole = useCallback((role: Role) => setAuth(ROLE_PROFILES[role]), []);

  const value = useMemo(
    () => ({ auth, hasHydrated, login, register, logout, setRole }),
    [auth, hasHydrated, login, register, logout, setRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
