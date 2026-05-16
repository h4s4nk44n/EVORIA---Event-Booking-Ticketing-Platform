import type { ReactNode } from 'react';
import Navbar from '../../components/Navbar';
import AdminShell from '../../components/admin/shell';
import { RequireRole } from '../../components/auth-guards';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={['admin']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        <div className="flex-1 flex">
          <AdminShell>{children}</AdminShell>
        </div>
      </div>
    </RequireRole>
  );
}
