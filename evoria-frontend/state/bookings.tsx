'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Booking } from '../types';
import { BOOKINGS_SEED } from '../data/events';

type BookingsContextValue = {
  bookings: Booking[];
  addBooking: (b: Booking) => void;
};

const BookingsContext = createContext<BookingsContextValue | null>(null);

const STORAGE_KEY = 'evoria.bookings';

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS_SEED);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setBookings(JSON.parse(raw) as Booking[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => [b, ...prev]);
  }, []);

  const value = useMemo(() => ({ bookings, addBooking }), [bookings, addBooking]);

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider');
  return ctx;
}
