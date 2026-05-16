'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthProfile, Role } from '../types';

export const ROLE_PROFILES: Record<Role, AuthProfile> = {
  attendee:  { role: 'attendee',  name: 'Deniz Aslan',  email: 'deniz.a@gmail.com' },
  organizer: { role: 'organizer', name: 'Mira Kaan',    email: 'mira@evoria.live'  },
  admin:     { role: 'admin',     name: 'Kaan Yılmaz',  email: 'kaan.y@icloud.com' },
};

const ROLE_BY_EMAIL: Record<string, Role> = {
  'deniz.a@gmail.com': 'attendee',
  'mira@evoria.live':  'organizer',
  'kaan.y@icloud.com': 'admin',
};

type AuthContextValue = {
  auth: AuthProfile | null;
  login: (email: string) => void;
  register: (info: { role: Role; name: string; email: string }) => void;
  logout: () => void;
  setRole: (role: Role) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'evoria.auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthProfile | null>(null);

  // Hydrate from localStorage on mount (client-only to avoid SSR mismatch)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setAuth(JSON.parse(raw) as AuthProfile);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    else localStorage.removeItem(STORAGE_KEY);
  }, [auth]);

  const login = useCallback((email: string) => {
    const role: Role = ROLE_BY_EMAIL[email] || 'attendee';
    setAuth({ ...ROLE_PROFILES[role], email });
  }, []);

  const register = useCallback((info: { role: Role; name: string; email: string }) => {
    setAuth({ role: info.role, name: info.name, email: info.email });
  }, []);

  const logout = useCallback(() => setAuth(null), []);
  const setRole = useCallback((role: Role) => setAuth(ROLE_PROFILES[role]), []);

  const value = useMemo(() => ({ auth, login, register, logout, setRole }), [auth, login, register, logout, setRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
