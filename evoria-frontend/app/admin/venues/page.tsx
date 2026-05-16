'use client';

import { useState } from 'react';
import { cx } from '../../../lib/utils';
import {
  Dialog, DialogFooter, DialogHeader, IconBtn, LayoutBadge, LayoutPreview, PageHeader,
  Table, Td, Th, Tr,
} from '../../../components/admin/shell';
import { IconEdit, IconMapPin, IconPlus, IconTrash } from '../../../components/icons';
import { ADMIN_VENUES, type AdminVenueLayout } from '../../../data/admin';

const LAYOUTS: AdminVenueLayout[] = ['Stadium', 'Theater', 'Conference', 'Open-Air'];

export default function AdminVenuesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <div>
      <PageHeader
        title="Venues"
        subtitle={`${ADMIN_VENUES.length} venues across 4 cities`}
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] rounded-md bg-slate-900 text-white hover:bg-slate-800"
          >
            <IconPlus size={13} /> Add venue
          </button>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th sortable w="22%">Name</Th>
            <Th w="22%">Address</Th>
            <Th w="12%">City</Th>
            <Th sortable w="12%" className="text-right">Capacity</Th>
            <Th w="14%">Layout</Th>
            <Th w="10%" className="text-right">Events</Th>
            <Th w="8%" className="text-right"><span className="sr-only">Actions</span></Th>
          </tr>
        </thead>
        <tbody>
          {ADMIN_VENUES.map((v) => (
            <Tr key={v.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <LayoutPreview kind={v.layout} size={36} />
                  <div className="font-medium text-slate-900">{v.name}</div>
                </div>
              </Td>
              <Td className="text-slate-600">{v.address}</Td>
              <Td className="text-slate-600">{v.city}</Td>
              <Td className="text-right font-mono tabular-nums text-slate-700">{v.capacity.toLocaleString()}</Td>
              <Td><LayoutBadge kind={v.layout} /></Td>
              <Td className="text-right">
                <span className="inline-flex items-center justify-center min-w-[32px] h-6 px-2 rounded-full bg-slate-100 text-[12px] font-mono tabular-nums text-slate-700">
                  {v.events}
                </span>
              </Td>
              <Td className="text-right">
                <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <IconBtn icon={<IconEdit size={14} />} label="Edit" />
                  <IconBtn icon={<IconTrash size={14} />} tone="danger" label="Delete" />
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <AddVenueDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

const AddVenueDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [layout, setLayout] = useState<AdminVenueLayout>('Stadium');
  return (
    <Dialog open={open} onClose={onClose} width={540}>
      <DialogHeader
        icon={<IconMapPin size={18} />}
        title="Add venue"
        subtitle="A venue template determines the seat-map layout shown to attendees."
        onClose={onClose}
      />
      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Name</label>
            <input placeholder="e.g. Volkan Arena" className="w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">City</label>
            <input placeholder="e.g. Istanbul" className="w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-slate-700 mb-1">Address</label>
          <input placeholder="Street and number" className="w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-slate-700 mb-1">Capacity</label>
          <input
            type="number"
            placeholder="1200"
            className="w-full h-9 px-3 rounded-md border border-slate-200 text-[13px] font-mono tabular-nums outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-slate-700 mb-2">Layout type</label>
          <div className="grid grid-cols-4 gap-2">
            {LAYOUTS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setLayout(k)}
                className={cx(
                  'flex flex-col items-center gap-1.5 p-2 rounded-md border transition-colors text-left',
                  layout === k
                    ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                )}
              >
                <LayoutPreview kind={k} active={layout === k} size={72} />
                <div className="text-[11.5px] font-medium text-slate-700">{k}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <button onClick={onClose} className="h-9 px-4 text-[13px] rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">Cancel</button>
        <button onClick={onClose} className="h-9 px-4 text-[13px] rounded-md bg-brand-500 text-white hover:bg-brand-600 font-medium">Create venue</button>
      </DialogFooter>
    </Dialog>
  );
};
