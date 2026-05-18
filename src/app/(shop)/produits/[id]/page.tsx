import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/lib/types/shop.types';
import AddToCartButton from '@/components/shop/AddToCartButton';
import ProductGallery from '@/components/shop/ProductGallery';

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.API_URL}/products/${id}`,
      { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product?.name ?? 'Produit - BEM Dakar' };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const isOutOfStock = product.stock === 0;
  const formattedPrice = new Intl.NumberFormat('fr-SN', {
    style: 'currency', currency: 'XOF', minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 md:py-16">

      {/* Breadcrumb */}
      <nav className="fade-up flex items-center gap-2 mb-10 text-[13px] text-gray-500 font-medium tracking-wide">
        <Link href="/" className="hover:text-bem-red transition-colors">Accueil</Link>
        <span>/</span>
        <Link href="/catalogue" className="hover:text-bem-red transition-colors">Catalogue</Link>
        <span>/</span>
        <span className="text-black">{product.name}</span>
      </nav>

      {/* ── 2-column layout: image gauche / infos droite ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20 items-start">

        {/* ── LEFT: Images ── */}
        <div className="fade-up" style={{ animationDelay: '0.1s' }}>
          <ProductGallery
            images={product.imageUrls}
            name={product.name}
            isOutOfStock={isOutOfStock}
          />
        </div>

        {/* ── RIGHT: Product info ── */}
        <div className="sticky top-28 space-y-8">

          <div className="space-y-4">
            {/* Category badge */}
            <div className="fade-up" style={{ animationDelay: '0.2s' }}>
              <span className="inline-block uppercase font-bold text-[11px] tracking-[0.2em] text-bem-red bg-bem-red/10 px-3 py-1.5 rounded-full">
                {product.category.name}
              </span>
            </div>

            {/* Name */}
            <h1 className="fade-up font-display text-4xl md:text-5xl font-extrabold text-black leading-[1.1]" style={{ animationDelay: '0.25s' }}>
              {product.name}
            </h1>

            {/* Price */}
            <p className="fade-up text-2xl font-bold text-black" style={{ animationDelay: '0.3s' }}>
              {formattedPrice}
            </p>
          </div>

          <hr className="fade-up border-gray-100" style={{ animationDelay: '0.35s' }} />

          {/* Add to cart */}
          <div className="fade-up" style={{ animationDelay: '0.4s' }}>
            <AddToCartButton
              productId={product.id}
              isOutOfStock={isOutOfStock}
              product={{ id: product.id, name: product.name, price: product.price, imageUrls: product.imageUrls }}
            />
          </div>

          {/* Guarantees */}
          <div className="fade-up grid grid-cols-3 gap-4 pt-6" style={{ animationDelay: '0.45s' }}>
            {[
              { icon: '🚚', label: 'Livraison express' },
              { icon: '↩️', label: 'Retour sous 7j' },
              { icon: '🔒', label: 'Paiement 100% sûr' },
            ].map((g) => (
              <div key={g.label} className="flex flex-col items-center justify-center text-center gap-2 p-4 rounded-2xl bg-gray-50 border border-gray-100/50">
                <span className="text-2xl">{g.icon}</span>
                <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{g.label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div className="fade-up pt-8 border-t border-gray-100 mt-8" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-black mb-4">Description</h3>
              <p className="text-[15px] leading-relaxed text-gray-600 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
