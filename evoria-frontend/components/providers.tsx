'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../state/auth';
import { BookingsProvider } from '../state/bookings';
import { EventsProvider } from '../state/events';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <EventsProvider>
        <BookingsProvider>{children}</BookingsProvider>
      </EventsProvider>
    </AuthProvider>
  );
}
