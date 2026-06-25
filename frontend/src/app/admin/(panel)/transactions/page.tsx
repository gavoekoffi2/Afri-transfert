'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/admin';
import { useAdminTransactions } from '@/lib/admin-hooks';
import { formatDate, formatMoney, STATUS_LABELS } from '@/lib/format';
import { TransactionStatus } from '@/lib/types';

const STATUSES: TransactionStatus[] = [
  'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED',
];

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const { data, isLoading } = useAdminTransactions({ page, search: search || undefined, status: status || undefined });

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await adminApi.get('/admin/transactions/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <button onClick={exportCsv} disabled={exporting} className="btn-primary">
          {exporting ? 'Export…' : '⬇ Exporter CSV'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Référence, nom, téléphone…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <select
          className="input max-w-[12rem]"
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">Référence</th>
              <th className="px-5 py-3">Utilisateur</th>
              <th className="px-5 py-3">Corridor</th>
              <th className="px-5 py-3">Montant</th>
              <th className="px-5 py-3">Commission</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Chargement…</td></tr>
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Aucune transaction.</td></tr>
            ) : (
              data?.items.map((t) => {
                const s = STATUS_LABELS[t.status];
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs">{t.reference}</td>
                    <td className="px-5 py-3 text-slate-500">{t.user?.email}</td>
                    <td className="px-5 py-3">
                      {t.senderCountry?.iso2} → {t.recipientCountry?.iso2}
                    </td>
                    <td className="px-5 py-3 font-semibold">{formatMoney(t.sendAmount, t.sendCurrency)}</td>
                    <td className="px-5 py-3 text-slate-500">{formatMoney(t.commissionAmount, t.sendCurrency)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s?.className}`}>
                        {s?.label ?? t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{formatDate(t.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Précédent</button>
          <span className="text-sm text-slate-500">Page {page} / {totalPages}</span>
          <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suivant →</button>
        </div>
      )}
    </div>
  );
}
