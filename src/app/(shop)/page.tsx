import Link from 'next/link';
import type { Metadata } from 'next';
import HeroSection from '@/components/shop/HeroSection';
import TrustBar from '@/components/shop/TrustBar';
import ProductGrid from '@/components/shop/ProductGrid';
import PromoBanner from '@/components/shop/PromoBanner';
import FadeIn from '@/components/ui/FadeIn';
import type { ProductsResponse } from '@/lib/types/shop.types';

export const metadata: Metadata = {
  title: 'BEM Shop',
  description:
    'Boutique officielle BEM Dakar. Découvrez notre sélection de goodies, vêtements et accessoires. Affichez vos couleurs, soutenez votre école. Livraison au Sénégal.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'BEM Shop — Goodies & Accessoires Officiels',
    description:
      'Boutique officielle BEM Shop. Goodies, vêtements et accessoires. Livraison au Sénégal.',
    url: '/',
    images: [{ url: '/images/hero-bg.png', alt: 'BEM Shop Collection' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BEM Shop — Goodies & Accessoires Officiels',
    description: 'Boutique officielle BEM Shop. Livraison au Sénégal.',
    images: ['/images/hero-bg.png'],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'BEM Dakar',
  url: 'https://boutique.bem.sn',
  logo: 'https://boutique.bem.sn/images/logo.png',
  sameAs: [
    'https://www.instagram.com/bemdkr/',
    'https://www.tiktok.com/@bemdkr',
    'https://www.facebook.com/bemdakar',
    'https://www.linkedin.com/school/bemdakar/posts/?feedView=all',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'boutique@bem.sn',
    contactType: 'customer service',
    availableLanguage: 'French',
  },
};

async function getFeaturedProducts() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return [];
  try {
    const res = await fetch(`${apiUrl}/products?limit=8`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const json: ProductsResponse = await res.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HeroSection />

      {/* ── Trust bar ── */}
      {/* <TrustBar /> */}

      {/* ── Featured products ── */}
      <section className="bem-container section-pad">

        {/* Header section */}
        <FadeIn>
          <div className="featured-header">
            <div>
              <p style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em',
                textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: '6px',
              }}>
                Sélection du moment
              </p>
              <h2 style={{
                fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900,
                color: 'var(--bem-black)', lineHeight: 1.1,
                fontFamily: 'var(--font-playfair), serif',
              }}>
                Les indispensables BEM
              </h2>
            </div>
            <Link
              href="/catalogue"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'var(--bem-black)',
                borderBottom: '2px solid var(--bem-black)', paddingBottom: '2px',
                textDecoration: 'none', transition: 'color .2s, border-color .2s',
                flexShrink: 0,
              }}
            >
              Voir tout →
            </Link>
          </div>
        </FadeIn>

        <ProductGrid products={products} columns={4} />
      </section>

      {/* ── Promo banner (client component — float circles + slide animations) ── */}
      <PromoBanner />
    </div>
  );
}
