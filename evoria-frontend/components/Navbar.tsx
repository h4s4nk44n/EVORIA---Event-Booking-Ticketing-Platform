'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cx } from '../lib/utils';
import { Logo } from './chrome';
import { RoleBadge } from './role-badge';
import { IconBell, IconChevronDown, IconLogOut, IconShield, IconTicket, IconUser } from './icons';
import { useAuth } from '../state/auth';
import type { Role } from '../types';

type LinkDef = {
  id: string;
  label: string;
  to: string;
  show: boolean;
  matchPrefix?: string;
  tone?: 'brand' | 'accent';
  Icon?: typeof IconShield;
};

export default function Navbar() {
  const { auth, logout, setRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const role: Role | null = auth?.role ?? null;

  const links: LinkDef[] = ([
    { id: 'events',    label: 'Events',      to: '/',          show: true },
    { id: 'bookings',  label: 'My bookings', to: '/bookings',  show: !!role && role === 'attendee' },
    { id: 'dashboard', label: 'Dashboard',   to: '/dashboard', show: role === 'organizer', tone: 'brand',  matchPrefix: '/dashboard' },
    { id: 'admin',     label: 'Admin Panel', to: '/admin',     show: role === 'admin',     tone: 'accent', matchPrefix: '/admin', Icon: IconShield },
  ] as LinkDef[]).filter((l) => l.show);

  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuOpen]);

  const initials = auth ? auth.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '';
  const roleLabel = auth ? auth.role.charAt(0).toUpperCase() + auth.role.slice(1) : '';

  const isActive = (l: LinkDef) => {
    if (l.matchPrefix) return pathname.startsWith(l.matchPrefix);
    return pathname === l.to;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 md:px-10 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {links.map((l) => {
            const on = isActive(l);
            const isBrand = l.tone === 'brand';
            const isAccent = l.tone === 'accent';
            const I = l.Icon;
            return (
              <Link
                key={l.id}
                href={l.to}
                className={cx(
                  'h-9 px-3 rounded-md text-[13.5px] font-medium inline-flex items-center gap-1.5 transition-colors',
                  on
                    ? isAccent
                      ? 'bg-accent-50 text-accent-600 ring-1 ring-accent-500/20 dark:bg-accent-500/10 dark:text-accent-500'
                      : isBrand
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-100'
                        : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : isAccent
                      ? 'text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-500/10'
                      : isBrand
                        ? 'text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                )}
              >
                {I && <I size={13} />} {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {!role ? (
          <div className="flex items-center gap-2">
            <Link href="/login" className="h-9 px-3.5 rounded-md text-[13.5px] font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 inline-flex items-center">
              Log in
            </Link>
            <Link href="/register" className="h-9 px-3.5 rounded-md text-[13.5px] font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 inline-flex items-center">
              Register
            </Link>
          </div>
        ) : (
          <>
            <button className="relative h-9 w-9 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800" aria-label="Notifications">
              <IconBell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-500" />
            </button>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white text-[12px] font-bold inline-flex items-center justify-center">
                  {initials}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-[12.5px] font-medium text-slate-900 dark:text-slate-100">{auth.name}</span>
                  <span className="text-[10.5px] text-slate-500 capitalize">{roleLabel}</span>
                </div>
                <IconChevronDown size={13} className="text-slate-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-64 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 py-1 z-40 slide-up">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[12.5px] font-semibold text-slate-900 dark:text-slate-100">{auth.name}</div>
                      <RoleBadge role={roleLabel} />
                    </div>
                    <div className="text-[11.5px] font-mono text-slate-500 truncate">{auth.email}</div>
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] uppercase tracking-[0.08em] font-mono text-slate-400 mb-1.5">Switch role (demo)</div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['attendee', 'organizer', 'admin'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            setRole(r);
                            setMenuOpen(false);
                            if (r === 'admin') router.push('/admin');
                            else if (r === 'organizer') router.push('/dashboard');
                            else router.push('/');
                          }}
                          className={cx(
                            'h-7 rounded-md text-[11px] font-medium capitalize',
                            role === r ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      router.push('/bookings');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 h-8 text-[12.5px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-slate-400"><IconTicket size={14} /></span> My bookings
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 h-8 text-[12.5px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="text-slate-400"><IconUser size={14} /></span> Account settings
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 h-8 text-[12.5px] text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <span className="text-red-400"><IconLogOut size={14} /></span>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
