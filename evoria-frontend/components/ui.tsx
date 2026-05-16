import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/utils';
import { GRADIENTS } from '../data/events';
import type { CategoryId } from '../types';
import { IconClock } from './icons';

export { cx };

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  leftIcon,
  rightIcon,
  ...rest
}: ButtonProps) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-ring disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm rounded-md',
    md: 'h-10 px-4 text-sm rounded-md',
    lg: 'h-12 px-5 text-base rounded-md',
    xl: 'h-14 px-7 text-base rounded-lg',
  };
  const variants: Record<ButtonVariant, string> = {
    primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
    accent:    'bg-accent-500 text-slate-900 hover:bg-accent-600 active:bg-accent-600',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100',
    outline:   'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800',
    ghost:     'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
    danger:    'bg-red-500 text-white hover:bg-red-600',
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};

export type BadgeTone = 'neutral' | 'brand' | 'accent' | 'success' | 'danger' | 'warn' | 'outline';

export const Badge = ({
  tone = 'neutral',
  className = '',
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children?: ReactNode;
}) => {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    brand:   'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-100',
    accent:  'bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-500',
    success: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    danger:  'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    warn:    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    outline: 'border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300',
  };
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export const Input = ({ leftIcon, rightIcon, className = '', ...rest }: InputProps) => (
  <div className={cx(
    'flex items-center gap-2 h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100',
    className,
  )}>
    {leftIcon && <span className="text-slate-400 dark:text-slate-500 shrink-0">{leftIcon}</span>}
    <input className="flex-1 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" {...rest} />
    {rightIcon}
  </div>
);

export const Card = ({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cx('rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800', className)} {...rest}>
    {children}
  </div>
);

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={cx('relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-md', className)}>
    <div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/5"
      style={{ animation: 'shimmer 1.4s ease-in-out infinite' }}
    />
  </div>
);

export const Progress = ({
  value = 0,
  className = '',
  barClassName = 'bg-brand-500',
}: {
  value?: number;
  className?: string;
  barClassName?: string;
}) => (
  <div className={cx('h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden', className)}>
    <div
      className={cx('h-full rounded-full transition-[width] duration-500', barClassName)}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

type GradientCat = Exclude<CategoryId, 'all'>;

export const GradientCover = ({
  cat = 'concerts',
  className = '',
  label,
  compact = false,
  children,
}: {
  cat?: GradientCat;
  className?: string;
  label?: string;
  compact?: boolean;
  children?: ReactNode;
}) => {
  const g = GRADIENTS[cat] || GRADIENTS.concerts;
  const pattern = g.pattern;
  return (
    <div
      className={cx('relative overflow-hidden rounded-lg', className)}
      style={{ background: `linear-gradient(135deg, ${g.a} 0%, ${g.b} 60%, ${g.c} 100%)` }}
    >
      <div
        className="orb-a absolute -top-12 -right-16 w-56 h-56 rounded-full blur-3xl opacity-40"
        style={{ background: `radial-gradient(circle, ${g.c}, transparent 70%)` }}
      />
      <div
        className="orb-b absolute -bottom-16 -left-12 w-64 h-64 rounded-full blur-3xl opacity-40"
        style={{ background: `radial-gradient(circle, ${g.a}, transparent 70%)` }}
      />
      <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay" preserveAspectRatio="none" viewBox="0 0 400 240">
        {pattern === 'waves' && (
          <g stroke="white" strokeWidth="1.5" fill="none" opacity=".55">
            {[...Array(8)].map((_, i) => (
              <path key={i} d={`M 0 ${30 + i * 30} Q 100 ${10 + i * 30} 200 ${30 + i * 30} T 400 ${30 + i * 30}`} />
            ))}
          </g>
        )}
        {pattern === 'sun' && (
          <g stroke="white" strokeWidth="1.5" fill="none" opacity=".55">
            <circle cx="200" cy="240" r="120" />
            <circle cx="200" cy="240" r="80" />
            <circle cx="200" cy="240" r="40" />
            {[...Array(24)].map((_, i) => {
              const a = (i / 24) * Math.PI;
              const r = 160;
              return <line key={i} x1={200 + Math.cos(a) * 40} y1={240 - Math.sin(a) * 40} x2={200 + Math.cos(a) * r} y2={240 - Math.sin(a) * r} />;
            })}
          </g>
        )}
        {pattern === 'grid' && (
          <g stroke="white" strokeWidth="1" fill="none" opacity=".45">
            {[...Array(12)].map((_, i) => <line key={'v' + i} x1={i * 36} y1="0" x2={i * 36} y2="240" />)}
            {[...Array(8)].map((_, i) => <line key={'h' + i} x1="0" y1={i * 36} x2="400" y2={i * 36} />)}
          </g>
        )}
        {pattern === 'stripe' && (
          <g fill="white" opacity=".35">
            {[...Array(10)].map((_, i) => (
              <rect key={i} x={i * 44 - 10} y="0" width="14" height="240" transform={`rotate(18 ${i * 44} 120)`} />
            ))}
          </g>
        )}
        {pattern === 'drape' && (
          <g stroke="white" strokeWidth="1.5" fill="none" opacity=".55">
            {[...Array(12)].map((_, i) => (
              <path key={i} d={`M ${i * 36} 0 Q ${i * 36 + 18} ${80 + (i % 3) * 30} ${i * 36} 240`} />
            ))}
          </g>
        )}
      </svg>
      {label && !compact && (
        <div className="absolute top-3 left-3 text-[11px] tracking-[0.15em] uppercase font-semibold text-white/90 font-mono">
          {label}
        </div>
      )}
      {children}
    </div>
  );
};

export const Countdown = ({
  seconds,
  label = 'Complete booking in',
}: {
  seconds: number;
  label?: string;
}) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const low = seconds < 120;
  return (
    <div className={cx(
      'inline-flex items-center gap-2 rounded-full px-3 h-9 text-sm font-medium border',
      low
        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300'
        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300',
    )}>
      <IconClock size={14} />
      <span className="hidden sm:inline">{label}</span>
      <span className="font-mono tabular-nums">{m}:{s}</span>
    </div>
  );
};
