'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, GradientCover, Input, Progress, cx } from '@/components/ui';
import {
  IconCalendar, IconTicket, IconArrowUpRight, IconFlame, IconDownload, IconPlus,
  IconSearch, IconMapPin, IconX, IconCalendarDays,
} from '@/components/icons';
import { type OrganizerEvent, type OrganizerEventStatus } from '@/data/organizer';
import type { CategoryId } from '@/types';
import { useEventsStore } from '@/state/events';
import { RequireRole } from '@/components/auth-guards';
import { fmtMoney, fmtInt, fmtDateShort } from '@/lib/utils';
import { apiGet, toFailure } from '@/lib/api';

type StatusFilter = 'all' | OrganizerEventStatus;

export default function OrganizerDashboardPage() {
  return (
    <RequireRole roles={['organizer']}>
      <DashboardInner />
    </RequireRole>
  );
}

function DashboardInner() {
  const router = useRouter();

  // Real API call — falls back to the local store (seed + user-created) when the backend is unavailable.
  const { organizerEvents } = useEventsStore();
  const [events, setEvents] = useState<OrganizerEvent[]>(organizerEvents);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // Keep the displayed list in sync with the events store when no API data
    // is in play. This makes newly-created events appear immediately.
    setEvents(organizerEvents);
  }, [organizerEvents]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Backend returns { data: [...], total, page, limit, totalPages }
      const result = await apiGet<{ data: Array<{
        id: string; title: string; description: string; dateTime: string;
        capacity: number; category?: { id: string; name: string } | null;
        venue?: { id: string; name: string; city?: string; address?: string } | null;
        bookedCount: number; availableSpots: number;
      }>; total: number }>('/events/mine');
      if (cancelled) return;
      if (!result.ok) {
        const failure = toFailure(result);
        if (failure.type === 'network_error') {
          setApiError('Offline: showing local data.');
        } else if (failure.type === 'server_error') {
          setApiError(failure.message);
        }
      } else {
        const raw = Array.isArray(result.data) ? result.data : result.data?.data;
        if (Array.isArray(raw) && raw.length > 0) {
          // Map backend shape → OrganizerEvent shape used by the dashboard
          const mapped: OrganizerEvent[] = raw.map((e) => ({
            id: e.id,
            title: e.title,
            venue: e.venue?.name ?? 'Unknown venue',
            city: e.venue?.city ?? e.venue?.address ?? '',
            date: e.dateTime,
            category: (e.category?.name?.toLowerCase() ?? 'concerts') as Exclude<CategoryId, 'all'>,
            status: (e.availableSpots <= 0 ? 'soldout' : 'published') as OrganizerEventStatus,
            capacity: e.capacity,
            sold: e.bookedCount,
            revenue: 0,    // Backend doesn't track revenue yet
            avgPrice: 0,
          }));
          setEvents(mapped);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const totalEvents = events.length;
    const totalTickets = events.reduce((a, e) => a + e.sold, 0);
    const totalRevenue = events.reduce((a, e) => a + e.revenue, 0);
    const upcoming = events.filter((e) => new Date(e.date) > new Date() && e.status !== 'draft').length;
    return { totalEvents, totalTickets, totalRevenue, upcoming };
  }, [events]);

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const filtered = events.filter((e) => (filter === 'all' ? true : e.status === filter));
  const final = filtered.filter((e) => e.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page-enter mx-auto max-w-7xl px-6 md:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">Organizer · Evoria Live</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your events, track sales, and pull attendee lists.</p>
          {apiError && (
            <p className="mt-2 text-xs font-mono text-amber-600 dark:text-amber-400">{apiError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<IconDownload size={16} />}>Export all</Button>
          <Button variant="primary" leftIcon={<IconPlus size={16} />} onClick={() => router.push('/dashboard/create')}>
            Create new event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total events" value={fmtInt(totals.totalEvents)} trend="+2 this quarter" icon={<IconCalendar size={18} />} accent="brand" />
        <StatCard label="Tickets sold" value={fmtInt(totals.totalTickets)} trend="+18.4% vs last 30d" icon={<IconTicket size={18} />} accent="success" />
        <StatCard label="Total revenue" value={fmtMoney(totals.totalRevenue)} trend="+$124.8k vs last 30d" icon={<IconArrowUpRight size={18} />} accent="accent" />
        <StatCard label="Upcoming events" value={fmtInt(totals.upcoming)} trend="Next in 9 days" icon={<IconFlame size={18} />} accent="warn" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My events</h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {loading ? 'loading…' : `${final.length} of ${events.length}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 gap-1">
              {[
                { k: 'all' as const, label: 'All' },
                { k: 'published' as const, label: 'Published' },
                { k: 'draft' as const, label: 'Draft' },
                { k: 'soldout' as const, label: 'Sold out' },
              ].map((t) => (
                <button
                  key={t.k}
                  onClick={() => setFilter(t.k)}
                  className={cx(
                    'h-8 px-3 rounded-md text-xs font-medium transition-colors',
                    filter === t.k
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Input leftIcon={<IconSearch size={14} />} placeholder="Search events…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 w-56" />
          </div>
        </div>
        {final.length === 0 ? (
          <EmptyState onCreate={() => router.push('/dashboard/create')} hasEvents={events.length > 0} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium w-[260px]">Sold / Capacity</th>
                  <th className="px-5 py-3 font-medium">Revenue</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {final.map((ev) => (
                  <EventRow
                    key={ev.id}
                    ev={ev}
                    onStats={() => router.push(`/dashboard/stats/${ev.id}`)}
                    onEdit={() => router.push(`/dashboard/create?edit=${ev.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

type StatAccent = 'brand' | 'success' | 'accent' | 'warn';
const StatCard = ({
  label, value, trend, icon, accent = 'brand',
}: {
  label: string; value: string; trend: string; icon: ReactNode; accent?: StatAccent;
}) => {
  const accents: Record<StatAccent, string> = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    success: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-500',
    warn: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
        <div className={cx('h-8 w-8 rounded-md inline-flex items-center justify-center', accents[accent])}>{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
      <div className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">{trend}</div>
    </Card>
  );
};

const StatusPill = ({ status }: { status: OrganizerEventStatus }) => {
  const map: Record<OrganizerEventStatus, { tone: 'neutral' | 'success' | 'warn'; label: string; dot: string }> = {
    draft: { tone: 'neutral', label: 'Draft', dot: '#94A3B8' },
    published: { tone: 'success', label: 'Published', dot: '#22C55E' },
    soldout: { tone: 'warn', label: 'Sold Out', dot: '#F59E0B' },
  };
  const cfg = map[status];
  return (
    <Badge tone={cfg.tone} className="font-mono uppercase tracking-wider text-[10px]">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </Badge>
  );
};

const EventRow = ({ ev, onStats, onEdit }: { ev: OrganizerEvent; onStats: () => void; onEdit: () => void }) => {
  const pct = ev.capacity ? Math.round((ev.sold / ev.capacity) * 100) : 0;
  const d = fmtDateShort(ev.date);
  const barClass = pct >= 95 ? 'bg-amber-500' : pct >= 70 ? 'bg-green-500' : 'bg-brand-500';
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden">
            <GradientCover cat={ev.category} className="w-full h-full" compact />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[260px]">{ev.title}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <IconMapPin size={12} /> {ev.venue} · {ev.city}
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md border border-slate-200 dark:border-slate-700 grid place-items-center text-center">
            <div>
              <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">{d.m}</div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none mt-0.5">{d.d}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{d.y}</div>
        </div>
      </td>
      <td className="px-5 py-4">
        {ev.status === 'draft' ? (
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">— not on sale —</span>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">{fmtInt(ev.sold)} / {fmtInt(ev.capacity)}</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">{pct}%</span>
            </div>
            <Progress value={pct} barClassName={barClass} />
          </div>
        )}
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        {ev.status === 'draft' ? (
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">—</span>
        ) : (
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{fmtMoney(ev.revenue)}</span>
        )}
      </td>
      <td className="px-5 py-4"><StatusPill status={ev.status} /></td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <button onClick={onEdit} title="Edit" className="h-8 px-3 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Edit</button>
          <button onClick={onStats} title="Stats" className="h-8 px-3 rounded-md text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10">Stats</button>
          <button title="Delete" className="h-8 w-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><IconX size={14} /></button>
        </div>
      </td>
    </tr>
  );
};

const EmptyState = ({ onCreate, hasEvents }: { onCreate: () => void; hasEvents: boolean }) => (
  <div className="p-14 text-center">
    <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 grid place-items-center mb-4">
      <IconCalendarDays size={22} className="text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{hasEvents ? 'No events match this filter' : 'No events yet'}</h3>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
      {hasEvents
        ? 'Try a different status filter or clear your search to see the rest.'
        : 'Create your first event to start selling tickets. You can always save as a draft first.'}
    </p>
    {!hasEvents && (
      <div className="mt-5">
        <Button variant="primary" leftIcon={<IconPlus size={16} />} onClick={onCreate}>Create your first event</Button>
      </div>
    )}
  </div>
);
