'use client';

import Link from 'next/link';
import { useAdminBalance, useAdminStats } from '@/lib/admin-hooks';
import { formatDate, formatMoney, STATUS_LABELS } from '@/lib/format';

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: balance, isError: balanceError } = useAdminBalance();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Vue d&apos;ensemble</h1>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Utilisateurs" value={stats?.users ?? '—'} icon="👤" />
        <Kpi label="Transactions" value={stats?.transactions ?? '—'} icon="💳" />
        <Kpi
          label="Volume (réussi)"
          value={stats ? formatMoney(stats.totalVolume, 'XOF') : '—'}
          icon="💸"
        />
        <Kpi
          label="Commissions"
          value={stats ? formatMoney(stats.totalCommission, 'XOF') : '—'}
          icon="🏦"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Solde GeniusPay */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">Solde marchand GeniusPay</h2>
          {balanceError ? (
            <p className="mt-4 text-sm text-amber-600">
              Indisponible (clés GeniusPay non configurées ou environnement sandbox).
            </p>
          ) : balance ? (
            <div className="mt-4 space-y-2">
              <p className="text-3xl font-extrabold text-brand-700">
                {formatMoney(balance.available, balance.currency)}
              </p>
              <p className="text-sm text-slate-500">
                En attente : {formatMoney(balance.pending, balance.currency)}
              </p>
              <p className="text-sm text-slate-500">
                Total : {formatMoney(balance.total, balance.currency)}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Chargement…</p>
          )}
        </div>

        {/* Répartition par statut */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-500">Transactions par statut</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {stats?.byStatus?.length ? (
              stats.byStatus.map((s) => {
                const label = STATUS_LABELS[s.status];
                return (
                  <div key={s.status} className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-2xl font-bold text-slate-800">{s.count}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${label?.className}`}>
                      {label?.label ?? s.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">Aucune donnée.</p>
            )}
          </div>
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-lg font-bold">Transactions récentes</h2>
          <Link href="/admin/transactions" className="text-sm font-semibold text-brand-700">
            Tout voir →
          </Link>
        </div>
        {isLoading ? (
          <p className="px-6 pb-6 text-sm text-slate-400">Chargement…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3">Référence</th>
                  <th className="px-6 py-3">Utilisateur</th>
                  <th className="px-6 py-3">Destinataire</th>
                  <th className="px-6 py-3">Montant</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentTransactions?.map((t) => {
                  const s = STATUS_LABELS[t.status];
                  return (
                    <tr key={t.reference} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono text-xs">{t.reference}</td>
                      <td className="px-6 py-3 text-slate-500">{t.user}</td>
                      <td className="px-6 py-3">{t.recipient} · {t.country}</td>
                      <td className="px-6 py-3 font-semibold">{formatMoney(t.amount, t.currency)}</td>
                      <td className="px-6 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s?.className}`}>
                          {s?.label ?? t.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-400">{formatDate(t.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
