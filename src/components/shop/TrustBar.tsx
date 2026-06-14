'use client';

import { motion, useReducedMotion } from 'framer-motion';

const ITEMS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 12H3l9-9 9 9h-2"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
        <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"/>
      </svg>
    ),
    label: 'Livraison rapide à Dakar',
    sub: 'Sous 24–48h',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    label: 'Paiement Mobile Money',
    sub: 'Orange, Wave, Free Money',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    ),
    label: 'Retour sous 7 jours',
    sub: 'Satisfait ou remboursé',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    label: 'Paiement 100% sécurisé',
    sub: 'Transactions chiffrées',
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function TrustBar() {
  const shouldReduce = useReducedMotion();

  return (
    <div
      className="w-full border-t border-b border-[var(--bem-gray-100)]"
      style={{ background: 'var(--bem-gray-50)' }}
    >
      <motion.div
        className="trustbar-grid mx-auto px-6"
        style={{ maxWidth: '1400px' }}
        variants={shouldReduce ? undefined : containerVariants}
        initial={shouldReduce ? undefined : 'hidden'}
        whileInView={shouldReduce ? undefined : 'visible'}
        viewport={{ once: true, margin: '-80px' }}
      >
        {ITEMS.map((item, i) => (
          <motion.div
            key={i}
            variants={shouldReduce ? undefined : itemVariants}
            className="flex items-center gap-3 py-4 px-4"
            style={{
              borderRight: i < ITEMS.length - 1 ? '1px solid var(--bem-gray-100)' : 'none',
            }}
          >
            <span className="flex-shrink-0 text-[var(--bem-red)]">{item.icon}</span>
            <div>
              <p className="text-[12px] font-bold text-[var(--bem-black)] leading-tight">{item.label}</p>
              <p className="text-[11px] text-[var(--bem-gray-400)] mt-0.5">{item.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
