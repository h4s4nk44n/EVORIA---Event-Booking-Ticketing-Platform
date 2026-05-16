import type { CategoryId } from '../types';
import { ARCHETYPES, type ArchetypeKey } from './archetypes';

export type Venue = {
  id: string;
  name: string;
  city: string;
  archetype: ArchetypeKey;
  capacity: number;
  rows: string;
};

export type OrganizerEventStatus = 'published' | 'draft' | 'soldout';

export type OrganizerEvent = {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  category: Exclude<CategoryId, 'all'>;
  status: OrganizerEventStatus;
  capacity: number;
  sold: number;
  revenue: number;
  avgPrice: number;
};

export const VENUES: Venue[] = [
  { id: 'volkan-arena',   name: 'Volkan Arena',          city: 'Istanbul', archetype: 'stadium', capacity: 12400, rows: '3 bowls · 12 sections' },
  { id: 'halic-congress', name: 'Haliç Congress Centre', city: 'Istanbul', archetype: 'arena',   capacity: 3200,  rows: '12 wedges · 1 pitch' },
  { id: 'salon-beyaz',    name: 'Salon Beyaz',           city: 'Ankara',   archetype: 'theater', capacity: 1100,  rows: '4 tiers · 11 sections' },
  { id: 'tepe-hall',      name: 'Tepe Hall',             city: 'Izmir',    archetype: 'theater', capacity: 2200,  rows: '4 tiers · 11 sections' },
];

export const MY_EVENTS: OrganizerEvent[] = [
  {
    id: 'solstice-live',
    title: 'Solstice — Live at Volkan Arena',
    venue: 'Volkan Arena', city: 'Istanbul',
    date: '2026-05-18T20:30:00', category: 'concerts',
    status: 'published', capacity: 12400, sold: 11520, revenue: 1_384_200, avgPrice: 120,
  },
  {
    id: 'aurora-symph',
    title: 'Aurora Symphonic — Film Scores Live',
    venue: 'Tepe Hall', city: 'Izmir',
    date: '2026-05-30T19:00:00', category: 'concerts',
    status: 'published', capacity: 2200, sold: 1560, revenue: 168_480, avgPrice: 108,
  },
  {
    id: 'the-quiet-room',
    title: 'The Quiet Room',
    venue: 'Salon Beyaz', city: 'Ankara',
    date: '2026-04-28T20:00:00', category: 'theater',
    status: 'published', capacity: 420, sold: 168, revenue: 9_072, avgPrice: 54,
  },
  {
    id: 'derby-80',
    title: 'Derby 80 — Regional Final',
    venue: 'Stadı 34', city: 'Istanbul',
    date: '2026-05-02T19:45:00', category: 'sports',
    status: 'soldout', capacity: 42000, sold: 42000, revenue: 3_990_000, avgPrice: 95,
  },
  {
    id: 'lumen-26-autumn',
    title: 'Lumen Festival · Autumn Edition',
    venue: 'Kıyı Fields', city: 'Çeşme',
    date: '2026-10-02T14:00:00', category: 'festivals',
    status: 'draft', capacity: 18000, sold: 0, revenue: 0, avgPrice: 0,
  },
  {
    id: 'futurestack-27-teaser',
    title: 'Futurestack / 27 — Early Bird',
    venue: 'Haliç Congress Centre', city: 'Istanbul',
    date: '2027-03-12T09:00:00', category: 'conferences',
    status: 'draft', capacity: 1800, sold: 0, revenue: 0, avgPrice: 0,
  },
];

const ATTENDEE_FIRST = ['Mira','Emre','Selin','Kaan','Deniz','Zeynep','Arda','Elif','Baran','Naz','Can','Lara','Tuna','Irem','Ozan','Asli','Mert','Sena','Berk','Yasemin','Cem','Defne','Onur','Pelin','Eren','Gizem','Umut','Bade','Tarik','Nehir'];
const ATTENDEE_LAST  = ['Kaan','Yilmaz','Demir','Celik','Sahin','Kaya','Ozturk','Arslan','Dogan','Koc','Polat','Aydin','Erdem','Tekin','Gunes','Aksoy','Balcı','Yildiz','Turan','Orhan'];

export function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Attendee = {
  id: string;
  name: string;
  email: string;
  section: string;
  booked: string;
};

export function makeAttendees(eventId: string, count: number, sections: string[]): Attendee[] {
  const rng = mulberry32(hashStr(eventId));
  const out: Attendee[] = [];
  const start = new Date('2026-02-01').getTime();
  const end = new Date('2026-04-20').getTime();
  const domains = ['gmail.com', 'proton.me', 'evoria.mail', 'outlook.com'];
  for (let i = 0; i < count; i++) {
    const first = ATTENDEE_FIRST[Math.floor(rng() * ATTENDEE_FIRST.length)];
    const last = ATTENDEE_LAST[Math.floor(rng() * ATTENDEE_LAST.length)];
    const name = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@${domains[Math.floor(rng() * domains.length)]}`;
    const section = sections[Math.floor(rng() * sections.length)];
    const booked = new Date(start + rng() * (end - start)).toISOString().slice(0, 10);
    out.push({ id: `ATT-${eventId}-${i + 1}`, name, email, section, booked });
  }
  return out;
}

export type OrganizerSectionBreakdown = {
  id: string;
  name: string;
  tier: string;
  price: number;
  capacity: number;
  sold: number;
  revenue: number;
};

export function sectionsForEvent(ev: OrganizerEvent): OrganizerSectionBreakdown[] {
  const venue = VENUES.find((v) => v.name === ev.venue);
  const archetypeKey: ArchetypeKey = venue ? venue.archetype : 'stadium';
  const arc = ARCHETYPES[archetypeKey];
  const globalRatio = ev.capacity ? ev.sold / ev.capacity : 0;
  return arc.sections.map((s) => {
    const sold = Math.min(
      s.capacity,
      Math.round(s.capacity * globalRatio * (0.7 + ((s.price % 7) / 10)))
    );
    return {
      id: s.id,
      name: s.name,
      tier: s.tier,
      price: s.price,
      capacity: s.capacity,
      sold,
      revenue: sold * s.price,
    };
  });
}
