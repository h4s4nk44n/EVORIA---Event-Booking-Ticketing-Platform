'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Badge, Card, Progress, GradientCover, cx } from '@/components/ui';
import { SeatMap, SeatMapLegend } from '@/components/seatmap';
import {
  IconChevronLeft, IconHeart, IconShare, IconCalendarDays, IconClock, IconMapPin,
  IconUser, IconShield, IconFlame, IconArrowUpRight, IconArmchair, IconArrowRight, IconCheck,
} from '@/components/icons';
import { CATEGORIES } from '@/data/events';
import { useEventsStore } from '@/state/events';
import { ARCHETYPES, TIERS, type ArchetypeKey } from '@/data/archetypes';
import type { Event as EventType, SeatSection } from '@/types';
import { fmtDate, fmtTime, fmtDateLong } from '@/lib/utils';

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { publicEvents, sectionSoldDelta, eventArchetype } = useEventsStore();
  const ev = publicEvents.find((e) => e.id === id) || publicEvents[0];
  // Each event has a single seat-map archetype – decided at creation time.
  const archetype = eventArchetype(ev);
  const [selected, setSelected] = useState<SeatSection | null>(null);
  const [hovered, setHovered] = useState<SeatSection | null>(null);
  const baseArc = ARCHETYPES[archetype];
  // Layer live booking deltas onto each section so the availability bar,
  // SOLD-OUT badge and seat-map colouring reflect what's actually been
  // booked in this session.
  const arc = {
    ...baseArc,
    sections: baseArc.sections.map((s) => {
      const sold = Math.min(s.capacity, s.sold + sectionSoldDelta(ev.id, s.id));
      return { ...s, sold, soldOut: s.soldOut || sold >= s.capacity };
    }),
  };

  useEffect(() => { setSelected(null); }, [archetype, id]);


  const activeRef = selected || hovered;
  // Re-resolve the active section against the live `arc.sections` so its
  // `sold`/`soldOut` numbers stay current even after a booking lands.
  const active = activeRef ? (arc.sections.find((s) => s.id === activeRef.id) ?? activeRef) : null;
  const cat = CATEGORIES.find((c) => c.id === ev.category);

  const handleBook = () => {
    if (selected) router.push(`/events/${ev.id}/book?section=${encodeURIComponent(selected.id)}&archetype=${archetype}`);
  };

  return (
    <div className="page-enter mx-auto max-w-7xl px-6 md:px-10 py-6 space-y-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <button onClick={() => router.push('/')} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100">
          <IconChevronLeft size={14} /> All events
        </button>
        <span>·</span><span>{cat?.label}</span>
        <span>·</span><span className="text-slate-900 dark:text-slate-200 font-medium truncate">{ev.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <GradientCover cat={ev.category} className="aspect-[16/9] lg:aspect-auto min-h-[360px]">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="text-[11px] tracking-[0.2em] font-mono font-semibold opacity-80">
              {fmtDate(ev.date).toUpperCase()} · {fmtTime(ev.date)}
            </div>
            <h1 className="mt-2 text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight max-w-xl">{ev.title}</h1>
            <div className="mt-3 text-white/85">{ev.tagline}</div>
          </div>
        </GradientCover>

        <Card className="p-6 flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] tracking-[0.18em] font-mono font-semibold text-slate-500 dark:text-slate-400">EVENT INFO</div>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{ev.artist}</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm"><IconHeart size={14} /></Button>
              <Button variant="outline" size="sm"><IconShare size={14} /></Button>
            </div>
          </div>

          <dl className="mt-5 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <InfoRow icon={<IconCalendarDays size={16} />} label="Date" value={fmtDateLong(ev.date)} />
            <InfoRow icon={<IconClock size={16} />} label="Doors · Duration" value={`${ev.doorsOpen} · ${ev.duration}`} />
            <InfoRow icon={<IconMapPin size={16} />} label="Venue" value={`${ev.venue}, ${ev.city}`} link="View map" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ev.venue}, ${ev.city}`)}`} />
            <InfoRow icon={<IconUser size={16} />} label="Organizer" value={ev.organizer} />
            <InfoRow icon={<IconShield size={16} />} label="Guarantee" value="Refundable up to 48h before" />
          </dl>

          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">About</div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{ev.description}</p>
          </div>

          <div className="mt-auto pt-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Starting at</div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">${ev.priceFrom}</div>
            </div>
            <Badge tone={ev.heat === 'Almost Sold Out' ? 'danger' : ev.heat === 'Selling Fast' ? 'warn' : 'success'}>
              {ev.heat === 'Selling Fast' && <IconFlame size={11} />}
              {ev.heat}
            </Badge>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] tracking-[0.18em] font-mono font-semibold text-slate-500 dark:text-slate-400">PICK YOUR SECTION</div>
              <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{arc.label}</h3>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 capitalize">{archetype} layout</div>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border border-slate-100 dark:border-slate-800 p-4">
            <SeatMap archetype={archetype} sections={arc.sections} selectedId={selected?.id} onSelect={setSelected} onHover={setHovered} />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <SeatMapLegend />
          </div>
        </Card>
        <SectionDetailPanel section={active} event={ev} onBook={handleBook} hasPick={!!selected} />
      </div>

      <Card className="p-6">
        <div className="text-[11px] tracking-[0.18em] font-mono font-semibold text-slate-500 dark:text-slate-400 mb-4">GOOD TO KNOW</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ev.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-4">
              <div className="w-8 h-8 rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-500 flex items-center justify-center shrink-0">
                <IconCheck size={16} />
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300">{h}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const InfoRow = ({
  icon, label, value, link, href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  link?: string;
  /** When provided, the trailing CTA becomes an actual external anchor. */
  href?: string;
}) => (
  <div className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-slate-900 dark:text-slate-100 font-medium text-right flex items-center gap-2">
      <span>{value}</span>
      {link && (
        <a
          className="text-brand-500 text-xs inline-flex items-center gap-1 hover:underline cursor-pointer"
          href={href}
          target={href ? '_blank' : undefined}
          rel={href ? 'noopener noreferrer' : undefined}
        >
          {link}
          <IconArrowUpRight size={12} />
        </a>
      )}
    </div>
  </div>
);

