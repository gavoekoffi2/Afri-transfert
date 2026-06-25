'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Logo, LogoMark } from '@/components/logo';
import {
  Coin,
  CountUp,
  GradientBlobs,
  Marquee,
  Parallax,
  Reveal,
  Stagger,
  StaggerItem,
} from '@/components/motion-ui';

const COUNTRIES = [
  ['ci', "Côte d'Ivoire"], ['sn', 'Sénégal'], ['bj', 'Bénin'], ['tg', 'Togo'],
  ['bf', 'Burkina Faso'], ['ml', 'Mali'], ['ne', 'Niger'], ['cm', 'Cameroun'],
  ['cg', 'Congo'], ['cd', 'RD Congo'], ['ga', 'Gabon'], ['cf', 'Centrafrique'],
];

const OPERATORS = ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Airtel Money', 'PawaPay', 'Paystack'];

const STEPS = [
  { icon: '🌍', title: 'Choisissez', text: "Pays de départ, pays d'arrivée et bénéficiaire — en quelques secondes." },
  { icon: '🧮', title: 'Vérifiez', text: 'Les frais (2 % + 100 FCFA) et le montant reçu s’affichent instantanément.' },
  { icon: '📲', title: 'Payez', text: 'Wave, Orange, MTN, Moov, carte… paiement sécurisé en un clic.' },
  { icon: '✅', title: 'Confirmé', text: 'Le bénéficiaire reçoit l’argent. Vous suivez tout en temps réel.' },
];

const FEATURES = [
  { icon: '⚡', title: 'Ultra rapide', text: 'Transferts en quelques secondes, suivi en temps réel par webhooks.' },
  { icon: '🔒', title: 'Sécurisé', text: 'Chiffrement, vérification systématique et paiements protégés.' },
  { icon: '💸', title: 'Transparent', text: 'Frais affichés avant chaque envoi. Aucune surprise, jamais.' },
  { icon: '🌐', title: 'Panafricain', text: '17 pays et tous les opérateurs Mobile Money, via GeniusPay.' },
  { icon: '👛', title: 'Multi-paiement', text: 'Wave, Orange, MTN, Moov, Airtel, PawaPay, carte bancaire.' },
  { icon: '🧾', title: 'Reçus & historique', text: 'Téléchargez vos reçus et retrouvez tout votre historique.' },
];

