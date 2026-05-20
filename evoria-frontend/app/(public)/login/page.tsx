'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cx } from '@/lib/utils';
import { Logo } from '@/components/chrome';
import { IconEye, IconInfo, IconChevronRight } from '@/components/icons';
import { RoleBadge } from '@/components/role-badge';
import { useAuth } from '@/state/auth';
import { apiPost, toFailure } from '@/lib/api';
import { makeDemoJwt, storeToken } from '@/lib/jwt';
import type { LoginCredentials, LoginResponse } from '@/types/auth';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const { login } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = sp?.get('from') || sp?.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demos = [
    { role: 'Attendee',  email: 'carol@evoria.com', password: 'Carol1234!', hint: 'seeded attendee' },
    { role: 'Organizer', email: 'alice@evoria.com', password: 'Alice1234!', hint: 'seeded organizer' },
    { role: 'Admin',     email: 'admin@evoria.com', password: 'Admin1234!', hint: 'seeded admin' },
  ];

  /**
   * Persists a demo JWT cookie so the Edge middleware lets the user reach
   * role-protected routes (/bookings, /dashboard, /admin) even when the real
   * backend is offline. Maps demo email → expected role.
   */
  function persistDemoSession(demoEmail: string) {
    const role =
      demoEmail === 'alice@evoria.com' ? 'organizer'
      : demoEmail === 'admin@evoria.com' ? 'admin'
      : 'attendee';
    storeToken(makeDemoJwt(demoEmail, role));
  }

  /**
   * Attempts a real /auth/login API call. On success: stores the JWT,
   * mirrors the profile in the local auth state, and redirects.
   * On failure: surfaces the message but still allows the demo-style local
   * login so the rest of the app stays usable without a running backend.
   */
  async function performLogin(creds: LoginCredentials, isDemo = false) {
    setSubmitting(true);
    setError(null);
    const result = await apiPost<LoginResponse, LoginCredentials>('/auth/login', creds);

    if (!result.ok) {
      const failure = toFailure(result);
      // Graceful fallback for demo accounts when the backend is unavailable.
      if (isDemo && failure.type === 'network_error') {
        persistDemoSession(creds.email);
        login(creds.email);
        router.replace(returnTo);
        return;
      }
      if (failure.type === 'validation') {
        setError(failure.errors.message || 'Please check your email and password.');
      } else if (failure.type === 'unauthorized') {
        setError('Invalid email or password.');
      } else if (failure.type === 'server_error') {
        setError(failure.message);
      } else if (failure.type === 'network_error') {
        setError('Network error. Please try again.');
      } else {
        setError('Login failed.');
      }
      setSubmitting(false);
      return;
    }

    storeToken(result.data.token);
    login(creds.email);
    router.replace(returnTo);
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    void performLogin({ email, password });
  };

  const quickLogin = (demo: { email: string; password: string }) => {
    void performLogin({ email: demo.email, password: demo.password }, true);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-slate-50">
      <div className="flex flex-col px-6 py-8 md:px-16 md:py-12">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="text-[12.5px] text-slate-500">
            New here? <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">Create account</Link>
          </div>
        </div>
        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-sm">
            <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-[13.5px] text-slate-500 mt-1.5">
              Log in to book tickets, manage events, or administer the platform — one login for all.
            </p>
            <form className="mt-7 space-y-3" onSubmit={handleSubmit} aria-label="login-form">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-[13.5px] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-medium text-slate-700" htmlFor="password">Password</label>
                  <a className="text-[11.5px] text-brand-600 hover:text-brand-700" href="#">Forgot?</a>
                </div>
                <div className="flex items-center h-10 px-3 rounded-md border border-slate-200 bg-white focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
                  <input
                    id="password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent outline-none text-[13.5px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label="toggle-password-visibility"
                  >
                    <IconEye size={14} />
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[12.5px] text-slate-600 pt-1">
                <input type="checkbox" className="rounded border-slate-300" />
                Remember me for 30 days
              </label>
              {error && (
                <div role="alert" className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-md bg-slate-900 text-white text-[13.5px] font-medium hover:bg-slate-800 mt-1 disabled:opacity-60"
              >
                {submitting ? 'Logging in…' : 'Log in'}
              </button>
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <button
                type="button"
                className="w-full h-10 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[13.5px] font-medium text-slate-700 inline-flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
                Continue with Google
              </button>
            </form>
            <div className="mt-8 rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <IconInfo size={13} className="text-slate-400" />
                <div className="text-[11.5px] font-medium text-slate-700">Demo accounts</div>
                <div className="text-[10.5px] font-mono tracking-wider text-slate-400 ml-auto">TAP TO LOG IN</div>
              </div>
              {demos.map((d, i) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => quickLogin(d)}
                  className={cx(
                    'w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-50',
                    i < demos.length - 1 && 'border-b border-slate-100',
                  )}
                >
                  <RoleBadge role={d.role} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-mono text-slate-700 truncate">{d.email}</div>
                    <div className="text-[10.5px] text-slate-400">{d.hint}</div>
                  </div>
                  <IconChevronRight size={13} className="text-slate-400" />
                </button>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-mono">POST /auth/login</span> returns a signed JWT with{' '}
              <span className="font-mono">role ∈ {'{'}attendee, organizer, admin{'}'}</span>. The UI reads the role claim and renders the navbar accordingly. Admin accounts are seeded — not self-registerable.
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-6">
          © 2026 Evoria · <a href="#" className="hover:text-slate-600">Terms</a> · <a href="#" className="hover:text-slate-600">Privacy</a>
        </div>
      </div>
      <div className="hidden lg:block relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 800px 600px at 20% 20%, #4338CA 0%, transparent 60%), radial-gradient(ellipse 700px 500px at 80% 80%, #F59E0B 0%, transparent 55%), linear-gradient(135deg, #0B1022 0%, #1E1B4B 100%)' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.12] mix-blend-overlay" preserveAspectRatio="none" viewBox="0 0 800 800">
          <g stroke="white" strokeWidth="1" fill="none">
            {[...Array(20)].map((_, i) => <line key={'v' + i} x1={i * 40} y1="0" x2={i * 40} y2="800" />)}
            {[...Array(20)].map((_, i) => <line key={'h' + i} x1="0" y1={i * 40} x2="800" y2={i * 40} />)}
          </g>
        </svg>
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <div className="text-[11px] font-mono tracking-[0.22em] text-white/60">EVORIA · EVENT PLATFORM</div>
          <div className="max-w-md">
            <div className="text-[42px] font-bold leading-[1.05] tracking-tight">
              One login.<br />
              Three surfaces.
            </div>
            <p className="mt-4 text-[14px] text-white/70 leading-relaxed">
              Attendees book tickets, organizers run events, admins keep it all honest. The platform knows who you are from your token — the UI adapts on sign-in.
            </p>
            <div className="mt-7 space-y-2.5">
              {[
                { role: 'Attendee',  nav: 'Events · My bookings' },
                { role: 'Organizer', nav: 'Events · My bookings · Dashboard' },
                { role: 'Admin',     nav: 'Events · My bookings · Admin Panel' },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm px-3.5 py-2.5">
                  <RoleBadge role={r.role} />
                  <div className="text-[12.5px] text-white/80 font-mono">{r.nav}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono tracking-wider text-white/40">v2.4.1 — JWT · HS256 · role claim</div>
        </div>
      </div>
    </div>
  );
}
