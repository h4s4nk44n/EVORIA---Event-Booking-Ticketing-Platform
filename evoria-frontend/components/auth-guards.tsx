'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../state/auth';
import type { Role } from '../types';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { auth, hasHydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  useEffect(() => {
    // Wait until the AuthProvider has loaded persisted state, otherwise we
    // race the localStorage hydration and bounce logged-in users to /login.
    if (!hasHydrated) return;
    if (!auth) {
      const target = `/login?from=${encodeURIComponent(pathname)}`;
      router.replace(target);
    }
  }, [auth, hasHydrated, pathname, router]);

  if (!hasHydrated || !auth) return null;
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { auth, hasHydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (!hasHydrated) return;
    if (!auth) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    } else if (!roles.includes(auth.role)) {
      router.replace('/');
    }
  }, [auth, hasHydrated, roles, pathname, router]);

  if (!hasHydrated) return null;
  if (!auth || !roles.includes(auth.role)) return null;
  return <>{children}</>;
}
