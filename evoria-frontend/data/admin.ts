export type AdminRole = 'Organizer' | 'Attendee' | 'Admin';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  joined: string;
  events: number;
  bookings: number;
};

export type AdminEvent = {
  id: string;
  title: string;
  organizer: string;
  orgEmail: string;
  date: string;
  venue: string;
  capacity: number;
  sold: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  description: string;
  events: number;
};

export type AdminVenueLayout = 'Stadium' | 'Open-Air' | 'Conference' | 'Theater';

export type AdminVenue = {
  id: string;
  name: string;
  address: string;
  city: string;
  capacity: number;
  layout: AdminVenueLayout;
  events: number;
};

export type AdminActivityKind = 'event' | 'booking' | 'category' | 'alert' | 'user' | 'delete';

export type AdminActivity = {
  id: number;
  who: string;
  action: string;
  target: string;
  kind: AdminActivityKind;
  when: string;
};

export const ADMIN_USERS: AdminUser[] = [
  { id: 'u-001', name: 'Mira Kaan',        email: 'mira@evoria.live',      role: 'Organizer', joined: '2024-11-04', events: 12, bookings: 0 },
  { id: 'u-002', name: 'Deniz Aslan',      email: 'deniz.a@gmail.com',     role: 'Attendee',  joined: '2025-02-18', events: 0,  bookings: 7 },
  { id: 'u-003', name: 'Ece Toprak',       email: 'ece@futurestack.co',    role: 'Organizer', joined: '2024-06-22', events: 4,  bookings: 2 },
  { id: 'u-004', name: 'Kaan Yılmaz',      email: 'kaan.y@icloud.com',     role: 'Admin',     joined: '2023-01-11', events: 0,  bookings: 1 },
  { id: 'u-005', name: 'Selin Demir',      email: 'selin.demir@proton.me', role: 'Attendee',  joined: '2025-08-30', events: 0,  bookings: 3 },
  { id: 'u-006', name: 'Atölye 6',         email: 'office@atolye6.com',    role: 'Organizer', joined: '2024-03-14', events: 9,  bookings: 0 },
  { id: 'u-007', name: 'Leyla Özkan',      email: 'l.ozkan@fastmail.com',  role: 'Attendee',  joined: '2025-11-06', events: 0,  bookings: 12 },
  { id: 'u-008', name: 'Burak Çelik',      email: 'burak@coastal.fed',     role: 'Organizer', joined: '2024-09-01', events: 6,  bookings: 0 },
  { id: 'u-009', name: 'Nur Arslan',       email: 'nur@evoria.live',       role: 'Admin',     joined: '2023-07-19', events: 0,  bookings: 0 },
  { id: 'u-010', name: 'Tolga Polat',      email: 'tolga.p@hey.com',       role: 'Attendee',  joined: '2026-01-08', events: 0,  bookings: 1 },
  { id: 'u-011', name: 'Aurora Symphonic', email: 'hello@aurora.sym',      role: 'Organizer', joined: '2024-12-02', events: 3,  bookings: 0 },
  { id: 'u-012', name: 'Defne Kara',       email: 'defne@nightmarket.co',  role: 'Organizer', joined: '2025-04-17', events: 5,  bookings: 0 },
];

export const ADMIN_EVENTS_LIST: AdminEvent[] = [
  { id: 'solstice-live',  title: 'Solstice — Live at Volkan Arena',      organizer: 'Mira Kaan',        orgEmail: 'mira@evoria.live',     date: '2026-05-18', venue: 'Volkan Arena',    capacity: 12400, sold: 11520 },
  { id: 'lumen-festival', title: 'Lumen Festival — Weekend Pass',        organizer: 'Defne Kara',       orgEmail: 'defne@nightmarket.co', date: '2026-06-12', venue: 'Kıyı Fields',     capacity: 22000, sold: 18920 },
  { id: 'futurestack',    title: 'Futurestack / 26 — The Product Conf.', organizer: 'Ece Toprak',       orgEmail: 'ece@futurestack.co',   date: '2026-09-23', venue: 'Haliç Congress',  capacity: 1800,  sold: 1120 },
  { id: 'derby-80',       title: 'Derby 80 — Regional Final',            organizer: 'League Ops',       orgEmail: 'ops@league34.tr',      date: '2026-05-02', venue: 'Stadı 34',        capacity: 42000, sold: 41600 },
  { id: 'the-quiet-room', title: 'The Quiet Room',                       organizer: 'Atölye 6',         orgEmail: 'office@atolye6.com',   date: '2026-04-28', venue: 'Salon Beyaz',     capacity: 420,   sold: 168 },
  { id: 'aurora-symph',   title: 'Aurora Symphonic — Film Scores Live',  organizer: 'Aurora Symphonic', orgEmail: 'hello@aurora.sym',     date: '2026-05-30', venue: 'Tepe Hall',       capacity: 2200,  sold: 1560 },
  { id: 'night-market',   title: 'Night Market — Summer Edition',        organizer: 'Defne Kara',       orgEmail: 'defne@nightmarket.co', date: '2026-06-05', venue: 'Balat Courtyard', capacity: 3500,  sold: 2030 },
  { id: 'coastal-cup',    title: 'Coastal Cup — Opening Round',          organizer: 'Burak Çelik',      orgEmail: 'burak@coastal.fed',    date: '2026-07-11', venue: 'Marina Court',    capacity: 6200,  sold: 2790 },
];

