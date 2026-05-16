'use client';

import { Fragment, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cx } from '../../lib/utils';
import {
  IconActivity, IconArrowUpDown, IconBell, IconCalendar, IconChevronDown, IconLayoutDashboard,
  IconLogOut, IconMapPin, IconPanelLeft, IconSearch, IconSettings, IconTag, IconUser, IconUsers,
  IconX,
} from '../icons';
import type { AdminRole, AdminVenueLayout } from '../../data/admin';

type NavItem = { id: string; label: string; icon: typeof IconUsers; to: string; end?: boolean };

const ADMIN_NAV: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: IconLayoutDashboard, to: '/admin', end: true },
  { id: 'users',      label: 'Users',      icon: IconUsers,           to: '/admin/users' },
  { id: 'events',     label: 'Events',     icon: IconCalendar,        to: '/admin/events' },
  { id: 'categories', label: 'Categories', icon: IconTag,             to: '/admin/categories' },
  { id: 'venues',     label: 'Venues',     icon: IconMapPin,          to: '/admin/venues' },
];

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/events': 'Events',
  '/admin/categories': 'Categories',
  '/admin/venues': 'Venues',
};

export default function AdminShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname() || '/admin';
  const title = TITLES[pathname] ?? 'Admin';

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-64px)] flex bg-slate-50">
      <AdminSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar crumbs={[{ label: 'Admin' }, { label: title }]} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex-1 p-6 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

