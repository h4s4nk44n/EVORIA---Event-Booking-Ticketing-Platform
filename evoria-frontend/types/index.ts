export type Role = 'attendee' | 'organizer' | 'admin';

export type AuthProfile = {
  role: Role;
  name: string;
  email: string;
};

export type CategoryId =
  | 'all'
  | 'concerts'
  | 'festivals'
  | 'conferences'
  | 'sports'
  | 'theater';

export type Category = {
  id: CategoryId;
  label: string;
  icon: string;
};

export type Event = {
  id: string;
  category: Exclude<CategoryId, 'all'>;
  title: string;
  tagline: string;
  artist: string;
  date: string;
  doorsOpen: string;
  duration: string;
  venue: string;
  city: string;
  organizer: string;
  rating: number;
  popularity: number;
  priceFrom: number;
  priceTo: number;
  capacity: number;
  sold: number;
  heat: 'Selling Fast' | 'Almost Sold Out' | 'Available';
  description: string;
  highlights: string[];
};

export type Booking = {
  id: string;
  eventId: string;
  section: string;
  seats: string[];
  price: number;
  quantity: number;
  status: 'upcoming' | 'past';
  bookedAt: string;
};

export type TierKey = 'vip' | 'premium' | 'standard' | 'budget' | 'soldout';
export type Tier = { color: string; label: string; range: string; hex: string };

export type SeatSection = {
  id: string;
  name: string;
  tier: TierKey;
  price: number;
  capacity: number;
  sold: number;
  soldOut?: boolean;
  path: string;
  tint?: string;
};

export type Archetype = {
  label: string;
  viewBox: string;
  stage: { type: 'rect'; x: number; y: number; w: number; h: number; label: string };
  sections: SeatSection[];
};

export type GradientPattern = 'waves' | 'sun' | 'grid' | 'stripe' | 'drape';
export type GradientDef = { a: string; b: string; c: string; pattern: GradientPattern };
