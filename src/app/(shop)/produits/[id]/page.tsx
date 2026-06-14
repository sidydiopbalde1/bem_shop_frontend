import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/lib/types/shop.types';
import AddToCartButton from '@/components/shop/AddToCartButton';
import ProductGallery from '@/components/shop/ProductGallery';
import ProductCard from '@/components/shop/ProductCard';
import FadeIn from '@/components/ui/FadeIn';

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.API_URL}/products/${id}`,
      { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getSimilarProducts(categorySlug: string, excludeId: string): Promise<Product[]> {
  try {
    const qs = new URLSearchParams({ categorySlug, limit: '4', page: '1' });
    const res = await fetch(`${process.env.API_URL}/products?${qs}`,
      { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    const products: Product[] = Array.isArray(json) ? json : (json.data ?? []);
    return products.filter((p) => p.id !== excludeId).slice(0, 4);
  } catch { return []; }
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

  const similarProducts = await getSimilarProducts(product.category.slug, product.id);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-10 md:py-14">

      {/* Breadcrumb */}
      <FadeIn>
        <nav className="flex items-center gap-2 mb-10 text-[13px] text-gray-500 font-medium tracking-wide">
          <Link href="/" className="hover:text-bem-red transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/catalogue" className="hover:text-bem-red transition-colors">Catalogue</Link>
          <span>/</span>
          <span className="text-black">{product.name}</span>
        </nav>
      </FadeIn>

      {/* ── 2-column layout: galerie gauche / infos droite ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">

        {/* ── LEFT: Galerie ── */}
        <FadeIn direction="left" delay={0.05}>
          <ProductGallery
            images={product.imageUrls}
            name={product.name}
            isOutOfStock={isOutOfStock}
          />
        </FadeIn>

        {/* ── RIGHT: Infos produit ── */}
        <div className="md:sticky md:top-28 flex flex-col items-center gap-8">

          <div className="w-full space-y-4" style={{ textAlign: 'center' }}>
            {/* Category badge */}
            <FadeIn delay={0.15} className="w-full flex justify-center">
              <span className="inline-block uppercase font-bold text-[11px] tracking-[0.2em] text-bem-red bg-bem-red/10 px-3 py-1.5 rounded-full">
                {product.category.name}
              </span>
            </FadeIn>

            {/* Name */}
            <FadeIn delay={0.2} className="w-full">
              <h1 className="font-display text-4xl md:text-5xl font-extrabold text-black leading-[1.1] text-center">
                {product.name}
              </h1>
            </FadeIn>

            {/* Price */}
            <FadeIn delay={0.25} className="w-full">
              <p className="text-2xl font-bold text-black text-center">{formattedPrice}</p>
            </FadeIn>
          </div>

          <FadeIn delay={0.3} className="w-full">
            <hr className="w-full border-gray-100" />
          </FadeIn>

          {/* Add to cart */}
          <FadeIn delay={0.35} className="w-full">
            <AddToCartButton
              productId={product.id}
              isOutOfStock={isOutOfStock}
              product={{ id: product.id, name: product.name, price: product.price, imageUrls: product.imageUrls }}
            />
          </FadeIn>

          {/* Description */}
          {product.description && (
            <FadeIn delay={0.4} className="w-full">
              <div className="w-full pt-8 border-t border-gray-100 text-left">
                <h3 className="text-sm font-bold uppercase tracking-widest text-black mb-5">Description</h3>
                <p className="text-[15px] leading-relaxed text-gray-600 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </div>

      {/* ── Produits similaires ── */}
      {similarProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-gray-100">
          <FadeIn>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-black mb-8">
              Produits similaires
            </h2>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