const SectionDetailPanel = ({
  section,
  event,
  onBook,
  hasPick,
}: {
  section: SeatSection | null;
  event: EventType;
  onBook: () => void;
  hasPick: boolean;
}) => {
  if (!section) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <IconArmchair size={22} className="text-slate-400 dark:text-slate-500" />
        </div>
        <div className="font-semibold text-slate-900 dark:text-slate-100">Hover over a section</div>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          Click a colored section on the map to see its price, availability, and pick tickets.
        </p>
      </Card>
    );
  }
  const tier = TIERS[section.tier];
  const available = section.capacity - section.sold;
  const pct = (section.sold / section.capacity) * 100;
  return (
    <Card className="p-6 slide-up flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <Badge tone="outline" className="uppercase tracking-wider text-[10px]">
            <span className="w-2 h-2 rounded-full mr-1" style={{ background: tier.hex }} />
            {tier.label}
          </Badge>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{section.name}</h3>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{event.venue}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">${section.price}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">per ticket</div>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Availability</span>
          <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
            {section.soldOut ? 'Sold out' : `${available} of ${section.capacity} seats`}
          </span>
        </div>
        <Progress
          className="mt-2"
          value={pct}
          barClassName={section.soldOut ? 'bg-slate-500' : pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-accent-500' : 'bg-green-500'}
        />
      </div>
      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center justify-between"><span>View</span><span className="text-slate-900 dark:text-slate-200">Clear sightline</span></div>
        <div className="flex items-center justify-between"><span>Entry</span><span className="text-slate-900 dark:text-slate-200">Gate {Math.ceil((section.name.length % 6) + 1)}</span></div>
        <div className="flex items-center justify-between"><span>Age policy</span><span className="text-slate-900 dark:text-slate-200">All ages</span></div>
      </div>
      <div className="mt-auto pt-6">
        <Button
          variant="primary"
          size="xl"
          className="w-full"
          disabled={section.soldOut || !hasPick}
          onClick={onBook}
          rightIcon={<IconArrowRight size={18} />}
        >
          {section.soldOut ? 'Sold out' : hasPick ? 'Select tickets' : 'Click section to select'}
        </Button>
        <div className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Reservation held for 10 minutes once you continue
        </div>
      </div>
    </Card>
  );
};
