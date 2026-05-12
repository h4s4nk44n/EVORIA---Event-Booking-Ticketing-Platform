import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
export const fmtDateLong = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};
export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};
export const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');
export const fmtInt = (n: number) => n.toLocaleString('en-US');
export const fmtDateShort = (iso: string) => {
  const d = new Date(iso);
  return {
    d: d.getDate(),
    m: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    y: d.getFullYear(),
  };
};
