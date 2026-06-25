'use client';

import { useState } from 'react';
import { useAdminUsers, useUpdateUserStatus } from '@/lib/admin-hooks';
import { formatDate } from '@/lib/format';

const STATUS_OPTIONS = ['ACTIVE', 'PENDING', 'SUSPENDED', 'BLOCKED'];
const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading } = useAdminUsers({ page, search: search || undefined, status: status || undefined });
  const updateStatus = useUpdateUserStatus();

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Rechercher (email, nom)…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="input max-w-[12rem]"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">Utilisateur</th>
              <th className="px-5 py-3">Pays</th>
              <th className="px-5 py-3">Transferts</th>
              <th className="px-5 py-3">Inscrit le</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Chargement…</td></tr>
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Aucun utilisateur.</td></tr>
            ) : (
              data?.items.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.countryIso2 ?? '—'}</td>
                  <td className="px-5 py-3">{u._count?.transactions ?? 0}</td>
                  <td className="px-5 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                      value={u.status}
                      disabled={updateStatus.isPending}
                      onChange={(e) => updateStatus.mutate({ id: u.id, status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <button className="btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Précédent</button>
      <span className="text-sm text-slate-500">Page {page} / {totalPages}</span>
      <button className="btn-ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Suivant →</button>
    </div>
  );
}
