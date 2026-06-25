'use client';

import { useState } from 'react';
import { formatDate, formatMoney, STATUS_LABELS } from '@/lib/format';
import { useTransactions } from '@/lib/hooks';

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTransactions(page);
  const items = data?.items ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historique des transferts</h1>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-slate-400">Aucun transfert.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Bénéficiaire</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((t) => {
                const s = STATUS_LABELS[t.status];
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{t.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.recipientName}</p>
                      <p className="text-xs text-slate-400">{t.recipientPhone}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(t.sendAmount, t.sendCurrency)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s?.className}`}>
                        {s?.label ?? t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Précédent
          </button>
          <span className="text-sm text-slate-500">
            Page {page} / {totalPages}
          </span>
          <button
            className="btn-ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
