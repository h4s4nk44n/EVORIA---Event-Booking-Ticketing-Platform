export const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="28" height="28" viewBox="0 0 28 28">
      <defs>
        <linearGradient id="lg-evoria" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="8" fill="url(#lg-evoria)" />
      <path d="M9 9h10v2.5H11.5v2.25H18v2.5h-6.5V18.5H19V21H9V9Z" fill="white" />
    </svg>
    <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
      EVORIA
      <span className="ml-1.5 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 tracking-wider">·26</span>
    </div>
  </div>
);

export const Footer = () => (
  <footer className="mt-16 border-t border-slate-200 dark:border-slate-800">
    <div className="mx-auto max-w-7xl px-6 md:px-10 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-3"><Logo /></div>
      <div className="font-mono">Discover. Book. Experience.</div>
      <div className="flex items-center gap-5">
        <span>Support</span><span>Organizer tools</span><span>Terms</span><span>EN ▾</span>
      </div>
    </div>
  </footer>
);
