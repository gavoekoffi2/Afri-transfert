'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';

interface MarkProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

/**
 * Marque AfriTransfert : monogramme « AT » (A bleu marine, T vert) inscrit dans
 * une orbite (transfert) terminée par une flèche ascendante (croissance).
 * Recréation vectorielle fidèle du logo officiel.
 */
export function LogoMark({ size = 40, animated = false, className }: MarkProps) {
  const uid = useId().replace(/[:]/g, '');
  const navy = `at-navy-${uid}`;
  const green = `at-green-${uid}`;

  const draw = animated
    ? {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
      }
    : {};
  const pop = animated
    ? {
        initial: { scale: 0.6, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
      }
    : {};

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={navy} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34488f" />
          <stop offset="1" stopColor="#101a40" />
        </linearGradient>
        <linearGradient id={green} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#62c95c" />
          <stop offset="1" stopColor="#15863a" />
        </linearGradient>
      </defs>

      {/* Orbite verte (haut) */}
      <motion.path
        d="M32 28 A46 46 0 0 1 96 40"
        stroke={`url(#${green})`}
        strokeWidth={9.5}
        strokeLinecap="round"
        {...draw}
        transition={{ duration: 0.9, delay: 0.1 }}
      />
      {/* Orbite bleu marine (gauche + bas) */}
      <motion.path
        d="M32 28 A46 46 0 1 0 94 84"
        stroke={`url(#${navy})`}
        strokeWidth={9.5}
        strokeLinecap="round"
        {...draw}
        transition={{ duration: 1.2, delay: 0.2 }}
      />
      {/* Flèche ascendante */}
      <motion.path
        d="M81 71 L96 85 L80 90"
        stroke={`url(#${navy})`}
        strokeWidth={9.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...draw}
        transition={{ duration: 0.5, delay: 1.1 }}
      />
      {/* A (bleu marine) */}
      <motion.path
        d="M33 86 L53 30 L73 86"
        stroke={`url(#${navy})`}
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...pop}
        transition={{ duration: 0.5, delay: 0.5, type: 'spring' }}
      />
      <motion.path
        d="M44 66 L62 66"
        stroke={`url(#${navy})`}
        strokeWidth={10}
        strokeLinecap="round"
        {...pop}
        transition={{ duration: 0.4, delay: 0.7 }}
      />
      {/* T (vert) */}
      <motion.path
        d="M58 44 L88 44"
        stroke={`url(#${green})`}
        strokeWidth={11}
        strokeLinecap="round"
        {...pop}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      <motion.path
        d="M73 44 L73 86"
        stroke={`url(#${green})`}
        strokeWidth={11}
        strokeLinecap="round"
        {...pop}
        transition={{ duration: 0.4, delay: 0.9 }}
      />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  tone?: 'navy' | 'light';
  showWordmark?: boolean;
  animated?: boolean;
  className?: string;
}

/** Logo complet : marque + signature « AfriTransfert » (Afri marine, Transfert vert). */
export function Logo({ size = 38, tone = 'navy', showWordmark = true, animated = false, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark size={size} animated={animated} />
      {showWordmark && (
        <span className="font-extrabold tracking-tight" style={{ fontSize: size * 0.72 }}>
          <span className={tone === 'light' ? 'text-white' : 'text-brand-900'}>Afri</span>
          <span className="text-accent-600">Transfert</span>
        </span>
      )}
    </span>
  );
}
