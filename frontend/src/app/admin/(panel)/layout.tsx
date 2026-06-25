'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminInfo, adminLogout, adminStore } from '@/lib/admin';
import { Logo } from '@/components/logo';

const NAV = [
  { href: '/admin', label: "Vue d'ensemble", icon: '📊' },
  { href: '/admin/users', label: 'Utilisateurs', icon: '👤' },
  { href: '/admin/transactions', label: 'Transactions', icon: '💳' },
  { href: '/admin/countries', label: 'Pays & opérateurs', icon: '🌍' },
  { href: '/admin/settings', label: 'Commissions & config', icon: '⚙️' },
  { href: '/admin/webhooks', label: 'Webhooks', icon: '🪝' },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!adminStore.token) {
      router.replace('/admin/login');
      return;
    }
    setAdmin(adminStore.info);
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">Chargement…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      {/* Sidebar */}
      <aside className="bg-slate-900 text-slate-300 md:flex md:min-h-screen md:w-64 md:flex-col">
        <div className="px-6 py-5">
          <Logo tone="light" size={30} />
        </div>
        <div className="px-6 pb-4">
          <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-300">
            {admin?.role ?? 'ADMIN'}
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden p-4 md:block">
          <Link href="/" className="block px-4 py-2 text-xs text-slate-500 hover:text-white">
            ← Retour au site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="text-sm text-slate-500">
            Connecté en tant que <span className="font-semibold text-slate-800">{admin?.name}</span>
          </div>
          <button onClick={adminLogout} className="text-sm font-medium text-slate-500 hover:text-red-600">
            Déconnexion
          </button>
        </header>
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </div>
    </div>
  );
}