export const ADMIN_CATEGORIES: AdminCategory[] = [
  { id: 'c-concerts',    name: 'Concerts',    description: 'Live music — arenas, halls, clubs.',       events: 18 },
  { id: 'c-festivals',   name: 'Festivals',   description: 'Multi-day, multi-stage outdoor events.',   events: 7 },
  { id: 'c-conferences', name: 'Conferences', description: 'Professional talks, workshops, summits.',  events: 11 },
  { id: 'c-sports',      name: 'Sports',      description: 'Matches, tournaments, leagues.',           events: 24 },
  { id: 'c-theater',     name: 'Theater',     description: 'Staged drama, musicals, performance art.', events: 9 },
  { id: 'c-comedy',      name: 'Comedy',      description: 'Stand-up, improv, late-night showcases.',  events: 5 },
  { id: 'c-exhibit',     name: 'Exhibitions', description: 'Galleries, museums, pop-up installations.',events: 3 },
];

export const ADMIN_VENUES: AdminVenue[] = [
  { id: 'v-volkan', name: 'Volkan Arena',    address: 'Aziziye Cad. 14', city: 'Istanbul', capacity: 12400, layout: 'Stadium',    events: 6 },
  { id: 'v-kiyi',   name: 'Kıyı Fields',     address: 'Pine Coast Rd.',  city: 'Çeşme',    capacity: 22000, layout: 'Open-Air',   events: 2 },
  { id: 'v-halic',  name: 'Haliç Congress',  address: 'Sütlüce Mh. 2',   city: 'Istanbul', capacity: 1800,  layout: 'Conference', events: 11 },
  { id: 'v-stad34', name: 'Stadı 34',        address: 'Kuzey Kapı 3',    city: 'Istanbul', capacity: 42000, layout: 'Stadium',    events: 18 },
  { id: 'v-beyaz',  name: 'Salon Beyaz',     address: 'Tunalı 77',       city: 'Ankara',   capacity: 420,   layout: 'Theater',    events: 9 },
  { id: 'v-tepe',   name: 'Tepe Hall',       address: 'Alsancak 12',     city: 'Izmir',    capacity: 2200,  layout: 'Theater',    events: 4 },
  { id: 'v-balat',  name: 'Balat Courtyard', address: 'Yıldırım Cd. 8',  city: 'Istanbul', capacity: 3500,  layout: 'Open-Air',   events: 3 },
  { id: 'v-marina', name: 'Marina Court',    address: 'Deniz Sk. 1',     city: 'Bodrum',   capacity: 6200,  layout: 'Stadium',    events: 2 },
];

export const ADMIN_ACTIVITY: AdminActivity[] = [
  { id: 1, who: 'Mira Kaan',   action: 'created event',     target: 'Solstice — Live at Volkan Arena',  kind: 'event',    when: '4m ago' },
  { id: 2, who: 'Leyla Özkan', action: 'completed booking', target: 'EVR-9X1A-7Q4 · Aurora Symphonic',  kind: 'booking',  when: '12m ago' },
  { id: 3, who: 'Ece Toprak',  action: 'updated category',  target: 'Conferences',                      kind: 'category', when: '38m ago' },
  { id: 4, who: 'System',      action: 'flagged venue',     target: 'Salon Beyaz — capacity mismatch',  kind: 'alert',    when: '1h ago' },
  { id: 5, who: 'Tolga Polat', action: 'signed up',         target: 'tolga.p@hey.com',                  kind: 'user',     when: '2h ago' },
  { id: 6, who: 'Atölye 6',    action: 'published event',   target: 'The Quiet Room — Spring Revival',  kind: 'event',    when: '3h ago' },
  { id: 7, who: 'Burak Çelik', action: 'deleted venue',     target: 'Marina Pavilion (duplicate)',      kind: 'delete',   when: '5h ago' },
  { id: 8, who: 'Kaan Yılmaz', action: 'promoted user',     target: 'Nur Arslan → Admin',               kind: 'user',     when: '1d ago' },
];

export const SPARK: Record<'users' | 'events' | 'bookings' | 'organizers', number[]> = {
  users:      [62, 68, 71, 74, 80, 85, 92, 98],
  events:     [18, 22, 21, 25, 27, 28, 31, 34],
  bookings:   [420, 512, 488, 602, 655, 640, 712, 820],
  organizers: [14, 15, 15, 17, 18, 18, 19, 21],
};
