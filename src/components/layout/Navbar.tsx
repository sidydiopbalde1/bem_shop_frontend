'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, User, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchWithSuggestions from './SearchWithSuggestions';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';

const NAV_LINKS = [
  { label: 'Home',      href: '/' },
  { label: 'Catalogue', href: '/catalogue' },
  { label: 'Contact',   href: '/contact' },
  { label: 'À propos',  href: '/a-propos' },
];

export default function Navbar() {
  const { count }           = useCart();
  const { user }            = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  function handleMobileSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = mobileSearch.trim();
    if (!q) return;
    router.push(`/catalogue?search=${encodeURIComponent(q)}`);
    setMobileSearch('');
    setMobileOpen(false);
  }

  return (
    <>
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
        <div className="mx-auto px-6 flex items-center gap-6" style={{ maxWidth: '1400px', height: '72px' }}>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group" aria-label="BEM Dakar">
            <Image
              src="/images/bem-dakar-logo.svg"
              alt="BEM Dakar"
              width={88} height={40} priority unoptimized
              style={{ height: '38px', width: 'auto' }}
              className="transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 flex-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className="relative text-[14px] font-medium text-[var(--bem-black)] group py-1">
                {l.label}
                <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-[var(--bem-red)] transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Search + icons */}
          <div className="flex items-center gap-3 ml-auto">
            <SearchWithSuggestions />

            {/* Account */}
            <Link href="/compte" aria-label="Mon compte"
              className="p-2 rounded-full hover:bg-[var(--bem-gray-50)] transition-colors">
              {user ? (
                <span className="w-8 h-8 rounded-full bg-[var(--bem-black)] text-white flex items-center justify-center text-[11px] font-bold">
                  {`${(user.firstName ?? '').charAt(0)}${(user.lastName ?? '').charAt(0)}`.toUpperCase()}
                </span>
              ) : (
                <User size={22} strokeWidth={1.8} className="text-[var(--bem-black)] hover:text-[var(--bem-red)] transition-colors" />
              )}
            </Link>

            {/* Cart */}
            <Link href="/panier" aria-label="Panier"
              className="relative p-2 rounded-full hover:bg-[var(--bem-gray-50)] transition-colors">
              <ShoppingBag size={22} strokeWidth={1.8} className="text-[var(--bem-black)] hover:text-[var(--bem-red)] transition-colors" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--bem-red)] text-white flex items-center justify-center text-[10px] font-bold"
                  >
                    {count > 99 ? '99+' : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Mobile burger */}
            <button className="md:hidden p-2 rounded-full hover:bg-[var(--bem-gray-50)] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-white"
              style={{ borderTop: '1px solid var(--bem-gray-100)' }}
            >
              {/* Mobile search */}
              <form onSubmit={handleMobileSearch} className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2 px-3 h-10 rounded-lg bg-[var(--bem-gray-50)]"
                  style={{ border: '1.5px solid var(--bem-gray-100)' }}>
                  <Search size={15} className="text-[var(--bem-gray-400)]" />
                  <input type="search" value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="flex-1 bg-transparent outline-none text-[13px]" />
                </div>
              </form>

              {/* Mobile links */}
              <nav className="flex flex-col px-4 pb-4 gap-1">
                {NAV_LINKS.map((l) => (
                  <Link key={l.href} href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="py-3 px-3 text-[14px] font-medium rounded-lg hover:bg-[var(--bem-gray-50)] transition-colors"
                    style={{ borderBottom: '1px solid var(--bem-gray-100)' }}>
                    {l.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
