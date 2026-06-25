'use client';

import { useState } from 'react';
import { errorMessage } from '@/lib/api';
import { useAdminCountries, useSyncOperators, useToggleCountry } from '@/lib/admin-hooks';

export default function AdminCountriesPage() {
  const { data: countries, isLoading } = useAdminCountries();
  const toggle = useToggleCountry();
  const sync = useSyncOperators();
  const [message, setMessage] = useState('');

  async function onSync() {
    setMessage('');
    try {
      const res = await sync.mutateAsync();
      const data = (res.data as { data?: { countries: number; operators: number } }).data;
      setMessage(`Synchronisation réussie : ${data?.countries ?? 0} pays, ${data?.operators ?? 0} opérateurs.`);
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Pays &amp; opérateurs</h1>
        <button onClick={onSync} disabled={sync.isPending} className="btn-primary">
          {sync.isPending ? 'Synchronisation…' : '🔄 Synchroniser depuis GeniusPay'}
        </button>
      </div>

      {message && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-sm text-slate-400">Chargement…</p>
        ) : (
          countries?.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-800">
                    {c.flagEmoji} {c.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.iso2} · {c.currencyCode} · {c._count?.operators ?? 0} opérateurs
                  </p>
                  {c.supportsPawapay && (
                    <span className="mt-2 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                      PawaPay
                    </span>
                  )}
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={c.isActive}
                    disabled={toggle.isPending}
                    onChange={(e) => toggle.mutate({ iso2: c.iso2, isActive: e.target.checked })}
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
