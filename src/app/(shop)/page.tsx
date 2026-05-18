import Link from 'next/link';
import type { Metadata } from 'next';
import HeroSection from '@/components/shop/HeroSection';
import ProductGrid from '@/components/shop/ProductGrid';
import TrustBar    from '@/components/shop/TrustBar';
import type { ProductsResponse } from '@/lib/types/shop.types';

export const metadata: Metadata = { title: 'Accueil — BEM Dakar Goodies' };

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${process.env.API_URL}/products?limit=8`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json: ProductsResponse = await res.json();
    return json.data;
  } catch { return []; }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <div>
      <HeroSection />
      {/* <TrustBar /> */}

      {/* ── Featured products ── */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '64px 48px' }}>

        {/* Header section */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '36px' }}>
          <div>
            <p style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em',
              textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: '6px',
            }}>
              Sélection du moment
            </p>
            <h2 style={{
              fontSize: '26px', fontWeight: 900,
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
            }}
          >
            Voir tout →
          </Link>
        </div>

        <ProductGrid products={products} columns={4} />
      </section>

      {/* ── Promo banner ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px 64px' }}>
        <div style={{
          background: 'linear-gradient(120deg, var(--bem-black) 0%, #1a1a2e 100%)',
          borderRadius: '16px',
          padding: '48px 56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '32px',
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em',
              textTransform: 'uppercase', color: 'var(--bem-red)', marginBottom: '10px',
            }}>
              Édition limitée
            </p>
            <h3 style={{
              fontSize: '30px', fontWeight: 900, color: '#fff', lineHeight: 1.15,
              fontFamily: 'var(--font-playfair), serif',
            }}>
              Collection 2026<br />
              <span style={{ color: 'var(--bem-red)' }}>BEM Dakar</span>
            </h3>
            <p style={{
              marginTop: '10px', fontSize: '13px',
              color: 'rgba(255,255,255,0.55)', maxWidth: '300px', lineHeight: 1.6,
            }}>
              Représentez votre école avec fierté. Stock limité, commandez maintenant.
            </p>
          </div>
          <Link
            href="/catalogue"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--bem-red)', color: '#fff',
              padding: '13px 32px', borderRadius: '99px',
              fontSize: '12px', fontWeight: 700,
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
