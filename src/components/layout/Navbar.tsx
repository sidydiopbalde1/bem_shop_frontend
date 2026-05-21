'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Home, LayoutGrid, Mail, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchWithSuggestions from './SearchWithSuggestions';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';

const NAV_LINKS = [
  { label: 'Home',      href: '/',          Icon: Home },
  { label: 'Catalogue', href: '/catalogue', Icon: LayoutGrid },
  { label: 'Contact',   href: '/contact',   Icon: Mail },
  { label: 'À propos',  href: '/a-propos',  Icon: Info },
];

export default function Navbar() {
  const { count }    = useCart();
  const { user }     = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const initials = `${(user?.firstName ?? '').charAt(0)}${(user?.lastName ?? '').charAt(0)}`.toUpperCase();

  return (
    <>
      {/* ── Top header ─────────────────────────────────────── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.9)' : '#fff',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: '1px solid var(--bem-gray-100)',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        {/* ── Desktop ── */}
        <div className="hidden md:flex mx-auto px-6 items-center gap-6" style={{ maxWidth: '1400px', height: '72px' }}>
          <Link href="/" className="flex-shrink-0 group" aria-label="BEM Dakar">
            <Image src="/images/bem_logo.png" alt="BEM Dakar" width={88} height={40} priority unoptimized
              style={{ height: '38px', width: 'auto' }}
              className="transition-transform duration-300 group-hover:scale-[1.03]" />
          </Link>

          <nav className="flex items-center gap-8 flex-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href}
                className="relative text-[14px] font-medium text-[var(--bem-black)] group py-1">
                {label}
                <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-[var(--bem-red)] transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <SearchWithSuggestions />

            <Link href="/compte" aria-label="Mon compte"
              className="p-2 rounded-full hover:bg-[var(--bem-gray-50)] transition-colors">
              {user ? (
                <span className="w-8 h-8 rounded-full bg-[var(--bem-black)] text-white flex items-center justify-center text-[11px] font-bold">
                  {initials}
                </span>
              ) : (
                <User size={22} strokeWidth={1.8} className="text-[var(--bem-black)] hover:text-[var(--bem-red)] transition-colors" />
              )}
            </Link>

            <Link href="/panier" aria-label="Panier"
              className="relative p-2 rounded-full hover:bg-[var(--bem-gray-50)] transition-colors">
              <ShoppingBag size={22} strokeWidth={1.8} className="text-[var(--bem-black)] hover:text-[var(--bem-red)] transition-colors" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--bem-red)] text-white flex items-center justify-center text-[10px] font-bold">
                    {count > 99 ? '99+' : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>

        {/* ── Mobile : logo + barre de recherche ── */}
        <div className="flex md:hidden items-center gap-3 px-4" style={{ height: '58px' }}>
          <Link href="/" className="flex-shrink-0" aria-label="BEM Dakar">
            <Image src="/images/bem_logo.png" alt="BEM Dakar" width={80} height={36} priority unoptimized
              style={{ height: '30px', width: 'auto' }} />
          </Link>

          <SearchWithSuggestions variant="mobile" />
        </div>
      </motion.header>

      {/* ── Bottom tab bar (mobile uniquement) ─────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{
          background: '#fff',
          borderTop: '1px solid var(--bem-gray-100)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
          height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Liens de navigation */}
        {NAV_LINKS.map(({ label, href, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px]"
              style={{ color: active ? 'var(--bem-red)' : 'var(--bem-gray-400)', transition: 'color .15s' }}>
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span style={{ fontSize: '9px', fontWeight: active ? 700 : 500, letterSpacing: '.02em' }}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Compte */}
        {(() => {
          const active = pathname === '/compte';
          return (
            <Link href="/compte"
              className="flex-1 flex flex-col items-center justify-center gap-[3px]"
              style={{ color: active ? 'var(--bem-red)' : 'var(--bem-gray-400)', transition: 'color .15s' }}>
              {user ? (
                <span
                  className="flex items-center justify-center rounded-full text-white"
                  style={{ width: 22, height: 22, fontSize: 8, fontWeight: 800, background: active ? 'var(--bem-red)' : 'var(--bem-black)', transition: 'background .15s' }}>
                  {initials}
                </span>
              ) : (
                <User size={20} strokeWidth={active ? 2.4 : 1.8} />
              )}
              <span style={{ fontSize: '9px', fontWeight: active ? 700 : 500 }}>Compte</span>
            </Link>
          );
        })()}

        {/* Panier */}
        {(() => {
          const active = pathname === '/panier';
          return (
            <Link href="/panier"
              className="flex-1 flex flex-col items-center justify-center gap-[3px]"
              style={{ color: active ? 'var(--bem-red)' : 'var(--bem-gray-400)', transition: 'color .15s' }}>
              <div className="relative">
                <ShoppingBag size={20} strokeWidth={active ? 2.4 : 1.8} />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute flex items-center justify-center rounded-full text-white font-bold"
                      style={{ top: -5, right: -6, minWidth: 14, height: 14, fontSize: 8, padding: '0 2px', background: 'var(--bem-red)' }}>
                      {count > 99 ? '99+' : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span style={{ fontSize: '9px', fontWeight: active ? 700 : 500 }}>Panier</span>
            </Link>
          );
        })()}
      </nav>

      {/* Espace réservé pour éviter que le contenu passe sous la tab bar */}
      <style>{`
        @media (max-width: 767px) {
          body { padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)); }
        }
      `}</style>
    </>
  );
}
