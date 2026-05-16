'use client';

import { IconBtn, PageHeader, Table, Td, Th, Tr } from '../../../components/admin/shell';
import { IconEdit, IconPlus, IconTag, IconTrash } from '../../../components/icons';
import { ADMIN_CATEGORIES } from '../../../data/admin';

export default function AdminCategoriesPage() {
  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Top-level content taxonomy. Keep it short — fewer, clearer categories perform better."
        actions={
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] rounded-md bg-slate-900 text-white hover:bg-slate-800">
            <IconPlus size={13} /> Add category
          </button>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th w="22%">Name</Th>
            <Th w="50%">Description</Th>
            <Th w="16%" className="text-right">Events</Th>
            <Th w="12%" className="text-right"><span className="sr-only">Actions</span></Th>
          </tr>
        </thead>
        <tbody>
          {ADMIN_CATEGORIES.map((c) => (
            <Tr key={c.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-violet-50 border border-violet-200/70 grid place-items-center text-violet-600">
                    <IconTag size={13} />
                  </div>
                  <div className="font-medium text-slate-900">{c.name}</div>
                </div>
              </Td>
              <Td className="text-slate-600">{c.description}</Td>
              <Td className="text-right">
                <span className="inline-flex items-center justify-center min-w-[32px] h-6 px-2 rounded-full bg-slate-100 text-[12px] font-mono tabular-nums text-slate-700">
                  {c.events}
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
    </div>
  );
}
