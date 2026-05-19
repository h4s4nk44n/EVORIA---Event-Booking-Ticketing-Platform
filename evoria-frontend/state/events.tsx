'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CategoryId, Event } from '../types';
import { EVENTS } from '../data/events';
import {
  MY_EVENTS,
  VENUES,
  type OrganizerEvent,
  type OrganizerEventStatus,
} from '../data/organizer';
import { ADMIN_EVENTS_LIST, type AdminEvent } from '../data/admin';
import { ARCHETYPES, type ArchetypeKey } from '../data/archetypes';
import type { TierKey } from '../types';

/**
 * `state/events` keeps the list of events the organizer has spun up inside the
 * app session.  The seed datasets (`EVENTS`, `MY_EVENTS`) are static, so we
 * layer "created" events on top in localStorage.  Both surfaces — the public
 * `/` listing and the organizer `/dashboard` — read through this hook so a
 * brand-new event shows up immediately in both places.
 */

export type CreatedEventInput = {
  title: string;
  description: string;
  category: Exclude<CategoryId, 'all'>;
  /** ISO datetime, e.g. "2026-07-18T20:30:00" */
  date: string;
  imageUrl?: string;
  venueId: string;
  status: OrganizerEventStatus;
  sections: { id: string; name: string; tier: TierKey; price: number; capacity: number }[];
};

type StoredEvent = {
  publicEvent: Event;
  organizerEvent: OrganizerEvent;
};

type EventsContextValue = {
  publicEvents: Event[];
  /** Deterministic seat-map archetype for an event (venue first, category fallback). */
  eventArchetype: (event: Event | { id: string; category?: string; venue?: string }) => ArchetypeKey;
  organizerEvents: OrganizerEvent[];
  adminEvents: AdminEvent[];
  addEvent: (input: CreatedEventInput) => StoredEvent;
  recordBooking: (eventId: string, quantity: number, sectionId?: string) => void;
  releaseBookingSeats: (eventId: string, quantity: number, sectionId?: string) => void;
  /** Extra seats booked in this section since the seed snapshot. */
  sectionSoldDelta: (eventId: string, sectionId: string) => number;
};

const EventsContext = createContext<EventsContextValue | null>(null);
const STORAGE_KEY = 'evoria.created-events';
const DELTAS_KEY = 'evoria.sold-deltas';
const SECTION_DELTAS_KEY = 'evoria.section-sold-deltas';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'untitled';
}

function inferHeat(sold: number, capacity: number): Event['heat'] {
  if (!capacity) return 'Available';
  const pct = sold / capacity;
  if (pct >= 0.95) return 'Almost Sold Out';
  if (pct >= 0.7) return 'Selling Fast';
  return 'Available';
}

function toStoredEvent(input: CreatedEventInput): StoredEvent {
  const venue = VENUES.find((v) => v.id === input.venueId) || VENUES[0];
  const id = `${slugify(input.title)}-${Date.now().toString(36)}`;
  const prices = input.sections.map((s) => s.price);
  const priceFrom = prices.length ? Math.min(...prices) : 0;
  const priceTo = prices.length ? Math.max(...prices) : 0;
  const capacity = input.sections.reduce((a, s) => a + s.capacity, 0);
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  const dateIso = input.date.length > 10 ? input.date : `${input.date}T20:00:00`;
  const doorsOpen = new Date(new Date(dateIso).getTime() - 60 * 60 * 1000)
    .toISOString()
    .slice(11, 16);

  const publicEvent: Event = {
    id,
    category: input.category,
    title: input.title,
    tagline: input.description.slice(0, 80) || 'A brand-new Evoria event.',
    artist: '—',
    date: dateIso,
    doorsOpen,
    duration: '2h',
    venue: venue.name,
    city: venue.city,
    organizer: 'You',
    rating: 0,
    popularity: 0,
    priceFrom,
    priceTo,
    capacity,
    sold: 0,
    heat: inferHeat(0, capacity),
    description: input.description || 'No description yet.',
    highlights: [],
  };

  const organizerEvent: OrganizerEvent = {
    id,
    title: input.title,
    venue: venue.name,
    city: venue.city,
    date: dateIso,
    category: input.category,
    status: input.status,
    capacity,
    sold: 0,
    revenue: 0,
    avgPrice,
  };

  return { publicEvent, organizerEvent };
}


