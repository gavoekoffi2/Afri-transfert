'use client';

import { FormEvent, useState } from 'react';
import { errorMessage } from '@/lib/api';
import { toInternationalPhone } from '@/lib/format';
import {
  useBeneficiaries,
  useCountries,
  useCreateBeneficiary,
  useDeleteBeneficiary,
} from '@/lib/hooks';

export default function BeneficiariesPage() {
  const { data: beneficiaries, isLoading } = useBeneficiaries();
  const { data: countries } = useCountries();
  const create = useCreateBeneficiary();
  const remove = useDeleteBeneficiary();

  const [form, setForm] = useState({ name: '', phone: '', countryIso2: '' });
  const [error, setError] = useState('');

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const country = countries?.find((c) => c.iso2 === form.countryIso2);
      await create.mutateAsync({
        name: form.name,
        phone: toInternationalPhone(form.phone, country?.callingCode ?? undefined),
        countryIso2: form.countryIso2,
      });
      setForm({ name: '', phone: '', countryIso2: '' });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bénéficiaires</h1>

      {/* Ajout */}
      <form onSubmit={onAdd} className="card">
        <h2 className="text-lg font-bold">Ajouter un bénéficiaire</h2>
        {error && <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            className="input"
            placeholder="Nom"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="input"
            placeholder="+22890123456"
            required
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <select
            className="input"
            required
            value={form.countryIso2}
            onChange={(e) => setForm((f) => ({ ...f, countryIso2: e.target.value }))}
          >
            <option value="">Pays…</option>
            {countries?.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.flagEmoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={create.isPending} className="btn-primary mt-4">
          {create.isPending ? 'Ajout…' : 'Ajouter'}
        </button>
      </form>

      {/* Liste */}
      <div className="card">
        {isLoading ? (
          <p className="text-sm text-slate-400">Chargement…</p>
        ) : !beneficiaries || beneficiaries.length === 0 ? (
          <p className="py-8 text-center text-slate-400">Aucun bénéficiaire enregistré.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {beneficiaries.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {b.isFavorite && '⭐ '}
                    {b.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {b.phone} {b.country ? `· ${b.country.flagEmoji} ${b.country.name}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => remove.mutate(b.id)}
                  className="text-sm font-medium text-red-500 hover:text-red-700"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
