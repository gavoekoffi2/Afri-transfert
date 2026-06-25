import Link from 'next/link';

const corridors = [
  ['🇨🇲 Cameroun', '🇹🇬 Togo'],
  ['🇨🇬 Congo', '🇸🇳 Sénégal'],
  ['🇨🇩 RDC', '🇨🇮 Côte d\'Ivoire'],
  ['🇬🇦 Gabon', '🇧🇯 Bénin'],
];

const features = [
  { icon: '⚡', title: 'Rapide', text: 'Transfert en quelques secondes, suivi en temps réel.' },
  { icon: '🔒', title: 'Sécurisé', text: 'Paiements protégés, chiffrement et vérification systématique.' },
  { icon: '🌍', title: 'Panafricain', text: '17 pays, tous les opérateurs Mobile Money via GeniusPay.' },
  { icon: '💸', title: 'Transparent', text: 'Frais affichés avant chaque envoi : 2 % + 100 FCFA.' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-extrabold text-brand-700">🌍 AfriTransfer</div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Se connecter</Link>
          <Link href="/register" className="btn-primary">Créer un compte</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
              Propulsé par GeniusPay
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              Envoyez de l&apos;argent partout en Afrique,{' '}
              <span className="text-brand-700">simplement.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              Choisissez le pays, le bénéficiaire et le montant. AfriTransfer s&apos;occupe du reste —
              détection de l&apos;opérateur, devise et paiement, automatiquement.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="btn-primary px-7 py-3.5 text-base">
                Envoyer de l&apos;argent →
              </Link>
              <Link href="/login" className="btn-ghost px-7 py-3.5 text-base">
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>

          {/* Corridors card */}
          <div className="card bg-gradient-to-br from-brand-700 to-brand-900 text-white">
            <p className="text-sm font-medium text-brand-100">Corridors populaires</p>
            <div className="mt-5 space-y-3">
              {corridors.map(([from, to]) => (
                <div
                  key={from + to}
                  className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
                >
                  <span className="font-semibold">{from}</span>
                  <span className="text-brand-100">→</span>
                  <span className="font-semibold">{to}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-brand-100">
              + l&apos;Afrique de l&apos;Ouest et Centrale, extensible à tout le continent.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-extrabold">Comment ça marche ?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ['1', 'Choisissez', 'Pays de départ, pays d\'arrivée et bénéficiaire.'],
            ['2', 'Vérifiez', 'Les frais s\'affichent instantanément. Aucune surprise.'],
            ['3', 'Payez', 'Wave, Orange, MTN, Moov, carte… et c\'est envoyé.'],
          ].map(([num, title, text]) => (
            <div key={num} className="card text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white">
                {num}
              </div>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} AfriTransfer — Envoyez de l&apos;argent partout en Afrique, simplement.
      </footer>
    </main>
  );
}
