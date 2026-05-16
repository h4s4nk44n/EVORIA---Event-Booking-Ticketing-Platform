'use client';

import { type ReactNode } from 'react';
import { cx } from '../../lib/utils';
import { PageHeader } from '../../components/admin/shell';
import {
  IconAlertTriangle, IconCalendar, IconChevronDown, IconDownload, IconShield,
  IconTag, IconTicket, IconTrash, IconTrendingDown, IconTrendingUp, IconUser, IconUsers,
} from '../../components/icons';
import { ADMIN_ACTIVITY, ADMIN_EVENTS_LIST, SPARK, type AdminActivityKind } from '../../data/admin';

export default function AdminDashboardPage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const bars = [420, 512, 488, 602, 655, 640, 712];
  const maxB = Math.max(...bars);
  const topEvents = ADMIN_EVENTS_LIST
    .map((e) => ({ ...e, pct: Math.round((e.sold / e.capacity) * 100) }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Platform-wide overview · last 7 days"
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
              <IconCalendar size={13} /> Last 7 days <IconChevronDown size={12} />
            </button>
            <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] rounded-md bg-slate-900 text-white hover:bg-slate-800">
              <IconDownload size={13} /> Export
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard label="Total Users"       value="4,218"  delta="+12.4%" trendUp data={SPARK.users}      color="#6366F1" icon={<IconUsers size={13} />} />
        <AdminStatCard label="Total Events"      value="77"     delta="+8.2%"  trendUp data={SPARK.events}     color="#14B8A6" icon={<IconCalendar size={13} />} />
        <AdminStatCard label="Total Bookings"    value="12,840" delta="+18.0%" trendUp data={SPARK.bookings}   color="#F59E0B" icon={<IconTicket size={13} />} />
        <AdminStatCard label="Active Organizers" value="21"     delta="-1.4%"  trendUp={false} data={SPARK.organizers} color="#EC4899" icon={<IconShield size={13} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[14px] font-semibold text-slate-900">Bookings, by day</div>
              <div className="text-[12px] text-slate-500 mt-0.5">Total 4,029 tickets issued this week</div>
            </div>
            <div className="flex items-center gap-1 text-[11.5px]">
              <button className="px-2 h-6 rounded bg-slate-900 text-white">Week</button>
              <button className="px-2 h-6 rounded text-slate-600 hover:bg-slate-100">Month</button>
              <button className="px-2 h-6 rounded text-slate-600 hover:bg-slate-100">Year</button>
            </div>
          </div>
          <div className="h-[200px] flex items-end gap-3 pl-8 relative">
            <div className="absolute inset-0 pl-8 pr-0 flex flex-col justify-between text-[10.5px] font-mono text-slate-400">
              {[800, 600, 400, 200, 0].map((v) => (
                <div key={v} className="flex items-center gap-2 -translate-y-1/2 first:translate-y-0 last:-translate-y-full">
                  <span className="absolute -left-0 w-7 text-right">{v}</span>
                  <div className="flex-1 border-t border-dashed border-slate-100" />
                </div>
              ))}
            </div>
            {bars.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                <div className="w-full flex items-end justify-center" style={{ height: '160px' }}>
                  <div
                    className={cx(
                      'w-full max-w-[36px] rounded-t-[4px] transition-all',
                      i === bars.length - 1 ? 'bg-brand-500' : 'bg-brand-500/25 hover:bg-brand-500/50',
                    )}
                    style={{ height: `${(v / maxB) * 100}%` }}
                    title={`${v} bookings`}
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-medium">{days[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold text-slate-900">Recent activity</div>
            <button className="text-[11.5px] font-medium text-brand-600 hover:text-brand-700">View all</button>
          </div>
          <div className="flex-1 space-y-3">
            {ADMIN_ACTIVITY.slice(0, 7).map((a) => (
              <div key={a.id} className="flex gap-2.5 items-start">
                <ActivityPill kind={a.kind} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-slate-700 leading-snug">
                    <span className="font-medium text-slate-900">{a.who}</span>{' '}
                    <span className="text-slate-500">{a.action}</span>{' '}
                    <span className="font-medium text-slate-800 truncate inline-block max-w-full align-bottom">{a.target}</span>
                  </div>
                  <div className="text-[10.5px] font-mono tracking-wider text-slate-400 mt-0.5">{a.when.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div>
              <div className="text-[14px] font-semibold text-slate-900">Top-selling events</div>
              <div className="text-[12px] text-slate-500 mt-0.5">Ranked by tickets sold this week</div>
            </div>
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {topEvents.map((e, i) => (
                <tr key={e.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-b-0">
                  <td className="px-5 py-3 w-[28px] text-center text-[11px] font-mono text-slate-400 tabular-nums">{String(i + 1).padStart(2, '0')}</td>
                  <td className="py-3">
                    <div className="font-medium text-slate-900 leading-tight">{e.title}</div>
                    <div className="text-[11.5px] text-slate-500">{e.venue} · {e.date}</div>
                  </td>
                  <td className="px-5 py-3 w-[180px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cx('h-full rounded-full', e.pct >= 95 ? 'bg-red-500' : e.pct >= 75 ? 'bg-accent-500' : 'bg-brand-500')}
                          style={{ width: `${e.pct}%` }}
                        />
                      </div>
                      <div className="text-[11.5px] font-mono tabular-nums text-slate-600 w-10 text-right">{e.pct}%</div>
                    </div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5 tabular-nums font-mono">
                      {e.sold.toLocaleString()} / {e.capacity.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-[14px] font-semibold text-slate-900">Revenue</div>
            <div className="text-[12px] text-slate-500 mt-0.5">Gross, this week</div>
            <div className="mt-3 text-[26px] font-bold tabular-nums tracking-tight text-slate-900">₺ 1,284,320</div>
            <div className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-emerald-700 bg-emerald-50 rounded-full px-1.5 py-0.5">
              <IconTrendingUp size={11} /> +22.1% WoW
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                { label: 'Concerts',    pct: 42, color: 'bg-brand-500' },
                { label: 'Sports',      pct: 28, color: 'bg-emerald-500' },
                { label: 'Festivals',   pct: 16, color: 'bg-accent-500' },
                { label: 'Conferences', pct: 9,  color: 'bg-sky-500' },
                { label: 'Theater',     pct: 5,  color: 'bg-violet-500' },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-600">{r.label}</span>
                    <span className="font-mono tabular-nums text-slate-500">{r.pct}%</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div className={cx('h-full rounded-full', r.color)} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-[14px] font-semibold text-slate-900">System health</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { l: 'API p50', v: '12 ms',   s: 'ok' as const },
                { l: 'API p99', v: '180 ms',  s: 'ok' as const },
                { l: 'Errors',  v: '0.02%',   s: 'ok' as const },
                { l: 'Queue',   v: '14 jobs', s: 'warn' as const },
              ].map((m) => (
                <div key={m.l} className="rounded-md border border-slate-200 p-2.5">
                  <div className="text-[10.5px] font-mono tracking-wider text-slate-400 uppercase">{m.l}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cx('w-1.5 h-1.5 rounded-full', m.s === 'ok' ? 'bg-emerald-500' : 'bg-amber-500')} />
                    <span className="text-[13px] font-semibold text-slate-900 tabular-nums">{m.v}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AdminSparkline = ({ data, color = '#6366F1' }: { data: number[]; color?: string }) => {
  const w = 120;
  const h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = `M ${pts[0]} L ${pts.slice(1).join(' L ')}`;
  const area = `${d} L ${w - 2},${h - 2} L 2,${h - 2} Z`;
  const gradId = `sg-${color.replace('#', '')}`;
  const last = pts[pts.length - 1].split(',');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
};

const AdminStatCard = ({
  label, value, delta, trendUp = true, data, color, icon,
}: {
  label: string; value: string; delta: string; trendUp?: boolean; data: number[]; color: string; icon: ReactNode;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2 text-[11.5px] uppercase tracking-[0.08em] font-medium text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <span className={cx('inline-flex items-center gap-0.5 text-[11px] font-medium rounded-full px-1.5 py-0.5', trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
        {trendUp ? <IconTrendingUp size={11} /> : <IconTrendingDown size={11} />}
        {delta}
      </span>
    </div>
    <div className="mt-3 flex items-end justify-between">
      <div className="text-[28px] font-bold text-slate-900 leading-none tabular-nums tracking-tight">{value}</div>
      <AdminSparkline data={data} color={color} />
    </div>
    <div className="mt-1 text-[11.5px] text-slate-500">vs last week</div>
  </div>
);

const ActivityPill = ({ kind }: { kind: AdminActivityKind }) => {
  const map: Record<AdminActivityKind, { bg: string; Icon: typeof IconCalendar }> = {
    event:    { bg: 'bg-brand-50 text-brand-600',       Icon: IconCalendar },
    booking:  { bg: 'bg-emerald-50 text-emerald-600',   Icon: IconTicket },
    category: { bg: 'bg-violet-50 text-violet-600',     Icon: IconTag },
    user:     { bg: 'bg-sky-50 text-sky-600',           Icon: IconUser },
    alert:    { bg: 'bg-amber-50 text-amber-600',       Icon: IconAlertTriangle },
    delete:   { bg: 'bg-red-50 text-red-600',           Icon: IconTrash },
  };
  const { bg, Icon: I } = map[kind];
  return (
    <div className={cx('w-7 h-7 rounded-full grid place-items-center shrink-0', bg)}>
      <I size={13} />
    </div>
  );
};
