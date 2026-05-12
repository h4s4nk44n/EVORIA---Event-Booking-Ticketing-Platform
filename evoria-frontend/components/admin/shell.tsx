import { type ReactNode } from 'react';
import { cx } from '../../lib/utils';
import { IconChevronDown, IconX } from '../icons';
import { AdminRole, AdminVenueLayout } from '../../data/admin';

// --- Page Header ---
export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-[14px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// --- Table Components ---
export const Table = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx("w-full overflow-hidden border border-slate-200 rounded-lg bg-white", className)}>
    <table className="w-full text-left border-collapse">{children}</table>
  </div>
);

export const Th = ({ children, sortable, w, className }: { children: ReactNode; sortable?: boolean; w?: string; className?: string }) => (
  <th className={cx("px-5 py-3 text-[12px] font-semibold text-slate-500 bg-slate-50/50 border-b border-slate-200", className)} style={{ width: w }}>
    <div className="flex items-center gap-1.5">
      {children}
      {sortable && <IconChevronDown size={12} className="text-slate-400" />}
    </div>
  </th>
);

export const Tr = ({ children, className }: { children: ReactNode; className?: string }) => (
  <tr className={cx("group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0", className)}>{children}</tr>
);

export const Td = ({ children, className }: { children: ReactNode; className?: string }) => (
  <td className={cx("px-5 py-3.5 text-[13px]", className)}>{children}</td>
);

// --- Badges & Icons ---
export const RoleBadge = ({ role }: { role: AdminRole }) => {
  const styles: Record<AdminRole, string> = {
    Admin: "bg-purple-50 text-purple-700 border-purple-200",
    Organizer: "bg-blue-50 text-blue-700 border-blue-200",
    Attendee: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return (
    <span className={cx("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border", styles[role])}>
      {role}
    </span>
  );
};

export const LayoutBadge = ({ kind }: { kind: AdminVenueLayout }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
      {kind}
    </span>
  );
};

export const LayoutPreview = ({ kind, size = 36, active }: { kind: AdminVenueLayout; size?: number; active?: boolean }) => {
  return (
    <div 
      className={cx(
        "rounded-md border flex items-center justify-center shrink-0",
        active ? "bg-brand-500 text-white border-brand-600" : "bg-slate-100 text-slate-400 border-slate-200"
      )}
      style={{ width: size, height: size }}
    >
      <div className="text-[10px] font-bold">{kind[0]}</div>
    </div>
  );
};

export const IconBtn = ({ icon, label, tone = 'default' }: { icon: ReactNode; label: string; tone?: 'default' | 'danger' }) => (
  <button 
    title={label}
    className={cx(
      "w-8 h-8 rounded-md grid place-items-center transition-colors",
      tone === 'danger' ? "text-red-500 hover:bg-red-50" : "text-slate-500 hover:bg-slate-100"
    )}
  >
    {icon}
  </button>
);

// --- Dialog Components ---
export const Dialog = ({ open, onClose, children, width = 480 }: { open: boolean; onClose: () => void; children: ReactNode; width?: number }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div 
        className="relative bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        style={{ width, maxWidth: '100%' }}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({ icon, title, subtitle, onClose }: { icon: ReactNode; title: string; subtitle?: string; onClose: () => void }) => (
  <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 grid place-items-center text-slate-600">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
      <IconX size={18} />
    </button>
  </div>
);

export const DialogFooter = ({ children }: { children: ReactNode }) => (
  <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
    {children}
  </div>
);
