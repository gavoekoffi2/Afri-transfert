'use client';

import { useState } from 'react';
import { useAdminWebhooks } from '@/lib/admin-hooks';
import { formatDate } from '@/lib/format';

export default function AdminWebhooksPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminWebhooks(page);
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Webhooks GeniusPay</h1>
        <p className="mt-1 text-sm text-slate-500">
          Journal des événements reçus, avec vérification de signature et statut de traitement.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">Événement</th>
              <th className="px-5 py-3">Signature</th>
              <th className="px-5 py-3">Traité</th>
              <th className="px-5 py-3">Env.</th>
              <th className="px-5 py-3">Reçu le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Chargement…</td></tr>
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Aucun webhook reçu.</td></tr>
            ) : (
              data?.items.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{w.event}</p>
                    <p className="font-mono text-xs text-slate-400">{w.eventId}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge ok={w.signatureValid} okLabel="Valide" koLabel="Invalide" />
                  </td>
                  <td className="px-5 py-3">
                    {w.error ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700" title={w.error}>
                        Erreur
                      </span>
                    ) : (
                      <Badge ok={w.processed} okLabel="Oui" koLabel="Non" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{w.environment ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-400">{formatDate(w.receivedAt)}</td>
                </tr>
              ))
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

function Badge({ ok, okLabel, koLabel }: { ok: boolean; okLabel: string; koLabel: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {ok ? okLabel : koLabel}
    </span>
  );
}