/**
 * Each event needs ONE seat-map archetype. The current data model doesn't
 * persist this on seed events, so we derive it deterministically from the
 * venue (preferred) or the category (fallback). Created events also pass
 * through here so they don't randomly flip seat maps.
 */
function archetypeForEvent(event: { id: string; category?: string; venue?: string }): ArchetypeKey {
  const venueMatch = VENUES.find((v) => v.name === event.venue);
  if (venueMatch) return venueMatch.archetype;
  switch (event.category) {
    case 'theater':
      return 'theater';
    case 'conferences':
      return 'arena';
    default:
      return 'stadium';
  }
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredEvent[]>([]);
  /**
   * `soldDeltas` is a per-event tally of bookings made during this session.
   * Because the seed datasets (EVENTS / MY_EVENTS / ADMIN_EVENTS_LIST) are
   * static, we layer the deltas on top when deriving the displayed lists.
   * That way the home grid, event page, organizer dashboard and admin panel
   * all see the same up-to-date `sold` count after every booking.
   */
  const [soldDeltas, setSoldDeltas] = useState<Record<string, number>>({});
  /**
   * Per-(event, section) tally so each section's "available" count reflects
   * real bookings instead of the static archetype seed numbers. Keyed as
   * sectionDeltas[eventId][sectionId] = quantity.
   */
  const [sectionDeltas, setSectionDeltas] = useState<Record<string, Record<string, number>>>({});
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setStored(JSON.parse(raw) as StoredEvent[]);
      const rawDeltas = typeof window !== 'undefined' ? localStorage.getItem(DELTAS_KEY) : null;
      if (rawDeltas) setSoldDeltas(JSON.parse(rawDeltas) as Record<string, number>);
      const rawSec = typeof window !== 'undefined' ? localStorage.getItem(SECTION_DELTAS_KEY) : null;
      if (rawSec) setSectionDeltas(JSON.parse(rawSec) as Record<string, Record<string, number>>);
    } catch {
      /* ignore */
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [stored, hasHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated) return;
    localStorage.setItem(DELTAS_KEY, JSON.stringify(soldDeltas));
  }, [soldDeltas, hasHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated) return;
    localStorage.setItem(SECTION_DELTAS_KEY, JSON.stringify(sectionDeltas));
  }, [sectionDeltas, hasHydrated]);

  const addEvent = useCallback((input: CreatedEventInput) => {
    const next = toStoredEvent(input);
    setStored((prev) => [next, ...prev]);
    return next;
  }, []);

  const recordBooking = useCallback(
    (eventId: string, quantity: number, sectionId?: string) => {
      setSoldDeltas((prev) => ({ ...prev, [eventId]: (prev[eventId] ?? 0) + quantity }));
      if (sectionId) {
        setSectionDeltas((prev) => {
          const forEvent = { ...(prev[eventId] ?? {}) };
          forEvent[sectionId] = (forEvent[sectionId] ?? 0) + quantity;
          return { ...prev, [eventId]: forEvent };
        });
      }
    },
    [],
  );

  /** Inverse of `recordBooking`; releases seats back into the pool on cancel. */
  const releaseBookingSeats = useCallback(
    (eventId: string, quantity: number, sectionId?: string) => {
      setSoldDeltas((prev) => {
        const next = (prev[eventId] ?? 0) - quantity;
        return { ...prev, [eventId]: Math.max(0, next) };
      });
      if (sectionId) {
        setSectionDeltas((prev) => {
          const forEvent = { ...(prev[eventId] ?? {}) };
          forEvent[sectionId] = Math.max(0, (forEvent[sectionId] ?? 0) - quantity);
          return { ...prev, [eventId]: forEvent };
        });
      }
    },
    [],
  );

  const sectionSoldDelta = useCallback(
    (eventId: string, sectionId: string) => sectionDeltas[eventId]?.[sectionId] ?? 0,
    [sectionDeltas],
  );

  /** Sums the static seed `sold` and any in-session bookings for an event. */
  const effectiveSold = useCallback(
    (id: string, base: number) => base + (soldDeltas[id] ?? 0),
    [soldDeltas],
  );

  /** Convenience – derives the average ticket price for an organizer event. */
  const applyDeltaToOrganizer = useCallback(
    (e: OrganizerEvent): OrganizerEvent => {
      const sold = Math.min(e.capacity, effectiveSold(e.id, e.sold));
      const revenue = e.avgPrice ? sold * e.avgPrice : e.revenue;
      const status: OrganizerEventStatus = sold >= e.capacity && e.status !== 'draft' ? 'soldout' : e.status;
      return { ...e, sold, revenue, status };
    },
    [effectiveSold],
  );

  const publicEvents = useMemo(() => {
    const merged = [
      ...stored.filter((s) => s.organizerEvent.status !== 'draft').map((s) => s.publicEvent),
      ...EVENTS,
    ];
    return merged.map((e) => {
      // Source-of-truth for "capacity" is the seat map the booking page
      // renders. Summing the archetype's sections (plus any per-section
      // deltas) keeps the home grid in sync with what the user sees when
      // they click into the event. We only fall back to the seed values
      // when the event predates an archetype mapping.
      const arc = ARCHETYPES[archetypeForEvent(e)];
      const sectionDeltaForEvent = sectionDeltas[e.id] ?? {};
      const seatMapCapacity = arc.sections.reduce((a, s) => a + s.capacity, 0);
      const seatMapSeedSold = arc.sections.reduce((a, s) => a + s.sold, 0);
      const seatMapDeltaSold = Object.values(sectionDeltaForEvent).reduce((a, n) => a + n, 0);
      const capacity = seatMapCapacity || e.capacity;
      const baseSold = seatMapCapacity ? seatMapSeedSold : e.sold;
      const sold = Math.min(capacity, baseSold + seatMapDeltaSold);
      return { ...e, capacity, sold, heat: inferHeat(sold, capacity) };
    });
  }, [stored, sectionDeltas]);

  const organizerEvents = useMemo(
    () => [...stored.map((s) => s.organizerEvent), ...MY_EVENTS].map(applyDeltaToOrganizer),
    [stored, applyDeltaToOrganizer],
  );

  const adminEvents = useMemo<AdminEvent[]>(() => {
    // The admin surface uses a different shape – derive it from any created
    // events so they show up alongside the static seed list.
    const fromCreated: AdminEvent[] = stored.map((s) => ({
      id: s.organizerEvent.id,
      title: s.organizerEvent.title,
      organizer: 'You',
      orgEmail: '—',
      date: s.organizerEvent.date,
      venue: s.organizerEvent.venue,
      capacity: s.organizerEvent.capacity,
      sold: effectiveSold(s.organizerEvent.id, s.organizerEvent.sold),
    }));
    const seedWithDeltas = ADMIN_EVENTS_LIST.map((e) => ({
      ...e,
      sold: Math.min(e.capacity, effectiveSold(e.id, e.sold)),
    }));
    return [...fromCreated, ...seedWithDeltas];
  }, [stored, effectiveSold]);

  const eventArchetype = useCallback(
    (event: Event | { id: string; category?: string; venue?: string }) => archetypeForEvent(event),
    [],
  );

  const value = useMemo(
    () => ({
      publicEvents,
      eventArchetype,
      organizerEvents,
      adminEvents,
      addEvent,
      recordBooking,
      releaseBookingSeats,
      sectionSoldDelta,
    }),
    [publicEvents, organizerEvents, adminEvents, addEvent, recordBooking, releaseBookingSeats, sectionSoldDelta, eventArchetype],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEventsStore() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEventsStore must be used within EventsProvider');
  return ctx;
}
