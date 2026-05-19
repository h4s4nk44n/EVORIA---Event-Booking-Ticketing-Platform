'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cx } from '@/lib/utils';
import { IconTicket, IconCalendar, IconInfo } from '@/components/icons';
import { useAuth } from '@/state/auth';
import { apiPost, toFailure } from '@/lib/api';
import { makeDemoJwt, storeToken } from '@/lib/jwt';
import type { Role } from '@/types';
import type { RegisterPayload, RegisterResponse, RegisterRole } from '@/types/auth';

type RegRole = Extract<Role, 'attendee' | 'organizer'>;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<RegRole>('attendee');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!acceptTerms) {
      setError('You must agree to the Terms and Privacy Policy.');
      return;
    }
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email and password are required.');
      return;
    }
    if (password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }

    const payload: RegisterPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role: role as RegisterRole,
    };

    setSubmitting(true);
    const result = await apiPost<RegisterResponse, RegisterPayload>('/auth/register', payload);

    if (!result.ok) {
      const failure = toFailure(result);
      if (failure.type === 'network_error') {
        // Backend unavailable – fall back to local-only signup so the demo works.
        // Also drop a demo JWT cookie so the Edge middleware lets us through.
        storeToken(makeDemoJwt(payload.email, payload.role));
        register({ role: payload.role, name: payload.name, email: payload.email });
        router.replace('/');
        return;
      }
      if (failure.type === 'validation') {
        setFieldErrors(failure.errors.fields);
        setError(failure.errors.message || 'Please review the highlighted fields.');
      } else if (failure.type === 'unauthorized') {
        setError('Registration is closed for this role.');
      } else if (failure.type === 'server_error') {
        setError(failure.message);
      } else {
        setError('Registration failed.');
      }
      setSubmitting(false);
      return;
    }

    // Backend returned a JWT – keep it and mirror locally.
    storeToken(result.data.token);
    register({ role: payload.role, name: payload.name, email: payload.email });
    router.replace('/');
  };

  const fieldError = (key: string): string | null => {
    const v = fieldErrors[key];
    if (!v) return null;
    return Array.isArray(v) ? v[0] : v;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid place-items-center py-10 px-6">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-100">Create your account</h1>
          <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1.5">One account unlocks bookings and (optionally) event management.</p>
        </div>
        <form
          onSubmit={submit}
          aria-label="register-form"
          className="mt-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
        >
          <div>
            <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-2">I&apos;m signing up as</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'attendee',  label: 'Attendee',  desc: 'Book tickets, manage your bookings.',   Icon: IconTicket },
                { id: 'organizer', label: 'Organizer', desc: 'Publish events, track sales & revenue.', Icon: IconCalendar },
              ].map((r) => {
                const on = role === r.id;
                const I = r.Icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as RegRole)}
                    className={cx(
                      'p-3 rounded-lg border text-left transition-colors',
                      on
                        ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cx('w-7 h-7 rounded-md grid place-items-center', on ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500')}>
                        <I size={14} />
                      </div>
                      <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{r.label}</div>
                    </div>
                    <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">{r.desc}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <IconInfo size={12} className="text-slate-400 mt-0.5" />
              Admin accounts are provisioned by the seed script and can&apos;t be self-registered.
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'organizer' ? 'e.g. Lumen Collective' : 'e.g. Selin Demir'}
                className={cx(
                  'w-full h-10 px-3 rounded-md border bg-white dark:bg-slate-900 text-[13.5px] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10',
                  fieldError('name') ? 'border-red-400' : 'border-slate-200 dark:border-slate-700',
                )}
              />
              {fieldError('name') && <p className="mt-1 text-[11px] text-red-600">{fieldError('name')}</p>}
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cx(
                  'w-full h-10 px-3 rounded-md border bg-white dark:bg-slate-900 text-[13.5px] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10',
                  fieldError('email') ? 'border-red-400' : 'border-slate-200 dark:border-slate-700',
                )}
              />
              {fieldError('email') && <p className="mt-1 text-[11px] text-red-600">{fieldError('email')}</p>}
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
                className={cx(
                  'w-full h-10 px-3 rounded-md border bg-white dark:bg-slate-900 text-[13.5px] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10',
                  fieldError('password') ? 'border-red-400' : 'border-slate-200 dark:border-slate-700',
                )}
              />
              {fieldError('password') && <p className="mt-1 text-[11px] text-red-600">{fieldError('password')}</p>}
            </div>
            <label className="flex items-start gap-2 text-[12px] text-slate-600 dark:text-slate-400 pt-1">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>
          </div>

          {error && (
            <div role="alert" className="mt-3 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full h-10 rounded-md bg-slate-900 text-white text-[13.5px] font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : `Create ${role === 'organizer' ? 'Organizer' : 'Attendee'} account`}
          </button>
          <div className="mt-4 text-center text-[12.5px] text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
