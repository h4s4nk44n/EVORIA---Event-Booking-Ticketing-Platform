export type AdminActivityKind = 'event' | 'booking' | 'category' | 'user' | 'alert' | 'delete';
export type AdminRole = 'Attendee' | 'Organizer' | 'Admin';
export type AdminVenueLayout = 'Stadium' | 'Theater' | 'Conference' | 'Open-Air';

export interface AdminActivity {
  id: string;
  kind: AdminActivityKind;
  who: string;
  action: string;
  target: string;
  when: string;
}

export interface AdminEvent {
  id: string;
  title: string;
  venue: string;
  date: string;
  sold: number;
  capacity: number;
  organizer: string;
  orgEmail: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  joined: string;
  events: number;
  bookings: number;
}

export interface AdminVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  capacity: number;
  layout: AdminVenueLayout;
  events: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  events: number;
  color: string;
}

export const ADMIN_ACTIVITY: AdminActivity[] = [
  { id: '1', kind: 'event', who: 'Mert Demir', action: 'created event', target: 'Summer Solstice Festival', when: '2 mins ago' },
  { id: '2', kind: 'booking', who: 'Ayşe Yılmaz', action: 'purchased 2 tickets for', target: 'Borusan Philharmony', when: '14 mins ago' },
  { id: '3', kind: 'user', who: 'Selin Kaya', action: 'registered as', target: 'Organizer', when: '45 mins ago' },
  { id: '4', kind: 'alert', who: 'System', action: 'detected high load on', target: 'API Gateway', when: '1 hour ago' },
  { id: '5', kind: 'category', who: 'Admin', action: 'updated category', target: 'Electronic Music', when: '3 hours ago' },
  { id: '6', kind: 'delete', who: 'Admin', action: 'removed user', target: 'spammer_99', when: '5 hours ago' },
  { id: '7', kind: 'booking', who: 'Caner Öz', action: 'canceled booking for', target: 'TechConf 2024', when: '6 hours ago' },
];

export const ADMIN_EVENTS_LIST: AdminEvent[] = [
  { id: 'EV-8291', title: 'Summer Solstice Festival', venue: 'Volkswagen Arena', date: '24 Jun, 2024', sold: 4200, capacity: 5000, organizer: 'Eventify Pro', orgEmail: 'pro@eventify.com' },
  { id: 'EV-3122', title: 'Borusan Philharmony: Mahler 5', venue: 'Lütfi Kırdar', date: '12 Jul, 2024', sold: 1800, capacity: 2000, organizer: 'Borusan Sanat', orgEmail: 'iletisim@borusan.com' },
  { id: 'EV-9901', title: 'TechConf 2024 Istanbul', venue: 'ICC Istanbul', date: '05 Sep, 2024', sold: 850, capacity: 1200, organizer: 'DevCommunities', orgEmail: 'hello@dev.org' },
  { id: 'EV-1120', title: 'Derby: GS vs FB', venue: 'RAMS Park', date: '19 May, 2024', sold: 52000, capacity: 52500, organizer: 'TFF', orgEmail: 'info@tff.org' },
  { id: 'EV-4432', title: 'The Weeknd World Tour', venue: 'Atatürk Olympic Stadium', date: '30 Aug, 2024', sold: 68000, capacity: 75000, organizer: 'LiveNation TR', orgEmail: 'tr@livenation.com' },
];

export const ADMIN_USERS: AdminUser[] = [
  { id: 'USR-001', name: 'Hakan Kaan', email: 'hakan@evoria.com', role: 'Admin', joined: '12 Jan, 2024', events: 0, bookings: 12 },
  { id: 'USR-042', name: 'Mert Demir', email: 'mert@eventify.com', role: 'Organizer', joined: '15 Feb, 2024', events: 8, bookings: 0 },
  { id: 'USR-112', name: 'Ayşe Yılmaz', email: 'ayse@gmail.com', role: 'Attendee', joined: '20 Mar, 2024', events: 0, bookings: 4 },
  { id: 'USR-551', name: 'Selin Kaya', email: 'selin@borusan.com', role: 'Organizer', joined: '01 Apr, 2024', events: 24, bookings: 1 },
];

export const ADMIN_VENUES: AdminVenue[] = [
  { id: 'VN-001', name: 'Volkswagen Arena', address: 'Maslak, Ayazağa Cd. No:4', city: 'Istanbul', capacity: 5800, layout: 'Theater', events: 12 },
  { id: 'VN-002', name: 'Atatürk Olympic Stadium', address: 'Ziya Gökalp, Olimpiyat Stadı Yolu', city: 'Istanbul', capacity: 75000, layout: 'Stadium', events: 3 },
  { id: 'VN-003', name: 'ICC Istanbul', address: 'Harbiye, Darülbedayi Cd. No:3', city: 'Istanbul', capacity: 3500, layout: 'Conference', events: 21 },
  { id: 'VN-004', name: 'KüçükÇiftlik Park', address: 'Harbiye, Kadırgalar Cd. No:4', city: 'Istanbul', capacity: 17000, layout: 'Open-Air', events: 15 },
];

export const ADMIN_CATEGORIES: AdminCategory[] = [
  { id: 'CAT-01', name: 'Concerts', slug: 'concerts', description: 'Live musical performances across all genres.', events: 42, color: '#6366F1' },
  { id: 'CAT-02', name: 'Sports', slug: 'sports', description: 'Football matches, basketball games, and more.', events: 28, color: '#10B981' },
  { id: 'CAT-03', name: 'Festivals', slug: 'festivals', description: 'Multi-day outdoor events and celebrations.', events: 16, color: '#F59E0B' },
  { id: 'CAT-04', name: 'Conferences', slug: 'conferences', description: 'Professional networking and learning events.', events: 9, color: '#0EA5E9' },
  { id: 'CAT-05', name: 'Theater', slug: 'theater', description: 'Plays, musicals, and performing arts.', events: 5, color: '#8B5CF6' },
];

export const SPARK = {
  users: [120, 150, 180, 160, 210, 240, 280, 310, 290, 340, 380, 420],
  events: [10, 12, 11, 15, 14, 18, 22, 20, 24, 28, 26, 30],
  bookings: [450, 520, 480, 600, 580, 720, 850, 820, 940, 1100, 1050, 1200],
  organizers: [2, 3, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9],
};
