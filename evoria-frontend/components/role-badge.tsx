import { cx } from '../lib/utils';

export const RoleBadge = ({ role }: { role: string }) => {
  const tones: Record<string, string> = {
    Admin:     'bg-accent-50 text-accent-600 ring-accent-500/20',
    Organizer: 'bg-brand-50 text-brand-700 ring-brand-500/20',
    Attendee:  'bg-slate-100 text-slate-700 ring-slate-300/60',
  };
  const tone = tones[role] || tones.Attendee;
  return (
    <span className={cx('inline-flex items-center h-5 px-2 rounded-full text-[10.5px] font-semibold ring-1', tone)}>
      {role}
    </span>
  );
};
