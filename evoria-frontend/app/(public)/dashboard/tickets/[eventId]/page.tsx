'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Badge, Card, Input, cx } from '@/components/ui';
import {
  IconChevronLeft, IconPlus, IconTicket, IconCheck, IconX, IconTrash,
} from '@/components/icons';
import { RequireRole } from '@/components/auth-guards';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

type TicketType = 'GENERAL' | 'VIP' | 'EARLY_BIRD';

type Ticket = {
  id: string;
  type: TicketType;
  price: number;
  quantity: number;
  eventId: string;
  _count?: { bookings: number };
};

type EventInfo = {
  event: {
    id: string;
    title: string;
  };
};

type TicketsResponse = { tickets: Ticket[] };

const TICKET_TYPES: TicketType[] = ['GENERAL', 'VIP', 'EARLY_BIRD'];

const typeTone: Record<TicketType, 'neutral' | 'accent' | 'warn'> = {
  GENERAL: 'neutral',
  VIP: 'accent',
  EARLY_BIRD: 'warn',
};

export default function TicketManagementPage() {
  return (
    <RequireRole roles={['organizer']}>
      <TicketManagementInner />
    </RequireRole>
  );
}

function TicketManagementInner() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId ?? '';
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New ticket form
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<TicketType>('GENERAL');
  const [formPrice, setFormPrice] = useState('');
  const [formQty, setFormQty] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');

  const fetchTickets = async () => {
    const res = await apiGet<TicketsResponse>(`/api/tickets/event/${eventId}`);
    if (res.ok) setTickets(res.data.tickets);
    else setError('Failed to load tickets');
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [evRes] = await Promise.all([
        apiGet<EventInfo>(`/api/events/${eventId}`),
        fetchTickets(),
      ]);
      if (evRes.ok) setEventTitle(evRes.data.event.title);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleCreate = async () => {
    setSaving(true);
    const res = await apiPost<{ ticket: Ticket }>('/api/tickets', {
      type: formType,
      price: Number(formPrice),
      quantity: Number(formQty),
      eventId,
    });
    if (res.ok) {
      await fetchTickets();
      setShowForm(false);
      setFormPrice('');
      setFormQty('');
    } else {
      setError('Failed to create ticket');
    }
    setSaving(false);
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    const body: Record<string, number> = {};
    if (editPrice) body.price = Number(editPrice);
    if (editQty) body.quantity = Number(editQty);
    const res = await apiPut<{ ticket: Ticket }>(`/api/tickets/${id}`, body);
    if (res.ok) {
      await fetchTickets();
      setEditId(null);
    } else {
      setError('Failed to update ticket');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const res = await apiDelete(`/api/tickets/${id}`);
    if (res.ok) await fetchTickets();
    else setError('Failed to delete ticket');
  };

  const startEdit = (t: Ticket) => {
    setEditId(t.id);
    setEditPrice(String(t.price));
    setEditQty(String(t.quantity));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 md:px-10 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter mx-auto max-w-4xl px-6 md:px-10 py-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
        >
          <IconChevronLeft size={14} /> Back to dashboard
        </button>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] tracking-[0.18em] font-mono font-semibold text-slate-500 dark:text-slate-400">TICKET MANAGEMENT</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{eventTitle}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tickets.length} ticket type{tickets.length !== 1 ? 's' : ''}</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<IconPlus size={14} />}
            onClick={() => setShowForm(true)}
          >
            Add ticket type
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><IconX size={14} /></button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="p-6 slide-up">
          <div className="text-[11px] tracking-[0.18em] font-mono font-semibold text-slate-500 dark:text-slate-400 mb-4">NEW TICKET TYPE</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <div className="flex gap-1.5 mt-1.5">
                {TICKET_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFormType(t)}
                    className={cx(
                      'px-3 h-8 rounded-md text-xs font-medium transition-colors',
                      formType === t
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
                    )}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Price ($)</Label>
              <Input value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0" type="number" />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input value={formQty} onChange={(e) => setFormQty(e.target.value)} placeholder="100" type="number" />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving || !formPrice || !formQty} leftIcon={<IconCheck size={14} />}>
                {saving ? 'Saving...' : 'Create'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 flex items-center justify-center mb-4">
            <IconTicket size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No ticket types yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Add ticket types (General, VIP, Early Bird) so attendees can book your event.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const booked = t._count?.bookings ?? 0;
            const pct = t.quantity > 0 ? Math.round((booked / t.quantity) * 100) : 0;
            const isEditing = editId === t.id;

            return (
              <Card key={t.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge tone={typeTone[t.type]} className="shrink-0">{t.type.replace('_', ' ')}</Badge>
                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="Price" type="number" className="w-24 h-8" />
                          <Input value={editQty} onChange={(e) => setEditQty(e.target.value)} placeholder="Qty" type="number" className="w-24 h-8" />
                          <Button variant="primary" size="sm" onClick={() => handleUpdate(t.id)} disabled={saving} leftIcon={<IconCheck size={12} />}>Save</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">${t.price}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">{booked} / {t.quantity} sold</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => startEdit(t)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDelete(t.id)}>
                        <IconTrash size={14} />
                      </Button>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={cx('h-full rounded-full transition-[width] duration-500', pct > 90 ? 'bg-red-500' : pct > 60 ? 'bg-accent-500' : 'bg-brand-500')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{pct}% sold · {t.quantity - booked} remaining</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{children}</div>
);
