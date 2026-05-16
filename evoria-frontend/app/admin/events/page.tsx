'use client';

import { cx } from '../../../lib/utils';
import { IconBtn, PageHeader, Table, Td, Th, Tr } from '../../../components/admin/shell';
import {
  IconCalendar, IconChevronDown, IconDownload, IconEye, IconFilter, IconMapPin, IconSearch, IconTag, IconTrash,
} from '../../../components/icons';
import { ADMIN_EVENTS_LIST } from '../../../data/admin';

export default function AdminEventsPage() {
  return (
    <div>
      <PageHeader
        title="Events"
        subtitle={`${ADMIN_EVENTS_LIST.length} events across all organizers`}
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
              <IconFilter size={13} /> Filters
            </button>
            <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] rounded-md bg-slate-900 text-white hover:bg-slate-800">
              <IconDownload size={13} /> Export
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex-1 min-w-[220px] max-w-md flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 bg-white text-[13px]">
          <IconSearch size={14} className="text-slate-400" />
          <input placeholder="Search events…" className="flex-1 bg-transparent outline-none placeholder:text-slate-400" />
        </div>
        <button className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] rounded-md border border-slate-200 bg-white text-slate-700">
          <IconCalendar size={13} /> All dates <IconChevronDown size={12} />
        </button>
        <button className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] rounded-md border border-slate-200 bg-white text-slate-700">
          <IconTag size={13} /> All categories <IconChevronDown size={12} />
        </button>
      </div>

      <Table>
        <thead>
          <tr>
            <Th sortable w="28%">Title</Th>
            <Th w="20%">Organizer</Th>
            <Th sortable w="12%">Date</Th>
            <Th w="14%">Venue</Th>
            <Th sortable w="18%">Tickets</Th>
            <Th w="8%" className="text-right"><span className="sr-only">Actions</span></Th>
          </tr>
        </thead>
        <tbody>
          {ADMIN_EVENTS_LIST.map((e) => {
            const pct = Math.round((e.sold / e.capacity) * 100);
            return (
              <Tr key={e.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-br from-brand-500/20 to-brand-700/20 border border-brand-500/20 grid place-items-center text-brand-600">
                      <IconCalendar size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 leading-tight truncate">{e.title}</div>
                      <div className="text-[11px] font-mono text-slate-400">{e.id}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="text-slate-900">{e.organizer}</div>
                  <div className="text-[11px] font-mono text-slate-500">{e.orgEmail}</div>
                </Td>
                <Td className="tabular-nums text-slate-600">{e.date}</Td>
                <Td className="text-slate-600">
                  <div className="inline-flex items-center gap-1">
                    <IconMapPin size={12} className="text-slate-400" />
                    {e.venue}
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[120px]">
                      <div
                        className={cx('h-full rounded-full', pct >= 95 ? 'bg-red-500' : pct >= 75 ? 'bg-accent-500' : 'bg-brand-500')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-600 w-10 text-right">{pct}%</div>
                  </div>
                  <div className="text-[10.5px] font-mono text-slate-400 mt-0.5 tabular-nums">
                    {e.sold.toLocaleString()} / {e.capacity.toLocaleString()}
                  </div>
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <IconBtn icon={<IconEye size={14} />} label="View" />
                    <IconBtn icon={<IconTrash size={14} />} tone="danger" label="Delete" />
                  </div>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
