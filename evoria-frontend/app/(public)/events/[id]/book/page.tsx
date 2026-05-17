'use client';

import { Suspense, useState, useEffect, Fragment, type ReactNode } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button, Badge, Card, Input, Countdown, GradientCover, cx } from '@/components/ui';
import {
  IconChevronLeft, IconCheck, IconMinus, IconPlus, IconShield, IconBell, IconTicket,
  IconUser, IconCalendar, IconCalendarDays, IconDownload, IconShare, IconArrowRight,
} from '@/components/icons';
import { EVENTS } from '@/data/events';
import { ARCHETYPES, TIERS, type ArchetypeKey } from '@/data/archetypes';
import { useBookings } from '@/state/bookings';
import { RequireAuth } from '@/components/auth-guards';
import type { Booking, Event as EventType, SeatSection, Tier } from '@/types';
import { fmtDate, fmtDateLong, fmtTime } from '@/lib/utils';

type CardInfo = { number: string; name: string; exp: string; cvc: string };

export default function BookingPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <BookingPageInner />
      </Suspense>
    </RequireAuth>
  );
}

function BookingPageInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const sp = useSearchParams();
  const router = useRouter();
  const archetype = (sp?.get('archetype') || 'stadium') as ArchetypeKey;
  const sectionId = sp?.get('section') || '';
  const ev = EVENTS.find((e) => e.id === id) || EVENTS[0];
  const arc = ARCHETYPES[archetype];
  const section = arc.sections.find((s) => s.id === sectionId) || arc.sections[0];
  const tier = TIERS[section.tier];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quantity, setQuantity] = useState(2);
  const [seconds, setSeconds] = useState(600);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [card, setCard] = useState<CardInfo>({
    number: '4242 4242 4242 4242', name: 'Mira Kaan', exp: '04/28', cvc: '123',
  });
  const { addBooking } = useBookings();

  useEffect(() => {
    if (step === 3) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const subtotal = section.price * quantity;
  const fees = Math.round(subtotal * 0.08);
  const total = subtotal + fees;

  const confirm = () => {
    const newId = 'EVR-' + Math.random().toString(36).toUpperCase().slice(2, 6) + '-' + Math.random().toString(36).toUpperCase().slice(2, 5);
    setBookingId(newId);
    const booking: Booking = {
      id: newId,
      eventId: ev.id,
      section: section.name,
      price: section.price,
      quantity,
      seats: Array.from({ length: quantity }, (_, i) => `Row G · ${20 + i}`),
      status: 'upcoming',
      bookedAt: new Date().toISOString().slice(0, 10),
    };
    addBooking(booking);
    setStep(3);
  };

  return (
    <div className="page-enter mx-auto max-w-4xl px-6 md:px-10 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.push(`/events/${ev.id}`)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <IconChevronLeft size={14} /> Back to event
        </button>
        {step !== 3 && <Countdown seconds={seconds} />}
      </div>

      <div className="flex items-center gap-3 text-sm">
        {(['Review', 'Payment', 'Confirmed'] as const).map((lbl, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const on = step === n;
          const done = step > n;
          return (
            <Fragment key={lbl}>
              <div className={cx(
                'inline-flex items-center gap-2',
                on ? 'text-slate-900 dark:text-slate-100 font-semibold' : done ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500',
              )}>
                <span className={cx(
                  'w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-semibold',
                  on ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                     : done ? 'bg-brand-500 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
                )}>
                  {done ? <IconCheck size={14} /> : n}
                </span>
                {lbl}
              </div>
              {i < 2 && <div className={cx('flex-1 h-px', step > n ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-800')} />}
            </Fragment>
          );
        })}
      </div>

      {step === 1 && (
        <ReviewStep
          ev={ev} section={section} tier={tier} quantity={quantity} setQuantity={setQuantity}
          subtotal={subtotal} fees={fees} total={total} onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <PaymentStep
          section={section} total={total} quantity={quantity}
          card={card} setCard={setCard} onBack={() => setStep(1)} onConfirm={confirm}
        />
      )}
      {step === 3 && bookingId && (
        <ConfirmedStep
          ev={ev} section={section} quantity={quantity} total={total}
          bookingId={bookingId} onDone={() => router.push('/bookings')}
        />
      )}
    </div>
  );
}

const ReviewStep = ({
  ev, section, tier, quantity, setQuantity, subtotal, fees, total, onNext,
}: {
  ev: EventType; section: SeatSection; tier: Tier;
  quantity: number; setQuantity: (n: number) => void;
  subtotal: number; fees: number; total: number; onNext: () => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 slide-up">
    <Card className="p-6">
      <div className="text-[11px] tracking-[0.18em] font-mono font-semibold text-slate-500 dark:text-slate-400">STEP 1 · REVIEW</div>
      <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">Confirm your selection</h2>
      <div className="mt-6 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex gap-4 p-4">
          <GradientCover cat={ev.category} className="w-28 h-28 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">{fmtDateLong(ev.date)} · {fmtTime(ev.date)}</div>
            <h3 className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100 truncate">{ev.title}</h3>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{ev.venue} · {ev.city}</div>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="outline" className="uppercase tracking-wider text-[10px]">
                <span className="w-2 h-2 rounded-full mr-1" style={{ background: tier.hex }} />
                {tier.label}
              </Badge>
              <Badge tone="neutral">{section.name}</Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quantity</div>
        <div className="mt-3 flex items-center gap-4">
          <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 p-1">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-9 w-9 inline-flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
              <IconMinus size={14} />
            </button>
            <div className="min-w-10 text-center text-lg font-semibold tabular-nums">{quantity}</div>
            <button onClick={() => setQuantity(Math.min(8, quantity + 1))} className="h-9 w-9 inline-flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
              <IconPlus size={14} />
            </button>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Max 8 per order · seats assigned automatically</div>
        </div>
      </div>
      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><IconShield size={14} /> Refundable up to 48h before the event</div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><IconBell size={14} /> You&apos;ll get an entry reminder 24h before</div>
      </div>
    </Card>
    <SummaryCard section={section} quantity={quantity} subtotal={subtotal} fees={fees} total={total} cta="Continue to payment" onClick={onNext} />
  </div>
);

const PaymentStep = ({
  section, total, quantity, card, setCard, onBack, onConfirm,
}: {
  section: SeatSection; total: number; quantity: number;
  card: CardInfo; setCard: (c: CardInfo) => void; onBack: () => void; onConfirm: () => void;
}) => {
  const subtotal = section.price * quantity;
  const fees = total - subtotal;
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 slide-up">
      <Card className="p-6">
        <div className="text-[11px] tracking-[0.18em] font-mono font-semibold text-slate-500 dark:text-slate-400">STEP 2 · PAYMENT</div>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">Payment details</h2>
        <div className="mt-6 space-y-4">
          <Field label="Card number">
            <Input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} leftIcon={<IconTicket size={16} />} rightIcon={<span className="text-xs font-mono text-slate-400">VISA</span>} />
          </Field>
          <Field label="Cardholder name">
            <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} leftIcon={<IconUser size={16} />} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expiry">
              <Input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} leftIcon={<IconCalendar size={16} />} />
            </Field>
            <Field label="CVC">
              <Input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} leftIcon={<IconShield size={16} />} />
            </Field>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <IconShield size={14} /> Encrypted · 3-D Secure
        </div>
      </Card>
      <SummaryCard section={section} quantity={quantity} subtotal={subtotal} fees={fees} total={total} cta={`Pay $${total.toLocaleString()}`} onClick={onConfirm} onBack={onBack} />
    </div>
  );
};

