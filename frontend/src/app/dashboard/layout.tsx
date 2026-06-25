'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

const nav = [
  { href: '/dashboard', label: 'Accueil', icon: '🏠' },
  { href: '/dashboard/send', label: 'Envoyer', icon: '💸' },
  { href: '/dashboard/history', label: 'Historique', icon: '📜' },
  { href: '/dashboard/beneficiaries', label: 'Bénéficiaires', icon: '👥' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">Chargement…</div>
    );
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar */}
      <aside className="border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-6">
          <Link href="/dashboard" className="text-lg font-extrabold text-brand-700">
            🌍 AfriTransfer
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="text-sm text-slate-500">
            Bonjour, <span className="font-semibold text-slate-800">{user.firstName}</span>
          </div>
          <div className="flex items-center gap-3">
            {user.status !== 'ACTIVE' && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Email non vérifié
              </span>
            )}
            <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-slate-800">
              Déconnexion
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-4xl p-6">{children}</main>
      </div>
    </div>
  );
}
