'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Badge, Card, GradientCover, cx } from '@/components/ui';
import {
  IconSearch, IconMapPin, IconArrowRight, IconCalendarDays, IconShare, IconTicket, IconX,
} from '@/components/icons';
import { EVENTS } from '@/data/events';
import { useBookings } from '@/state/bookings';
import { RequireAuth } from '@/components/auth-guards';
import type { Booking, Event as EventType } from '@/types';
import { fmtDate, fmtDateLong, fmtTime } from '@/lib/utils';

type Filter = 'upcoming' | 'past' | 'all';

export default function MyBookingsPage() {
  return (
    <RequireAuth>
      <MyBookingsInner />
    </RequireAuth>
  );
}

function MyBookingsInner() {
  const router = useRouter();
  const { bookings, cancelBooking } = useBookings();
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const shown = bookings.filter((b) => (filter === 'all' ? true : b.status === filter));

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 md:px-10 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.18em] font-mono font-semibold text-slate-500 dark:text-slate-400">YOUR ACCOUNT</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">My bookings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {bookings.length} total · {bookings.filter((b) => b.status === 'upcoming').length} upcoming
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')} leftIcon={<IconSearch size={14} />}>Discover events</Button>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit text-sm">
        {(['upcoming', 'past', 'all'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cx(
              'px-4 h-8 rounded-md text-xs font-medium capitalize transition-colors',
              filter === k
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            {k}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState onBrowse={() => router.push('/')} />
      ) : (
        <div className="space-y-4">
          {shown.map((b) => {
            const ev = EVENTS.find((e) => e.id === b.eventId);
            if (!ev) return null;
            return <BookingCard key={b.id} booking={b} event={ev} onOpen={(id) => router.push(`/events/${id}`)} onCancel={(id) => setCancelTarget(id)} />;
          })}
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCancelTarget(null)}>
          <Card className="w-full max-w-md mx-4 p-6 slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 flex items-center justify-center">
                <IconX size={20} />
              </div>
              <button onClick={() => setCancelTarget(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <IconX size={18} />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cancel booking?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This will cancel your booking <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{cancelTarget}</span>. This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)}>Keep booking</Button>
              <Button variant="danger" size="sm" onClick={() => { cancelBooking(cancelTarget); setCancelTarget(null); }}>Cancel booking</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

const BookingCard = ({ booking, event, onOpen, onCancel }: { booking: Booking; event: EventType; onOpen: (id: string) => void; onCancel: (id: string) => void }) => {
  const past = booking.status === 'past';
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] items-stretch">
        <GradientCover cat={event.category} className="aspect-[4/3] md:aspect-auto md:h-full min-h-[140px]">
          <div className="absolute top-3 left-3 text-white font-mono text-[10px] tracking-[0.18em] font-semibold">
            {fmtDate(event.date).toUpperCase()}
          </div>
          <div className="absolute bottom-3 left-3 text-white font-bold text-4xl tabular-nums leading-none">
            {new Date(event.date).getDate()}
          </div>
        </GradientCover>
        <div className="p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{fmtDateLong(event.date)} · {fmtTime(event.date)}</div>
              <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{event.title}</h3>
              <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                <IconMapPin size={14} />{event.venue} · {event.city}
              </div>
            </div>
            <Badge tone={past ? 'neutral' : 'success'} className="shrink-0">
              {past ? 'Past' : <><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Upcoming</>}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span><span className="text-slate-400 dark:text-slate-500">Section ·</span> <span className="font-medium text-slate-900 dark:text-slate-100">{booking.section}</span></span>
            <span><span className="text-slate-400 dark:text-slate-500">Seats ·</span> <span className="font-medium text-slate-900 dark:text-slate-100">{booking.seats.join(', ')}</span></span>
            <span><span className="text-slate-400 dark:text-slate-500">Booked ·</span> <span className="font-medium text-slate-900 dark:text-slate-100">{booking.bookedAt}</span></span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpen(event.id)} rightIcon={<IconArrowRight size={14} />}>Event details</Button>
            {!past && <Button variant="ghost" size="sm" leftIcon={<IconCalendarDays size={14} />}>Add to calendar</Button>}
            {!past && <Button variant="ghost" size="sm" leftIcon={<IconShare size={14} />}>Share</Button>}
            {!past && <Button variant="danger" size="sm" leftIcon={<IconX size={14} />} onClick={() => onCancel(booking.id)}>Cancel</Button>}
          </div>
        </div>
        <div className="p-5 md:p-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 min-w-[220px]">
          <QRCodeMock seed={booking.id} />
          <div className="mt-2 font-mono text-[11px] font-semibold tracking-wider text-slate-900 dark:text-slate-100">{booking.id}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase">Show at gate</div>
          <div className="mt-3 text-xs text-slate-700 dark:text-slate-300 tabular-nums">${booking.price.toLocaleString()} · {booking.quantity} tkt</div>
        </div>
      </div>
    </Card>
  );
};

const EmptyState = ({ onBrowse }: { onBrowse: () => void }) => (
  <Card className="p-12 text-center">
    <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 flex items-center justify-center">
      <IconTicket size={28} />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No bookings yet</h3>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
      Once you book an event, your tickets will appear here with QR codes ready to scan at the gate.
    </p>
    <Button variant="primary" className="mt-5" onClick={onBrowse} rightIcon={<IconArrowRight size={14} />}>Discover events</Button>
  </Card>
);

const QRCodeMock = ({ seed = 'EVR' }: { seed?: string }) => {
  const size = 25;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0;
  const rng = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
  const cells: React.ReactElement[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const finder = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
      const timing = x === 6 || y === 6;
      const on = finder
        ? (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4))
        : timing
          ? (x + y) % 2 === 0
          : rng() > 0.52;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className="fill-slate-900 dark:fill-white" />);
    }
  }
  return (
    <div className="p-2 rounded-lg bg-white border border-slate-200 dark:border-slate-700">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-28 h-28" shapeRendering="crispEdges">{cells}</svg>
    </div>
  );
};
