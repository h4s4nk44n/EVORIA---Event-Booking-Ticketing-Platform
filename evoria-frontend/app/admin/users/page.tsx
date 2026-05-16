'use client';

import { useState } from 'react';
import { cx } from '../../../lib/utils';
import { IconBtn, PageHeader, RoleBadge, Table, Td, Th, Tr } from '../../../components/admin/shell';
import {
  IconChevronLeft, IconChevronRight, IconDownload, IconEdit, IconEye, IconFilter, IconSearch, IconTrash, IconX,
} from '../../../components/icons';
import { ADMIN_USERS, type AdminRole } from '../../../data/admin';

type RoleFilter = 'All' | AdminRole;

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<RoleFilter>('All');
  const rows = ADMIN_USERS.filter(
    (u) =>
      (role === 'All' || u.role === role) &&
      (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${ADMIN_USERS.length.toLocaleString()} registered users · 21 organizers · 3 admins`}
        actions={
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
            <IconDownload size={13} /> Export CSV
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex-1 min-w-[220px] max-w-md flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 bg-white text-[13px] focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
          <IconSearch size={14} className="text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-slate-400 hover:text-slate-700">
              <IconX size={12} />
            </button>
          )}
        </div>
        <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 text-[12px]">
          {(['All', 'Attendee', 'Organizer', 'Admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cx(
                'h-7 px-2.5 rounded-[5px] font-medium',
                role === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
          <IconFilter size={13} /> More filters
        </button>
      </div>

      <Table>
        <thead>
          <tr>
            <Th sortable w="26%">Name</Th>
            <Th sortable w="26%">Email</Th>
            <Th w="14%">Role</Th>
            <Th sortable w="14%">Joined</Th>
            <Th w="12%">Activity</Th>
            <Th w="8%" className="text-right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => {
            const initials = u.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <Tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 grid place-items-center text-[10.5px] font-semibold text-slate-700">
                      {initials}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 leading-tight">{u.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{u.id}</div>
                    </div>
                  </div>
                </Td>
                <Td className="font-mono text-[12px] text-slate-600">{u.email}</Td>
                <Td>
                  <RoleBadge role={u.role} />
                </Td>
                <Td className="text-slate-600 tabular-nums">{u.joined}</Td>
                <Td>
                  <div className="text-[11.5px] text-slate-500">
                    <span className="font-mono tabular-nums text-slate-700">{u.events}</span> events ·{' '}
                    <span className="font-mono tabular-nums text-slate-700">{u.bookings}</span> bookings
                  </div>
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <IconBtn icon={<IconEye size={14} />} label="View" />
                    <IconBtn icon={<IconEdit size={14} />} label="Edit" />
                    <IconBtn icon={<IconTrash size={14} />} tone="danger" label="Delete" />
                  </div>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>

      <div className="flex items-center justify-between mt-3 text-[12px] text-slate-500">
        <div>
          Showing <span className="font-medium text-slate-700">1–{rows.length}</span> of <span className="font-medium text-slate-700">4,218</span> users
        </div>
        <div className="flex items-center gap-1">
          <button className="h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-400 cursor-not-allowed">
            <IconChevronLeft size={13} />
          </button>
          <button className="h-8 w-8 rounded-md bg-slate-900 text-white text-[12px] font-medium">1</button>
          <button className="h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px]">2</button>
          <button className="h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px]">3</button>
          <span className="px-1 text-slate-400">…</span>
          <button className="h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px]">352</button>
          <button className="h-8 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
            <IconChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