const TESTIMONIALS = [
  { img: '/images/t-awa.jpg', name: 'Awa Traoré', role: 'Abidjan → Lomé', quote: "J'envoie à ma famille au Togo en 30 secondes. C'est aussi simple que Wave." },
  { img: '/images/t-fatou.jpg', name: 'Fatou N.', role: 'Dakar → Douala', quote: 'Les frais sont clairs dès le départ et l’argent arrive instantanément. Je recommande.' },
  { img: '/images/t-kofi.jpg', name: 'Kofi Mensah', role: 'Libreville → Cotonou', quote: 'Enfin une solution panafricaine fiable. Plus besoin d’intermédiaires.' },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden bg-white">
      <Navbar />

      {/* ============================== HERO ============================== */}
      <section className="grain relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 pb-24 pt-32 text-white">
        <GradientBlobs />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          {/* Texte */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400" />
              Propulsé par GeniusPay · 17 pays
            </motion.div>

            <Stagger className="mt-6">
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                <StaggerItem>Envoyez de l’argent</StaggerItem>
                <StaggerItem>
                  <span className="bg-gradient-to-r from-accent-300 via-accent-200 to-white bg-clip-text text-transparent">
                    partout en Afrique,
                  </span>
                </StaggerItem>
                <StaggerItem>simplement.</StaggerItem>
              </h1>
            </Stagger>

            <Reveal delay={0.5}>
              <p className="mt-6 max-w-md text-lg text-white/75">
                Cameroun → Togo, Congo → Sénégal, RDC → Côte d’Ivoire… Transférez. Encaissez.
                Réussissez. AfriTransfert s’occupe du reste.
              </p>
            </Reveal>

            <Reveal delay={0.65}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="group rounded-full bg-accent-500 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-accent-500/30 transition hover:scale-105 hover:bg-accent-400"
                >
                  Envoyer de l’argent
                  <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
                </Link>
                <a
                  href="#how"
                  className="rounded-full border border-white/25 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Comment ça marche
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.8}>
              <div className="mt-8 flex items-center gap-2">
                {COUNTRIES.slice(0, 7).map(([iso]) => (
                  <img
                    key={iso}
                    src={`https://flagcdn.com/${iso}.svg`}
                    alt={iso}
                    className="h-7 w-7 rounded-full object-cover ring-2 ring-white/30"
                  />
                ))}
                <span className="ml-2 text-sm text-white/65">+ 10 autres pays</span>
              </div>
            </Reveal>
          </div>

          {/* Visuel */}
          <div className="relative mx-auto w-full max-w-md">
            {/* Orbite animée (écho du logo) */}
            <motion.div
              aria-hidden
              className="absolute -inset-6 -z-0 rounded-full border border-dashed border-accent-400/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-[2rem] border-4 border-white/15 shadow-2xl"
            >
              <img src="/images/hero-person.jpg" alt="Utilisateur AfriTransfert" className="h-[30rem] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 to-transparent" />
            </motion.div>

            {/* Logo animé flottant */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}
              className="absolute -right-5 -top-5 rounded-2xl bg-white p-2.5 shadow-2xl"
            >
              <LogoMark size={56} animated />
            </motion.div>

            {/* Carte de transfert flottante */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: [0, -12, 0] }}
              transition={{ opacity: { delay: 0.6 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 } }}
              className="absolute -bottom-6 -left-6 w-64 rounded-2xl border border-white/60 bg-white/95 p-5 text-slate-800 shadow-2xl backdrop-blur"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Vous envoyez</span><span>🇨🇲 → 🇹🇬</span>
              </div>
              <p className="mt-1 text-2xl font-extrabold text-brand-900">10 000 FCFA</p>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <div className="flex justify-between"><span>Commission</span><span>300 FCFA</span></div>
                <div className="flex justify-between font-semibold text-accent-600"><span>Reçu</span><span>10 000 FCFA</span></div>
              </div>
              <div className="mt-3 rounded-lg bg-accent-500 py-2 text-center text-sm font-bold text-white">Envoyé ✓</div>
            </motion.div>

            <Coin className="right-10 top-44" delay={1.2} size={46} label="₣" />
          </div>
        </div>
      </section>

      {/* ============================== STATS ============================== */}
      <section className="border-y border-slate-100 bg-white py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { v: <CountUp to={17} />, l: 'Pays couverts' },
            { v: <CountUp to={36} />, l: 'Opérateurs Mobile Money' },
            { v: <><CountUp to={2} />%</>, l: 'Commission + 100 FCFA' },
            { v: <>&lt;<CountUp to={30} />s</>, l: 'Temps de transfert' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.1} className="text-center">
              <p className="bg-gradient-to-br from-brand-800 to-accent-600 bg-clip-text text-4xl font-extrabold text-transparent">
                {s.v}
              </p>
              <p className="mt-1 text-sm text-slate-500">{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================== OPERATORS MARQUEE ============================== */}
      <section className="bg-slate-50 py-10">
        <p className="mb-6 text-center text-sm font-medium uppercase tracking-wider text-slate-400">
          Tous vos moyens de paiement préférés
        </p>
        <Marquee>
          {OPERATORS.map((op) => (
            <span
              key={op}
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-lg font-bold text-brand-800 shadow-sm"
            >
              {op}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ============================== HOW IT WORKS ============================== */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-brand-900 sm:text-4xl">Un transfert en 4 étapes</h2>
          <p className="mt-4 text-lg text-slate-500">
            La simplicité de Wave, à l’échelle du continent. Aucune complexité technique.
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <StaggerItem key={s.title}>
              <div className="group relative h-full rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl">
                <div className="absolute right-6 top-6 text-6xl font-black text-slate-100 transition group-hover:text-accent-50">
                  {i + 1}
                </div>
                <div className="text-4xl">{s.icon}</div>
                <h3 className="mt-5 text-xl font-bold text-brand-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ============================== SHOWCASE ============================== */}
      <section className="grain relative overflow-hidden bg-gradient-to-br from-brand-900 to-brand-950 py-24 text-white">
        <GradientBlobs />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <Parallax>
            <div className="relative">
              <img
                src="/images/feature-woman.jpg"
                alt="Cliente AfriTransfert"
                className="rounded-[2rem] border-4 border-white/10 object-cover shadow-2xl"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-5 bottom-10 rounded-2xl bg-white px-5 py-3 text-slate-800 shadow-xl"
              >
                <p className="text-xs text-slate-400">Reçu estimé</p>
                <p className="text-xl font-extrabold text-accent-600">+ 50 000 FCFA</p>
              </motion.div>
            </div>
          </Parallax>

          <div>
            <Reveal>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                L’argent qui circule, <span className="text-accent-400">sans frontières.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 text-lg text-white/75">
                Plus besoin d’intermédiaires ni de procédures manuelles. AfriTransfert détecte
                automatiquement le pays, l’opérateur et la devise à partir du numéro Mobile Money.
              </p>
            </Reveal>
            <Stagger className="mt-8 space-y-4">
              {[
                'Détection automatique de l’opérateur et de la devise',
                'Conversion transparente (XOF ↔ XAF à parité)',
                'Notification email & SMS à chaque étape',
                'Reçu téléchargeable pour chaque transfert',
              ].map((t) => (
                <StaggerItem key={t}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-white">✓</span>
                    <span className="text-white/90">{t}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ============================== COUNTRIES ============================== */}
      <section id="countries" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-brand-900 sm:text-4xl">Présent dans toute l’Afrique</h2>
          <p className="mt-4 text-lg text-slate-500">
            Afrique de l’Ouest et Centrale aujourd’hui, tout le continent demain.
          </p>
        </Reveal>

        <Stagger className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {COUNTRIES.map(([iso, name]) => (
            <StaggerItem key={iso}>
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-accent-200 hover:shadow-md">
                <img
                  src={`https://flagcdn.com/${iso}.svg`}
                  alt={name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                />
                <span className="font-semibold text-brand-800">{name}</span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ============================== FEATURES ============================== */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-brand-900 sm:text-4xl">Pourquoi AfriTransfert ?</h2>
            <p className="mt-4 text-lg text-slate-500">Conçu comme une fintech professionnelle, pensé pour vous.</p>
          </Reveal>

          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <StaggerItem key={f.title}>
                <div className="h-full rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-2xl">{f.icon}</div>
                  <h3 className="mt-5 text-xl font-bold text-brand-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{f.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============================== TESTIMONIALS ============================== */}
      <section id="testimonials" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-brand-900 sm:text-4xl">Ils envoient déjà avec AfriTransfert</h2>
        </Reveal>
        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name}>
              <figure className="h-full rounded-3xl border border-slate-100 bg-white p-7 shadow-sm">
                <div className="text-4xl leading-none text-accent-300">“</div>
                <blockquote className="mt-2 text-slate-700">{t.quote}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-brand-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="relative overflow-hidden px-6 py-10">
        <Reveal>
          <div className="grain relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-800 to-brand-950 px-8 py-16 text-center text-white shadow-2xl">
            <GradientBlobs />
            <Coin className="left-10 top-10 hidden md:flex" size={50} />
            <Coin className="bottom-10 right-12 hidden md:flex" delay={1} size={44} label="₣" />
            <div className="mb-6 flex justify-center">
              <LogoMark size={60} />
            </div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Prêt à envoyer votre premier transfert ?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/75">
              Créez votre compte en 2 minutes et envoyez de l’argent partout en Afrique, simplement.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-block rounded-full bg-accent-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-accent-500/30 transition hover:scale-105 hover:bg-accent-400"
            >
              Commencer gratuitement →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="border-t border-slate-100 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <Logo size={32} />
          <p className="text-sm text-slate-400">Transférez. Encaissez. Réussissez.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/login" className="hover:text-accent-600">Connexion</Link>
            <Link href="/register" className="hover:text-accent-600">Inscription</Link>
            <Link href="/admin/login" className="hover:text-accent-600">Admin</Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} AfriTransfert · Propulsé par GeniusPay
        </p>
      </footer>
    </main>
  );
}
