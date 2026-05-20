'use client';

import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Badge, Input, cx } from '@/components/ui';
import { IconCalendar, IconCheck, IconChevronDown, IconChevronLeft, IconClock } from '@/components/icons';
import { VENUES } from '@/data/organizer';
import { CATEGORIES } from '@/data/events';
import { ARCHETYPES } from '@/data/archetypes';
import { RequireRole } from '@/components/auth-guards';
import type { Archetype, CategoryId, SeatSection, TierKey } from '@/types';
import { fmtInt, fmtMoney } from '@/lib/utils';
import { apiGet, apiPost, apiPut, toFailure } from '@/lib/api';
import { useEventsStore } from '@/state/events';

type Row = {
  id: string;
  name: string;
  tier: TierKey;
  price: number;
  capacity: number;
};

type StatusKey = 'draft' | 'published';

type CreateEventPayload = {
  title: string;
  description: string;
  category: Exclude<CategoryId, 'all'>;
  date: string;
  imageUrl: string;
  venueId: string;
  status: StatusKey;
  sections: Row[];
};

function priceToColor(price: number, min: number, max: number): string {
  if (!isFinite(price)) return '#94A3B8';
  const t = Math.max(0, Math.min(1, (price - min) / Math.max(1, max - min)));
  const hue = 240 - t * 220;
  return `oklch(0.70 0.18 ${hue.toFixed(1)})`;
}

export default function CreateEventPage() {
  return (
    <RequireRole roles={['organizer']}>
      <Suspense fallback={null}>
        <CreateEventInner />
      </Suspense>
    </RequireRole>
  );
}

/** Response shape from GET /events/:id */
type EventDetail = {
  event: {
    id: string;
    title: string;
    description: string;
    dateTime: string;
    capacity: number;
    category?: { id: string; name: string } | null;
    venue?: { id: string; name: string } | null;
    tickets?: { id: string; type: string; price: number; quantity: number }[];
  };
};

function CreateEventInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit') || null;
  const isEditMode = !!editId;

  const { addEvent, organizerEvents } = useEventsStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-07-18');
  const [time, setTime] = useState('20:30');
  const [category, setCategory] = useState<Exclude<CategoryId, 'all'>>('concerts');
  const [imageUrl, setImageUrl] = useState('');
  const [venueId, setVenueId] = useState(VENUES[0].id);
  const [status, setStatus] = useState<StatusKey>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(isEditMode);

  const venue = VENUES.find((v) => v.id === venueId) || VENUES[0];
  const archetype = venue.archetype;
  const templateSections = ARCHETYPES[archetype].sections;

  const [rows, setRows] = useState<Row[]>(() =>
    templateSections.map((s) => ({ id: s.id, name: s.name, tier: s.tier, price: s.price, capacity: s.capacity })),
  );

  // ── Fetch existing event when in edit mode ───────────────────
  const [venueLoaded, setVenueLoaded] = useState(false);

  /** Populates form fields from any event-like object (API or local store). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const populateForm = (ev: any) => {
    setTitle(ev.title || '');
    setDescription(ev.description || '');
    const dtStr = ev.dateTime || ev.date;
    if (dtStr) {
      const dt = new Date(dtStr);
      if (!isNaN(dt.getTime())) {
        setDate(dt.toISOString().slice(0, 10));
        setTime(dt.toISOString().slice(11, 16));
      }
    }
    // Category — from API object or local store string
    const catId = ev.category?.id ?? ev.category;
    if (catId) {
      const match = CATEGORIES.find(
        (c) => c.id === catId || c.label.toLowerCase() === (ev.category?.name ?? '').toLowerCase(),
      );
      if (match && match.id !== 'all') setCategory(match.id as Exclude<CategoryId, 'all'>);
    }
    // Venue — from API object or local store string
    const vId = ev.venue?.id ?? ev.venueId;
    const vName = ev.venue?.name ?? ev.venue;
    if (vId || vName) {
      const vMatch = VENUES.find((v) => v.id === vId || v.name === vName);
      if (vMatch) {
        setVenueId(vMatch.id);
        setVenueLoaded(true);
      }
    }
    setStatus('published');
  };

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      setLoadingEvent(true);

      // 1) Try the real API first
      const res = await apiGet<EventDetail>(`/events/${editId}`);
      if (cancelled) return;

      if (res.ok) {
        const ev = res.data?.event ?? res.data;
        populateForm(ev);
        setLoadingEvent(false);
        return;
      }

      // 2) Fallback: look up the event in the local store (works offline / with seed IDs)
      const local = organizerEvents.find((e) => e.id === editId);
      if (local) {
        populateForm(local);
        setLoadingEvent(false);
        return;
      }

      // 3) Neither source had it — show a useful error
      const f = toFailure(res);
      if (f.type === 'network_error') {
        setError('Backend is offline and event not found in local data.');
      } else if (f.type === 'unauthorized') {
        setError('Session expired. Please log in again.');
      } else {
        setError(`Failed to load event: ${f.type === 'server_error' ? f.message : 'Event not found'}`);
      }
      setLoadingEvent(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Only reset sections from venue template when the user manually changes the venue,
  // NOT when we loaded the venue from the existing event.
  useEffect(() => {
    if (venueLoaded) {
      setVenueLoaded(false);
      return;
    }
    setRows(
      ARCHETYPES[archetype].sections.map((s) => ({
        id: s.id,
        name: s.name,
        tier: s.tier,
        price: s.price,
        capacity: s.capacity,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, archetype]);

  const priceRange = useMemo(() => {
    const ps = rows.map((r) => Number(r.price) || 0);
    return { min: Math.min(...ps), max: Math.max(...ps) };
  }, [rows]);

  const tintedArchetype: Archetype = useMemo(() => {
    const base = ARCHETYPES[archetype];
    return {
      ...base,
      sections: base.sections.map((s) => {
        const row = rows.find((r) => r.id === s.id);
        return {
          ...s,
          tint: priceToColor(Number(row?.price) || 0, priceRange.min, priceRange.max),
        };
      }),
    };
  }, [archetype, rows, priceRange]);

  const totalCapacity = rows.reduce((a, r) => a + (Number(r.capacity) || 0), 0);
  const projectedRevenue = rows.reduce((a, r) => a + (Number(r.capacity) || 0) * (Number(r.price) || 0), 0);

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const canSubmit = title.trim().length > 2 && !!date && !!time && !!venueId && rows.every((r) => r.price > 0 && r.capacity > 0);

  const handleCancel = () => router.push('/dashboard');

  /**
   * POST /events (create) or PUT /events/:id (edit).
   */
  const handleSave = async (s: StatusKey) => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const payload: CreateEventPayload = {
      title: title.trim(),
      description,
      category,
      date: `${date}T${time}:00`,
      imageUrl,
      venueId,
      status: s,
      sections: rows,
    };

    // Build the body the backend expects for PUT /events/:id
    // Zod datetime() requires ISO 8601 with timezone — append Z for UTC
    const isoDateTime = `${date}T${time}:00.000Z`;
    const apiBody = {
      title: payload.title,
      description: payload.description,
      dateTime: isoDateTime,
      capacity: totalCapacity,
      venueId: payload.venueId,
    };

    const result = isEditMode
      ? await apiPut<{ id: string }>(`/events/${editId}`, apiBody)
      : await apiPost<{ id: string }, CreateEventPayload>('/events', payload);

    if (!isEditMode) {
      addEvent(payload);
    }

    if (!result.ok) {
      const failure = toFailure(result);
      if (failure.type === 'network_error') {
        router.push('/dashboard');
        return;
      }
      if (failure.type === 'validation') {
        setError(failure.errors.message || 'Please review the form fields.');
      } else if (failure.type === 'unauthorized') {
        setError('You are not authorized to modify events.');
      } else if (failure.type === 'server_error') {
        setError(failure.message);
      } else {
        setError(isEditMode ? 'Failed to update event.' : 'Failed to save event.');
      }
      setSubmitting(false);
      return;
    }

    router.push('/dashboard');
  };

  if (loadingEvent) {
    return (
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-6 w-96 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 md:px-10 py-8">
      <button
        onClick={handleCancel}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-5"
      >
        <IconChevronLeft size={14} /> Back to dashboard
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
            {isEditMode ? 'Edit event' : 'New event'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isEditMode ? 'Edit event' : 'Create event'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isEditMode
              ? 'Update event details, venue, and section pricing.'
              : 'Fill in basic info, pick a venue template, set pricing per section.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          {!isEditMode && (
            <Button variant="secondary" onClick={() => handleSave('draft')} disabled={submitting}>Save draft</Button>
          )}
          <Button variant="primary" disabled={!canSubmit || submitting} onClick={() => handleSave(status)} leftIcon={<IconCheck size={16} />}>
            {submitting ? 'Saving…' : isEditMode ? 'Update event' : status === 'published' ? 'Publish event' : 'Save as draft'}
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">
          {error}
        </div>
      )}

      <FormSection number="01" title="Basic info" subtitle="How the event appears to attendees.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Event title" required>
            <Input placeholder="e.g. Solstice — Live at Volkan Arena" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Category" required>
            <SelectBox
              value={category}
              onChange={(v) => setCategory(v as Exclude<CategoryId, 'all'>)}
              options={CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({ value: c.id, label: c.label }))}
            />
          </Field>
          <Field label="Date" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} leftIcon={<IconCalendar size={14} />} />
          </Field>
          <Field label="Start time" required>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} leftIcon={<IconClock size={14} />} />
          </Field>
          <Field label="Cover image URL" className="md:col-span-2">
            <Input placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              Leave blank to auto-generate a gradient cover from the category.
            </p>
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Tell attendees what to expect. Markdown is supported."
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono">B · I · LINK · LIST</span>
              <span>·</span>
              <span>{description.length} characters</span>
            </div>
          </Field>
        </div>
      </FormSection>

      <FormSection number="02" title="Venue & seat map" subtitle="Pick a venue template, then set pricing per section.">
        <Field label="Venue" required>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {VENUES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVenueId(v.id)}
                className={cx(
                  'text-left rounded-lg border p-4 transition-colors',
                  venueId === v.id
                    ? 'border-brand-500 ring-4 ring-brand-500/10 bg-brand-50/50 dark:bg-brand-500/5'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{v.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{v.city}</div>
                  </div>
                  <Badge tone="outline" className="capitalize font-mono text-[10px]">{v.archetype}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>{fmtInt(v.capacity)} seats</span>
                  <span>·</span>
                  <span>{v.rows}</span>
                </div>
              </button>
            ))}
          </div>
        </Field>

        <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Live preview · {venue.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: priceToColor(priceRange.min, priceRange.min, priceRange.max) }} />
                ${priceRange.min || 0}
              </span>
              <span>→</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: priceToColor(priceRange.max, priceRange.min, priceRange.max) }} />
                ${priceRange.max || 0}
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 p-4">
            <TintedSeatMap archetype={tintedArchetype} />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Section pricing</h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Auto-populated from venue template · editable
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2.5 font-medium w-8"></th>
                  <th className="px-4 py-2.5 font-medium">Section</th>
                  <th className="px-4 py-2.5 font-medium w-[140px]">Price</th>
                  <th className="px-4 py-2.5 font-medium w-[140px]">Capacity</th>
                  <th className="px-4 py-2.5 font-medium w-[140px]">Max revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => {
                  const color = priceToColor(Number(r.price) || 0, priceRange.min, priceRange.max);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-2.5">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 font-medium focus:ring-0 rounded px-1 -mx-1 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800"
                          value={r.name}
                          onChange={(e) => updateRow(r.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1 h-9 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
                          <span className="text-slate-400 text-sm">$</span>
                          <input
                            type="number"
                            min={0}
                            className="flex-1 min-w-0 bg-transparent outline-none text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
                            value={r.price}
                            onChange={(e) => updateRow(r.id, { price: Number(e.target.value) })}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1 h-9 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
                          <input
                            type="number"
                            min={0}
                            className="flex-1 min-w-0 bg-transparent outline-none text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
                            value={r.capacity}
                            onChange={(e) => updateRow(r.id, { capacity: Number(e.target.value) })}
                          />
                          <span className="text-slate-400 text-[11px]">seats</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {fmtMoney((Number(r.capacity) || 0) * (Number(r.price) || 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-800">
                <tr>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Totals</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">{fmtInt(totalCapacity)} seats</td>
                  <td className="px-4 py-3 text-sm font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">{fmtMoney(projectedRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </FormSection>

      <FormSection number="03" title="Publish" subtitle="Save as a draft or go live immediately." last>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {(['draft', 'published'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setStatus(k)}
                    className={cx(
                      'h-9 px-4 rounded-md text-sm font-medium capitalize transition-colors',
                      status === k
                        ? k === 'published'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {status === 'published'
                  ? 'Event goes live immediately. Attendees can book.'
                  : 'Save without listing. You can publish later from the dashboard.'}
              </div>
            </div>
            <Button variant="primary" disabled={!canSubmit || submitting} onClick={() => handleSave(status)} leftIcon={<IconCheck size={16} />}>
              {status === 'published' ? 'Publish event' : 'Save draft'}
            </Button>
          </div>
        </div>
      </FormSection>
    </div>
  );
}

const FormSection = ({
  number,
  title,
  subtitle,
  children,
  last,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  last?: boolean;
}) => (
  <section
    className={cx(
      'grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-10 py-8',
      !last && 'border-b border-slate-200 dark:border-slate-800',
    )}
  >
    <div>
      <div className="text-[11px] font-mono tracking-[0.2em] text-brand-500 mb-1">{number}</div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
    <div>{children}</div>
  </section>
);

const Field = ({
  label,
  required,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) => (
  <label className={cx('block', className)}>
    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </div>
    {children}
  </label>
);

const SelectBox = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
      <IconChevronDown size={14} />
    </div>
  </div>
);

const TintedSeatMap = ({ archetype }: { archetype: Archetype }) => (
  <div className="relative w-full">
    <svg viewBox={archetype.viewBox} className="w-full h-auto select-none" role="img">
      <defs>
        <radialGradient id="prev-light" cx="50%" cy="90%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width="100%" height="100%" className="fill-slate-50 dark:fill-slate-900" />
      <rect x={0} y={0} width="100%" height="100%" fill="url(#prev-light)" />
      {archetype.sections.map((s: SeatSection) => (
        <g key={s.id} style={{ color: s.tint }}>
          <path d={s.path} fill={s.tint} fillOpacity={0.85} stroke="rgba(15,23,42,0.25)" strokeWidth={1} />
        </g>
      ))}
      {archetype.stage?.type === 'rect' && (
        <g>
          <rect
            x={archetype.stage.x}
            y={archetype.stage.y}
            width={archetype.stage.w}
            height={archetype.stage.h}
            rx={4}
            className="fill-slate-900 dark:fill-white"
          />
          <text
            x={archetype.stage.x + archetype.stage.w / 2}
            y={archetype.stage.y + archetype.stage.h / 2 + 4}
            className="fill-white dark:fill-slate-900"
            fontSize={11}
            fontWeight={700}
            textAnchor="middle"
            letterSpacing={2}
          >
            {archetype.stage.label}
          </text>
        </g>
      )}
    </svg>
  </div>
);