const AdminSidebar = ({ collapsed, onToggleCollapse }: { collapsed: boolean; onToggleCollapse: () => void }) => {
  const pathname = usePathname() || '/admin';
  return (
    <aside
      className={cx(
        'shrink-0 flex flex-col bg-slate-900 text-slate-100 transition-[width] duration-200 border-r border-slate-900',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
      style={{ minHeight: '100%' }}
    >
      <div className={cx('h-11 flex items-center border-b border-slate-800', collapsed ? 'justify-center' : 'px-4')}>
        {!collapsed && <div className="text-[10px] font-mono tracking-[0.22em] text-slate-400 uppercase">Admin</div>}
        <button
          onClick={onToggleCollapse}
          className={cx('w-7 h-7 rounded-md grid place-items-center text-slate-400 hover:bg-slate-800 hover:text-white', collapsed ? '' : 'ml-auto')}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <IconPanelLeft size={14} />
        </button>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {ADMIN_NAV.map((item) => {
          const I = item.icon;
          const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.id}
              href={item.to}
              title={collapsed ? item.label : undefined}
              className={cx(
                'w-full group flex items-center gap-3 rounded-md text-[13.5px] font-medium transition-colors relative',
                collapsed ? 'justify-center h-10 px-0' : 'h-9 px-3',
                isActive
                  ? 'bg-brand-500 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.4),_inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <I size={17} stroke={1.75} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={cx('border-t border-slate-800', collapsed ? 'p-2' : 'p-3')}>
        {!collapsed ? (
          <div className="rounded-md bg-slate-800/60 border border-slate-800 px-3 py-2.5">
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              SYSTEM OK
            </div>
            <div className="mt-1 text-[11px] text-slate-500">v2.4.1 · 12ms p50</div>
          </div>
        ) : (
          <div className="grid place-items-center h-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </div>
        )}
      </div>
    </aside>
  );
};

const AdminTopbar = ({
  crumbs, onToggleSidebar,
}: {
  crumbs: { label: string; to?: string }[];
  onToggleSidebar: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center px-5 gap-3">
      <button onClick={onToggleSidebar} className="w-8 h-8 rounded-md grid place-items-center text-slate-500 hover:bg-slate-100 hover:text-slate-900" title="Toggle sidebar">
        <IconPanelLeft size={17} />
      </button>

      <nav className="flex items-center gap-1.5 text-[13px] text-slate-500">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 && <span className="text-slate-300">/</span>}
              {last || !c.to ? (
                <span className={cx(last ? 'text-slate-900 font-medium' : '')}>{c.label}</span>
              ) : (
                <Link href={c.to} className="hover:text-slate-900 cursor-pointer">{c.label}</Link>
              )}
            </Fragment>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 h-8 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-[12.5px] text-slate-500 w-[260px]">
          <IconSearch size={14} />
          <span>Search users, events, venues…</span>
          <span className="ml-auto text-[10.5px] font-mono tracking-wider text-slate-400 border border-slate-200 rounded px-1 py-[1px] bg-white">⌘K</span>
        </div>
        <button className="w-8 h-8 rounded-md grid place-items-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 relative">
          <IconBell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-500" />
        </button>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 h-8 rounded-md hover:bg-slate-100"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 grid place-items-center text-white text-[11px] font-semibold">KY</div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-[12px] font-medium text-slate-900">Kaan Yılmaz</span>
              <span className="text-[10px] text-slate-500">Super Admin</span>
            </div>
            <IconChevronDown size={13} className="text-slate-400" />
          </button>
          {open && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-60 rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-900/5 py-1 z-40 slide-up">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-[12.5px] font-semibold text-slate-900">Kaan Yılmaz</div>
                <div className="text-[11.5px] text-slate-500 truncate">kaan.y@icloud.com</div>
              </div>
              <MenuItem icon={<IconUser size={15} />} label="Profile" />
              <MenuItem icon={<IconSettings size={15} />} label="Admin settings" />
              <MenuItem icon={<IconActivity size={15} />} label="Audit log" />
              <div className="border-t border-slate-100 my-1" />
              <MenuItem icon={<IconLogOut size={15} />} label="Log out" tone="danger" onClick={() => router.push('/login')} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export const MenuItem = ({
  icon, label, tone, onClick,
}: {
  icon: ReactNode; label: string; tone?: 'danger'; onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={cx(
      'w-full flex items-center gap-2.5 px-3 h-8 text-[12.5px]',
      tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
    )}
  >
    <span className="text-slate-400">{icon}</span>
    {label}
  </button>
);

export const Dialog = ({
  open, onClose, children, width = 460,
}: {
  open: boolean; onClose: () => void; children: ReactNode; width?: number;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 animate-[slideUp_.2s_ease-out]">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-xl shadow-2xl shadow-slate-900/20 border border-slate-200 overflow-hidden"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({
  icon, title, subtitle, tone = 'default', onClose,
}: {
  icon?: ReactNode; title: string; subtitle?: string; tone?: 'default' | 'danger'; onClose: () => void;
}) => (
  <div className="flex items-start gap-3 p-5 border-b border-slate-100">
    {icon && (
      <div className={cx(
        'w-10 h-10 rounded-full grid place-items-center shrink-0',
        tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600',
      )}>
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="text-[15px] font-semibold text-slate-900">{title}</div>
      {subtitle && <div className="text-[13px] text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
    <button className="w-7 h-7 grid place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900" onClick={onClose}>
      <IconX size={15} />
    </button>
  </div>
);

export const DialogFooter = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
    {children}
  </div>
);

export const Table = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
    <table className="w-full text-[13px]">{children}</table>
  </div>
);

export const Th = ({
  children, sortable, className = '', w,
}: {
  children?: ReactNode; sortable?: boolean; className?: string; w?: string;
}) => (
  <th
    className={cx(
      'text-left px-4 py-2.5 font-medium text-[11.5px] uppercase tracking-[0.06em] text-slate-500 bg-slate-50/80 border-b border-slate-200',
      className,
    )}
    style={w ? { width: w } : undefined}
  >
    <div className="inline-flex items-center gap-1">
      {children}
      {sortable && <IconArrowUpDown size={11} className="text-slate-400" />}
    </div>
  </th>
);

export const Td = ({ children, className = '', w }: { children?: ReactNode; className?: string; w?: string }) => (
  <td className={cx('px-4 py-3 align-middle border-b border-slate-100 text-slate-700', className)} style={w ? { width: w } : undefined}>
    {children}
  </td>
);

export const Tr = ({ children, className = '' }: { children?: ReactNode; className?: string }) => (
  <tr className={cx('hover:bg-slate-50/60 transition-colors group', className)}>{children}</tr>
);

export const PageHeader = ({
  title, subtitle, actions,
}: {
  title: string; subtitle?: string; actions?: ReactNode;
}) => (
  <div className="flex items-end justify-between gap-4 mb-5">
    <div>
      <h1 className="text-[22px] font-bold text-slate-900 leading-tight tracking-tight">{title}</h1>
      {subtitle && <div className="text-[13px] text-slate-500 mt-1">{subtitle}</div>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const RoleBadge = ({ role }: { role: AdminRole }) => {
  const map: Record<AdminRole, string> = {
    Admin:     'bg-accent-50 text-accent-600 ring-accent-500/20',
    Organizer: 'bg-brand-50 text-brand-700 ring-brand-500/20',
    Attendee:  'bg-slate-100 text-slate-600 ring-slate-300/40',
  };
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', map[role])}>
      <span className={cx(
        'w-1.5 h-1.5 rounded-full',
        role === 'Admin' ? 'bg-accent-500' : role === 'Organizer' ? 'bg-brand-500' : 'bg-slate-400',
      )} />
      {role}
    </span>
  );
};

export const LayoutBadge = ({ kind }: { kind: AdminVenueLayout }) => {
  const map: Record<AdminVenueLayout, string> = {
    Stadium:    'bg-emerald-50 text-emerald-700 ring-emerald-500/20',
    Theater:    'bg-violet-50 text-violet-700 ring-violet-500/20',
    Conference: 'bg-sky-50 text-sky-700 ring-sky-500/20',
    'Open-Air': 'bg-amber-50 text-amber-700 ring-amber-500/20',
  };
  return (
    <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', map[kind])}>
      {kind}
    </span>
  );
};

export const IconBtn = ({
  icon, onClick, tone = 'default', label,
}: {
  icon: ReactNode; onClick?: () => void; tone?: 'default' | 'danger'; label?: string;
}) => (
  <button
    onClick={onClick}
    title={label}
    className={cx(
      'w-7 h-7 grid place-items-center rounded-md transition-colors',
      tone === 'danger'
        ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900',
    )}
  >
    {icon}
  </button>
);

export const LayoutPreview = ({
  kind, active = false, size = 56,
}: {
  kind: AdminVenueLayout; active?: boolean; size?: number;
}) => {
  const stroke = active ? '#6366F1' : '#64748B';
  const fill = active ? '#EEF2FF' : '#F1F5F9';
  const h = size * 0.72;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 72"
      className={cx('rounded-md border', active ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 bg-slate-50')}
    >
      {kind === 'Stadium' && (
        <g>
          <ellipse cx="50" cy="48" rx="38" ry="18" fill="none" stroke={stroke} strokeWidth="1.5" />
          <ellipse cx="50" cy="48" rx="26" ry="10" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="44" y="44" width="12" height="8" rx="1" fill={stroke} opacity="0.5" />
        </g>
      )}
      {kind === 'Theater' && (
        <g>
          <rect x="30" y="12" width="40" height="6" rx="1" fill={stroke} />
          <path d="M 15 26 L 85 26 L 80 34 L 20 34 Z" fill={fill} stroke={stroke} strokeWidth="1" />
          <path d="M 12 38 L 88 38 L 82 48 L 18 48 Z" fill={fill} stroke={stroke} strokeWidth="1" />
          <path d="M 10 52 L 90 52 L 84 62 L 16 62 Z" fill={fill} stroke={stroke} strokeWidth="1" />
        </g>
      )}
      {kind === 'Conference' && (
        <g>
          <rect x="40" y="10" width="20" height="5" rx="1" fill={stroke} />
          {[20, 28, 36, 44, 52].map((y, i) => (
            <g key={i}>
              {[18, 34, 50, 66].map((x, j) => (
                <rect key={j} x={x + i * 2} y={y + i * 2} width="10" height="3" rx="0.5" fill={fill} stroke={stroke} strokeWidth="0.5" />
              ))}
            </g>
          ))}
        </g>
      )}
      {kind === 'Open-Air' && (
        <g>
          <path d="M 5 58 Q 25 52 50 55 T 95 58" fill="none" stroke={stroke} strokeWidth="1" />
          <path d="M 5 62 Q 25 58 50 60 T 95 62" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="42" y="40" width="16" height="14" fill={fill} stroke={stroke} strokeWidth="1" />
          <circle cx="20" cy="18" r="5" fill={stroke} opacity="0.3" />
          <path d="M 0 70 L 100 70" stroke={stroke} strokeWidth="0.5" />
        </g>
      )}
    </svg>
  );
};
