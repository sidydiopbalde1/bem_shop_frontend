'use client';

import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Catalogue',  href: '/catalogue' },
  { label: 'À propos',   href: '/a-propos' },
  { label: 'Contact',    href: '/contact' },
  { label: 'Mon compte', href: '/compte' },
];

const VALUES = [
  {
    title: 'Une identité forte',
    desc: 'Tout commence par une vision : valoriser le talent et représenter BEM Dakar avec fierté.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    title: 'Pensé pour vous',
    desc: "Chaque produit est conçu pour allier utilité, qualité et style au quotidien.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    title: 'Une communauté engagée',
    desc: "Étudiants, alumni, équipe — ensemble, nous créons bien plus qu'une boutique.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--bem-gray-100)', marginTop: '5rem' }}>
      {/* Values — CSS Grid inline pour bypass Tailwind breakpoints */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '4rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          textAlign: 'center',
        }}
      >
        {VALUES.map((v) => (
          <div key={v.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'var(--bem-gray-400)' }}>{v.icon}</span>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{v.title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--bem-gray-700)', lineHeight: 1.6, maxWidth: '280px' }}>
              {v.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--bem-gray-100)' }}>
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--bem-gray-400)' }}>© 2026 BEM DAKAR GOODIES</span>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: '0.75rem', color: 'var(--bem-gray-400)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bem-black)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bem-gray-400)')}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--bem-gray-400)' }}>
            <a href="https://www.tiktok.com/@bemdkr" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
              style={{ color: 'var(--bem-gray-400)', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bem-black)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bem-gray-400)')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/bemdkr/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              style={{ color: 'var(--bem-gray-400)', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bem-black)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bem-gray-400)')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/bemdakar" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
              style={{ color: 'var(--bem-gray-400)', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bem-black)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bem-gray-400)')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/school/bemdakar/posts/?feedView=all" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
              style={{ color: 'var(--bem-gray-400)', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bem-black)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bem-gray-400)')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
