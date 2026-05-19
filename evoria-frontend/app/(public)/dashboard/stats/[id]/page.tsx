'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Card, GradientCover, Input, Progress, cx } from '@/components/ui';
import {
  IconCalendar, IconMapPin, IconDownload, IconTicket, IconArrowUpRight,
  IconArmchair, IconSearch, IconChevronLeft, IconChevronRight,
} from '@/components/icons';
import {
  makeAttendees,
  sectionsForEvent,
  type Attendee,
  type OrganizerEvent,
  type OrganizerEventStatus,
  type OrganizerSectionBreakdown,
} from '@/data/organizer';
import { useEventsStore } from '@/state/events';
import { TIERS } from '@/data/archetypes';
import { RequireRole } from '@/components/auth-guards';
import { fmtDate, fmtInt, fmtMoney } from '@/lib/utils';
import { apiGet } from '@/lib/api';

type StatsResponse = {
  event: OrganizerEvent;
  sections: OrganizerSectionBreakdown[];
  attendees: Attendee[];
};

export default function EventStatsPage() {
  return (
    <RequireRole roles={['organizer']}>
      <EventStatsInner />
    </RequireRole>
  );
}

function EventStatsInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  // Mock-first state so the page renders instantly; API call replaces it when available.
  const { organizerEvents } = useEventsStore();
  const fallbackEvent = useMemo(() => organizerEvents.find((e) => e.id === id) || organizerEvents[0], [id, organizerEvents]);
  const fallbackSections = useMemo(() => sectionsForEvent(fallbackEvent), [fallbackEvent]);
  const fallbackAttendees = useMemo(
    () =>
      makeAttendees(
        fallbackEvent.id,
        Math.min(200, Math.max(20, Math.round(fallbackEvent.sold / 50))),
        fallbackSections.map((s) => s.name),
      ),
    [fallbackEvent, fallbackSections],
  );

  const [ev, setEv] = useState<OrganizerEvent>(fallbackEvent);
  const [sections, setSections] = useState<OrganizerSectionBreakdown[]>(fallbackSections);
  const [attendees, setAttendees] = useState<Attendee[]>(fallbackAttendees);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const result = await apiGet<StatsResponse>(`/events/${encodeURIComponent(id)}/stats`);
      if (cancelled) return;
      if (result.ok && result.data) {
        if (result.data.event) setEv(result.data.event);
        if (Array.isArray(result.data.sections) && result.data.sections.length) setSections(result.data.sections);
        if (Array.isArray(result.data.attendees) && result.data.attendees.length) setAttendees(result.data.attendees);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const remaining = ev.capacity - ev.sold;

  const filteredAttendees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
  }, [attendees, search]);

  const [page, setPage] = useState(0);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredAttendees.length / pageSize));
  const pageItems = filteredAttendees.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    setPage(0);
  }, [search]);

  return (
    <div className="page-enter mx-auto max-w-7xl px-6 md:px-10 py-8">
      <button
        onClick={() => router.push('/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-5"
      >
        <IconChevronLeft size={14} /> Back to dashboard
      </button>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-0">
          <GradientCover cat={ev.category} className="h-40 md:h-full min-h-[140px]" label={ev.category} />
          <div className="p-6 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusPill status={ev.status} />
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">ID · {ev.id}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{ev.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <IconCalendar size={14} /> {fmtDate(ev.date)} · {new Date(ev.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IconMapPin size={14} /> {ev.venue} · {ev.city}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" leftIcon={<IconDownload size={14} />} size="sm">Export CSV</Button>
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/create?edit=${ev.id}`)}>Edit event</Button>
              <Button variant="secondary" size="sm" onClick={() => router.push(`/events/${ev.id}`)}>View public page</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <StatCard label="Tickets sold" value={fmtInt(ev.sold)} trend={`of ${fmtInt(ev.capacity)} total`} icon={<IconTicket size={18} />} accent="success" />
        <StatCard label="Revenue" value={fmtMoney(ev.revenue)} trend={`avg $${ev.avgPrice} / ticket`} icon={<IconArrowUpRight size={18} />} accent="accent" />
        <StatCard label="Remaining capacity" value={fmtInt(remaining)} trend={`${ev.capacity ? Math.round((remaining / ev.capacity) * 100) : 0}% of house`} icon={<IconArmchair size={18} />} accent="brand" />
      </div>

      <Card className="overflow-hidden mb-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Section breakdown</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sales performance by seat section.</p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{sections.length} sections</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Section</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium w-[300px]">Sold / Capacity</th>
                <th className="px-5 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sections.map((s) => {
                const pct = s.capacity ? Math.round((s.sold / s.capacity) * 100) : 0;
                const barClass = pct >= 95 ? 'bg-amber-500' : pct >= 70 ? 'bg-green-500' : 'bg-brand-500';
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: TIERS[s.tier as keyof typeof TIERS].hex }} />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">${s.price}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">{fmtInt(s.sold)} / {fmtInt(s.capacity)}</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">{pct}%</span>
                      </div>
                      <Progress value={pct} barClassName={barClass} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">{fmtMoney(s.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Attendees</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {fmtInt(filteredAttendees.length)} bookings shown
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              leftIcon={<IconSearch size={14} />}
              placeholder="Search name or email…"
              className="h-9 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" size="sm" leftIcon={<IconDownload size={14} />}>Export</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Section</th>
                <th className="px-5 py-3 font-medium">Booked</th>
                <th className="px-5 py-3 font-medium text-right">Booking ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageItems.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white text-[11px] font-bold inline-flex items-center justify-center">
                        {a.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{a.email}</td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{a.section}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{a.booked}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400">{a.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Page {page + 1} of {totalPages} · {fmtInt(filteredAttendees.length)} bookings
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800"
            >
              <IconChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cx(
                  'h-8 min-w-[32px] px-2 rounded-md text-xs font-mono',
                  page === i ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800"
            >
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
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
