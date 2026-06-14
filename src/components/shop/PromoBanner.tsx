'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function PromoBanner() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="bem-container" style={{ paddingBottom: '64px' }}>
      <div
        className="promo-banner relative overflow-hidden"
        style={{
          background: 'linear-gradient(120deg, var(--bem-black) 0%, #1a1a2e 100%)',
          borderRadius: '16px',
        }}
      >
        {/* Floating decorative circles — CSS animation (no JS overhead) */}
        {!shouldReduce && (
          <>
            <div
              aria-hidden="true"
              className="promo-circle-1"
            />
            <div
              aria-hidden="true"
              className="promo-circle-2"
            />
            <div
              aria-hidden="true"
              className="promo-circle-3"
            />
          </>
        )}

        {/* Text block */}
        <motion.div
          initial={shouldReduce ? { opacity: 1 } : { opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <p style={{
            fontSize: '13px', fontWeight: 700, letterSpacing: '0.25em',
            textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: '14px',
          }}>
            Édition limitée
          </p>
          <h3 style={{
            fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 900, color: '#fff', lineHeight: 1.15,
            fontFamily: 'var(--font-playfair), serif',
          }}>
            Collection 2026<br />
            <span style={{ color: 'var(--bem-red)' }}>BEM Dakar</span>
          </h3>
          <p style={{
            marginTop: '14px', fontSize: '16px',
            color: 'rgba(255,255,255,0.55)', maxWidth: '380px', lineHeight: 1.6,
          }}>
            Représentez votre école avec fierté. Stock limité, commandez maintenant.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={shouldReduce ? { opacity: 1 } : { opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}
        >
          <motion.div
            whileHover={shouldReduce ? {} : { scale: 1.06 }}
            whileTap={shouldReduce ? {} : { scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <Link
              href="/catalogue"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'var(--bem-red)', color: '#fff',
                padding: '16px 40px', borderRadius: '99px',
                fontSize: '14px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none',
                boxShadow: '0 4px 24px rgba(204,31,39,0.35)',
              }}
            >
              Découvrir →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
