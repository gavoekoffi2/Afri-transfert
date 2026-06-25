'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from './logo';

const links = [
  { href: '#how', label: 'Comment ça marche' },
  { href: '#countries', label: 'Pays' },
  { href: '#features', label: 'Avantages' },
  { href: '#testimonials', label: 'Avis' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/10 bg-brand-900/80 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="AfriTransfert">
          <Logo tone="light" size={34} />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-white/80 transition hover:text-white">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-semibold text-white/90 hover:text-white sm:block">
            Se connecter
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-800 shadow-lg shadow-black/10 transition hover:scale-105 hover:bg-brand-50"
          >
            Créer un compte
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
