'use client';

import Link from 'next/link';
import { formatDate, formatMoney, STATUS_LABELS } from '@/lib/format';
import { useTransactions } from '@/lib/hooks';

export default function DashboardHome() {
  const { data, isLoading } = useTransactions(1);
  const txns = data?.items ?? [];
  const completed = txns.filter((t) => t.status === 'COMPLETED');
  const totalSent = completed.reduce((sum, t) => sum + t.sendAmount, 0);

  return (
    <div className="space-y-6">
      {/* Hero CTA */}
      <div className="card flex flex-col items-start justify-between gap-4 bg-gradient-to-br from-brand-700 to-brand-900 text-white sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Envoyez de l&apos;argent</h1>
          <p className="mt-1 text-brand-100">Partout en Afrique, en quelques secondes.</p>
        </div>
        <Link href="/dashboard/send" className="btn bg-white text-brand-700 hover:bg-brand-50">
          Nouveau transfert →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Transferts</p>
          <p className="mt-1 text-2xl font-bold">{data?.meta.total ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Réussis</p>
          <p className="mt-1 text-2xl font-bold">{completed.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Volume envoyé (récent)</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(totalSent, 'XOF')}</p>
        </div>
      </div>

      {/* Recent */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Transferts récents</h2>
          <Link href="/dashboard/history" className="text-sm font-semibold text-brand-700">
            Tout voir
          </Link>
        </div>
        {isLoading ? (
          <p className="text-sm text-slate-400">Chargement…</p>
        ) : txns.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <p>Aucun transfert pour le moment.</p>
            <Link href="/dashboard/send" className="btn-primary mt-4">
              Faire mon premier transfert
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {txns.slice(0, 5).map((t) => {
              const s = STATUS_LABELS[t.status];
              return (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{t.recipientName}</p>
                    <p className="text-xs text-slate-400">
                      {t.reference} · {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMoney(t.sendAmount, t.sendCurrency)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s?.className}`}>
                      {s?.label ?? t.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
