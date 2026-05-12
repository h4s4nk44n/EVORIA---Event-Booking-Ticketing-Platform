import { ReactNode } from 'react';
import Link from 'next/link';
import { 
  IconCalendar, IconLayoutDashboard, IconMapPin, IconShield, IconTag, IconUsers, IconSettings, IconBell, IconSearch
} from '../../components/icons';
import { cx } from '../../lib/utils';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 grid place-items-center text-white">
              <IconShield size={18} />
            </div>
            <span className="font-bold text-[18px] tracking-tight text-slate-900">EVORIA <span className="text-slate-400 font-medium">Admin</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarLink href="/admin/dashboard" icon={<IconLayoutDashboard size={18} />} label="Dashboard" />
          <SidebarLink href="/admin/events" icon={<IconCalendar size={18} />} label="Events" />
          <SidebarLink href="/admin/users" icon={<IconUsers size={18} />} label="Users" />
          <SidebarLink href="/admin/venues" icon={<IconMapPin size={18} />} label="Venues" />
          <SidebarLink href="/admin/categories" icon={<IconTag size={18} />} label="Categories" />
          
          <div className="pt-4 pb-2 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">System</div>
          <SidebarLink href="/admin/settings" icon={<IconSettings size={18} />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-slate-200 grid place-items-center text-[12px] font-bold text-slate-600">AD</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 truncate">Admin User</div>
              <div className="text-[11px] text-slate-500 truncate">admin@evoria.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex-1 max-w-xl hidden md:flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 bg-slate-50/50 text-[13px]">
            <IconSearch size={16} className="text-slate-400" />
            <input placeholder="Global search…" className="flex-1 bg-transparent outline-none placeholder:text-slate-400" />
            <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">⌘K</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full border border-slate-200 bg-white grid place-items-center text-slate-500 hover:bg-slate-50 transition-colors relative">
              <IconBell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <button className="text-[13px] font-medium text-slate-600 hover:text-slate-900">View Site</button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  // In a real app we would check if current path starts with href
  const active = false; 
  return (
    <Link 
      href={href}
      className={cx(
        "flex items-center gap-3 px-3 h-10 rounded-lg text-[14px] font-medium transition-colors",
        active 
          ? "bg-brand-50 text-brand-600" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cx(active ? "text-brand-600" : "text-slate-400")}>{icon}</span>
      {label}
    </Link>
  );
}
