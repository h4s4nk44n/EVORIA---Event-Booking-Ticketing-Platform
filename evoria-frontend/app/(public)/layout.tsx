import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/chrome';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
