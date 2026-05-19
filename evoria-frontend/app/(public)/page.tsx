'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/data/events';
import { useEventsStore } from '@/state/events';
import { GradientCover, Badge, Input, Button } from '@/components/ui';
import {
  IconSearch,
  IconCalendar,
  IconMapPin,
  IconArrowRight,
  IconFlame,
  IconSparkles,
  IconMusic,
  IconTrophy,
  IconMic,
  IconDrama,
} from '@/components/icons';
import type { CategoryId, Event } from '@/types';
import { cn } from '@/lib/utils';

// Icon map for category tabs
const CATEGORY_ICONS: Record<CategoryId, React.ReactNode> = {
  all:         <IconSparkles size={15} />,
  concerts:    <IconMusic size={15} />,
  festivals:   <IconFlame size={15} />,
  conferences: <IconMic size={15} />,
  sports:      <IconTrophy size={15} />,
  theater:     <IconDrama size={15} />,
};

function heatTone(heat: Event['heat']) {
  if (heat === 'Almost Sold Out') return 'danger';
  if (heat === 'Selling Fast')    return 'warn';
  return 'neutral';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function EventCard({ ev }: { ev: Event }) {
  const soldPct = Math.round((ev.sold / ev.capacity) * 100);
  return (
    <Link
      href={`/events/${ev.id}`}
      id={`event-card-${ev.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-xl hover:shadow-slate-900/10 dark:hover:shadow-slate-900/40 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Cover */}
      <GradientCover cat={ev.category} className="h-44" label={ev.category}>
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-white/80 text-[11px] font-mono uppercase tracking-widest mb-1">
                {ev.city}
              </div>
              <div className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow">
                {ev.title}
              </div>
            </div>
            <Badge tone={heatTone(ev.heat)} className="shrink-0 text-[10px]">
              {ev.heat}
            </Badge>
          </div>
        </div>
      </GradientCover>

      {/* Body */}
      <div className="flex flex-col flex-1 gap-3 p-4">
        <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-snug line-clamp-2">
          {ev.tagline}
        </p>

        <div className="flex flex-col gap-1.5 text-[12.5px] text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <IconCalendar size={13} className="text-slate-400 shrink-0" />
            {formatDate(ev.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <IconMapPin size={13} className="text-slate-400 shrink-0" />
            {ev.venue}
          </span>
        </div>

        {/* Availability bar */}
        <div className="space-y-1 mt-auto">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{soldPct}% filled</span>
            <span className="text-slate-500 font-medium">
              {ev.sold.toLocaleString()} / {ev.capacity.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500',
                soldPct >= 95 ? 'bg-red-500' : soldPct >= 70 ? 'bg-amber-400' : 'bg-brand-500',
              )}
              style={{ width: `${soldPct}%` }}
            />
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
          <div>
            <span className="text-[11px] text-slate-400">from </span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              €{ev.priceFrom}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[12px] text-slate-500">
            <IconStar size={12} className="text-amber-400 fill-amber-400" />
            {ev.rating}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Small inline icon to avoid importing IconStar with fill
function IconStar({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [query, setQuery] = useState('');
  const { publicEvents } = useEventsStore();

  const filtered = useMemo(() => {
    return publicEvents.filter((ev) => {
      const matchCat = activeCategory === 'all' || ev.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchQ = !q || ev.title.toLowerCase().includes(q) || ev.city.toLowerCase().includes(q) || ev.artist.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [publicEvents, activeCategory, query]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#1e1040] to-slate-950 py-24 md:py-32">
        {/* decorative orbs */}
        <div className="pointer-events-none absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-500/15 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 md:px-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[12.5px] font-medium text-white/70 backdrop-blur">
            <IconSparkles size={13} className="text-accent-400" />
            Discover events happening near you
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Find &amp; book<br />
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-accent-400 bg-clip-text text-transparent">
              unforgettable events
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-base md:text-lg text-white/60 mb-10">
            Concerts, festivals, sports, and theatre — all in one place. Secure your seat in seconds.
          </p>

          {/* Search bar */}
          <div className="mx-auto max-w-2xl flex gap-2">
            <Input
              id="hero-search"
              placeholder="Search events, artists, or cities…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<IconSearch size={16} />}
              className="flex-1 bg-white/10 border-white/15 text-white placeholder:text-white/40 focus-within:border-brand-400 focus-within:ring-brand-400/20"
            />
            <Button
              id="hero-search-btn"
              size="lg"
              variant="primary"
              rightIcon={<IconArrowRight size={16} />}
            >
              Search
            </Button>
          </div>

          {/* Quick stats */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/50 text-sm">
            {[
              ['8', 'Upcoming events'],
              ['5', 'Categories'],
              ['3', 'Cities'],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-white">{num}</div>
                <div className="text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 md:px-10 py-12">

        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {CATEGORIES.map((cat) => {
            const active = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                id={`cat-tab-${cat.id}`}
                onClick={() => setActiveCategory(cat.id as CategoryId)}
                className={cn(
                  'inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-medium transition-all border',
                  active
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800',
                )}
              >
                {CATEGORY_ICONS[cat.id as CategoryId]}
                {cat.label}
                <span className={cn(
                  'ml-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5',
                  active ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
                )}>
                  {cat.id === 'all' ? publicEvents.length : publicEvents.filter(e => e.category === cat.id).length}
                </span>
              </button>
            );
          })}

          {/* Spacer + result count */}
          <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Event grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <IconSearch size={40} className="mb-4 opacity-40" />
            <p className="text-lg font-medium">No events found</p>
            <p className="text-sm mt-1">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
