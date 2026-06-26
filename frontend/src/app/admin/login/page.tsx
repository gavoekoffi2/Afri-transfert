'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { errorMessage } from '@/lib/api';
import { adminLogin } from '@/lib/admin';
import { AfriTransferLogo } from '@/components/brand';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      router.push('/admin');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center"><AfriTransferLogo /></div>
          <p className="mt-1 text-sm text-white/50">Espace administrateur</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="text-xl font-bold text-white">Connexion admin</h1>
          {error && (
            <div className="mt-4 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</div>
          )}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-brand-400"
                placeholder="admin@afritransfer.africa"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-brand-400"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white transition hover:bg-brand-400 disabled:opacity-60"
            >
              {loading ? 'Connexion…' : 'Accéder au tableau de bord'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-white/40">Accès réservé au personnel autorisé.</p>
      </div>
    </main>
  );
}