const ConfirmedStep = ({
  ev, section, quantity, total, bookingId, onDone,
}: {
  ev: EventType; section: SeatSection; quantity: number; total: number; bookingId: string; onDone: () => void;
}) => (
  <div className="slide-up">
    <Card className="overflow-hidden">
      <div className="relative p-8 bg-brand-500 text-white">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 20% 10%, rgba(255,255,255,.3), transparent 40%)' }} />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><IconCheck size={24} /></div>
          <div>
            <div className="text-xs tracking-[0.2em] font-mono font-semibold opacity-85">BOOKING CONFIRMED</div>
            <h2 className="mt-1 text-3xl font-bold">You&apos;re going.</h2>
            <p className="mt-1 text-white/85">We sent a confirmation to your email</p>
          </div>
        </div>
      </div>
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_200px] gap-6 items-stretch">
          <div>
            <div className="text-[11px] tracking-[0.2em] font-mono font-semibold text-slate-500 dark:text-slate-400">
              {fmtDate(ev.date).toUpperCase()} · {fmtTime(ev.date)}
            </div>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{ev.title}</h3>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{ev.venue} · {ev.city}</div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <MetaRow label="Section" value={section.name} />
              <MetaRow label="Qty" value={`${quantity} ticket${quantity > 1 ? 's' : ''}`} />
              <MetaRow label="Seats" value={Array.from({ length: quantity }, (_, i) => `G-${20 + i}`).join(', ')} />
              <MetaRow label="Total" value={`$${total.toLocaleString()}`} />
            </dl>
          </div>
          <div className="hidden md:block w-px text-slate-200 dark:text-slate-700 ticket-perf" />
          <div className="flex flex-col items-center justify-center">
            <QRCodeMock seed={bookingId} />
            <div className="mt-3 font-mono text-xs font-semibold tracking-wider text-slate-900 dark:text-slate-100">{bookingId}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase">Booking code</div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<IconCalendarDays size={16} />}>Add to calendar</Button>
            <Button variant="outline" leftIcon={<IconDownload size={16} />}>Download</Button>
            <Button variant="ghost" leftIcon={<IconShare size={16} />}>Share</Button>
          </div>
          <Button variant="primary" rightIcon={<IconArrowRight size={16} />} onClick={onDone}>View my bookings</Button>
        </div>
      </div>
    </Card>
  </div>
);

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</dt>
    <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{value}</dd>
  </div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</div>
    {children}
  </label>
);

