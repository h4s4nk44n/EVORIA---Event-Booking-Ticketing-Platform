'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../state/auth';
import { BookingsProvider } from '../state/bookings';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BookingsProvider>{children}</BookingsProvider>
    </AuthProvider>
  );
}
