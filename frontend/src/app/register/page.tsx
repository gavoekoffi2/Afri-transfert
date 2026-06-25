'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCountries } from '@/lib/hooks';
import { Logo } from '@/components/logo';
import { toInternationalPhone } from '@/lib/format';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const { data: countries } = useCountries();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryIso2: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Normalise le téléphone au format international à partir du pays choisi
      // (ex : 0712345678 + Cameroun → +237712345678).
      const selectedCountry = countries?.find((c) => c.iso2 === form.countryIso2);
      const phone = toInternationalPhone(form.phone, selectedCountry?.callingCode ?? undefined);
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: phone || undefined,
        countryIso2: form.countryIso2 || undefined,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center" aria-label="AfriTransfert">
          <Logo size={42} />
        </Link>
        <div className="card">
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          <p className="mt-1 text-sm text-slate-500">Commencez à envoyer en quelques minutes.</p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prénom</label>
                <input required className="input" value={form.firstName} onChange={set('firstName')} />
              </div>
              <div>
                <label className="label">Nom</label>
                <input required className="input" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Téléphone (optionnel)</label>
              <input className="input" placeholder="+221771234567" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label">Pays</label>
              <select className="input" value={form.countryIso2} onChange={set('countryIso2')}>
                <option value="">Sélectionnez…</option>
                {countries?.map((c) => (
                  <option key={c.iso2} value={c.iso2}>
                    {c.flagEmoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                required
                className="input"
                placeholder="8+ caractères, 1 majuscule, 1 minuscule, 1 chiffre"
                value={form.password}
                onChange={set('password')}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-semibold text-brand-700">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
