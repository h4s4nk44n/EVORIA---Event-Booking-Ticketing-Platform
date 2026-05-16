'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../state/auth';
import type { Role } from '../types';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (!auth) {
      const target = `/login?from=${encodeURIComponent(pathname)}`;
      router.replace(target);
    }
  }, [auth, pathname, router]);

  if (!auth) return null;
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { auth } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (!auth) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    } else if (!roles.includes(auth.role)) {
      router.replace('/');
    }
  }, [auth, roles, pathname, router]);

  if (!auth || !roles.includes(auth.role)) return null;
  return <>{children}</>;
}