const SummaryCard = ({
  section, quantity, fees, total, cta, onClick, onBack,
}: {
  section: SeatSection; quantity: number; subtotal: number; fees: number; total: number;
  cta: string; onClick: () => void; onBack?: () => void;
}) => (
  <Card className="p-6 h-fit sticky top-6">
    <div className="text-[11px] tracking-[0.18em] font-mono font-semibold text-slate-500 dark:text-slate-400">ORDER SUMMARY</div>
    <div className="mt-4 space-y-2.5 text-sm">
      <Row k={`${section.name} × ${quantity}`} v={`$${(section.price * quantity).toLocaleString()}`} />
      <Row k="Fees" v={`$${fees.toLocaleString()}`} muted />
    </div>
    <div className="my-5 border-t border-dashed border-slate-200 dark:border-slate-700" />
    <Row
      k={<span className="text-base font-semibold">Total</span>}
      v={<span className="text-2xl font-bold tabular-nums">${total.toLocaleString()}</span>}
    />
    <Button variant="primary" size="lg" className="mt-6 w-full" onClick={onClick} rightIcon={<IconArrowRight size={16} />}>{cta}</Button>
    {onBack && <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={onBack}>Back</Button>}
  </Card>
);

const Row = ({ k, v, muted = false }: { k: ReactNode; v: ReactNode; muted?: boolean }) => (
  <div className="flex items-baseline justify-between">
    <span className={cx(muted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300')}>{k}</span>
    <span className={cx('tabular-nums', muted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100 font-medium')}>{v}</span>
  </div>
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
      if (on) {
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className="fill-slate-900 dark:fill-white" />);
      }
    }
  }
  return (
    <div className="p-2 rounded-lg bg-white border border-slate-200 dark:border-slate-700">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-28 h-28" shapeRendering="crispEdges">
        {cells}
      </svg>
    </div>
  );
};
