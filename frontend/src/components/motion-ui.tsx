'use client';

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ Reveal */
/** Révèle son contenu (fondu + glissement) lorsqu'il entre dans le viewport. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.5, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* --------------------------------------------------------------- Stagger */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.5, 0.25, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* --------------------------------------------------------------- CountUp */
/** Compteur animé déclenché à l'entrée dans le viewport. */
export function CountUp({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1.8,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration,
      ease: [0.21, 0.5, 0.25, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, to, decimals, duration, mv]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* ----------------------------------------------------------- GradientBlobs */
/** Arrière-plan animé : taches de couleur en mouvement lent (mesh gradient). */
export function GradientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-400/30 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-24 top-32 h-[26rem] w-[26rem] rounded-full bg-amber-300/30 blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-400/20 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- Coin */
/** Pièce FCFA flottante (décor). */
export function Coin({
  className,
  delay = 0,
  size = 64,
  label = 'FCFA',
}: {
  className?: string;
  delay?: number;
  size?: number;
  label?: string;
}) {
  return (
    <motion.div
      className={`absolute flex items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 font-bold text-amber-900 shadow-lg shadow-amber-500/30 ring-4 ring-amber-200/60 ${className ?? ''}`}
      style={{ width: size, height: size, fontSize: size * 0.22 }}
      animate={{ y: [0, -16, 0], rotate: [0, 8, 0] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {label}
    </motion.div>
  );
}

/* ------------------------------------------------------------- Parallax */
/** Léger effet de parallaxe vertical selon le défilement. */
export function Parallax({ children, amount = 60 }: { children: ReactNode; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
}

/* --------------------------------------------------------------- Marquee */
/** Défilement horizontal infini (logos / opérateurs). */
export function Marquee({ children, duration = 26 }: { children: ReactNode; duration?: number }) {
  return (
    <div className="relative flex overflow-hidden">
      <motion.div
        className="flex shrink-0 items-center gap-10 pr-10"
        animate={{ x: ['0%', '-100%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {children}
      </motion.div>
      <motion.div
        className="flex shrink-0 items-center gap-10 pr-10"
        animate={{ x: ['0%', '-100%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
        aria-hidden
      >
        {children}
      </motion.div>
    </div>
  );
}
