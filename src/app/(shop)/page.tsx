import Link from 'next/link';
import type { Metadata } from 'next';
import HeroSection from '@/components/shop/HeroSection';
import ProductGrid from '@/components/shop/ProductGrid';
import type { ProductsResponse } from '@/lib/types/shop.types';

export const metadata: Metadata = { title: 'BEM Shop' };

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${process.env.API_URL}/products?limit=8`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    console.log('API response status:', res);
    if (!res.ok) return [];
    const json: ProductsResponse = await res.json();
    console.log('API response data:', json.data);
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
      <HeroSection />
      {/* <TrustBar /> */}

      {/* ── Featured products ── */}
      <section className="bem-container section-pad">

        {/* Header section */}
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

        <ProductGrid products={products} columns={4} />
      </section>

      {/* ── Promo banner ── */}
      <div className="bem-container" style={{ paddingBottom: '64px' }}>
        <div style={{
          background: 'linear-gradient(120deg, var(--bem-black) 0%, #1a1a2e 100%)',
          borderRadius: '16px',
        }}
          className="promo-banner"
        >
          <div>
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
          </div>
          <Link
            href="/catalogue"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--bem-red)', color: '#fff',
              padding: '16px 40px', borderRadius: '99px',
              fontSize: '14px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              textDecoration: 'none', flexShrink: 0,
              transition: 'opacity .2s',
            }}
          >
            Découvrir →
          </Link>
        </div>
      </div>
    </div>
  );
}
