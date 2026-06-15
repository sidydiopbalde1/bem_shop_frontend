import type { Metadata } from 'next';
import Link from 'next/link';
import ProductGrid from '@/components/shop/ProductGrid';
import CatalogueFilters from '@/components/shop/CatalogueFilters';
import FadeIn from '@/components/ui/FadeIn';
import type { ProductsResponse, Category } from '@/lib/types/shop.types';

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategories();
  const description =
    categories.length > 0
      ? `Explorez toute la collection BEM Dakar : ${categories.map((c) => c.name).join(', ')}. Livraison rapide au Sénégal.`.slice(0, 160)
      : 'Explorez toute la collection BEM Dakar. Goodies, accessoires et produits officiels. Livraison rapide au Sénégal.';
  return {
    title: 'Catalogue',
    description,
    alternates: { canonical: '/catalogue' },
    openGraph: { title: 'Catalogue — BEM Dakar', description, url: '/catalogue' },
  };
}

type SearchParams = Promise<{
  page?:     string;
  search?:   string;
  category?: string;
  sort?:     string;
}>;

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${process.env.API_URL}/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

async function getProducts(params: {
  page?: string; search?: string; category?: string; sort?: string;
}) {
  const qs = new URLSearchParams({
    page:  params.page  ?? '1',
    limit: '12',
    ...(params.search   && { search:        params.search }),
    ...(params.category && { categorySlug:  params.category }),
  });
  try {
    const res = await fetch(`${process.env.API_URL}/products?${qs}`,
      { next: { revalidate: 30 } });
    if (!res.ok) return { data: [], total: 0, page: 1, totalPages: 1 };
    return res.json() as Promise<ProductsResponse>;
  } catch {
    return { data: [], total: 0, page: 1, totalPages: 1 };
  }
}

export default async function CataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const { page, search, category, sort } = await searchParams;
  const [{ data: products, total, totalPages }, categories] = await Promise.all([
    getProducts({ page, search, category, sort }),
    getCategories(),
  ]);
  const currentPage = Number(page ?? 1);

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    q.set('page', String(p));
    if (search)   q.set('search',   search);
    if (category) q.set('category', category);
    if (sort)     q.set('sort',     sort);
    return `/catalogue?${q.toString()}`;
  };

  return (
    <div>
      {/* ── Banner header ── */}
      <div style={{ background: 'var(--bem-gray-50)', borderBottom: '1px solid var(--bem-gray-100)' }}>
        <div className="catalogue-header-inner">

          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--bem-gray-400)', marginBottom: '16px' }}>
            <Link href="/" style={{ color: 'var(--bem-gray-400)', textDecoration: 'none' }}
              className="hover:text-[var(--bem-red)] transition-colors">Accueil</Link>
            <span>/</span>
            <span style={{ color: 'var(--bem-black)', fontWeight: 600 }}>Catalogue</span>
          </nav>

          {/* Title + search */}
          <div className="catalogue-title-row">
            <div>
              <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 900, color: 'var(--bem-black)', lineHeight: 1 }}>
                Catalogue
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--bem-gray-400)', marginTop: '6px' }}>
                {total} produit{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''}
                {search && <span style={{ color: 'var(--bem-red)', fontWeight: 600 }}> pour &ldquo;{search}&rdquo;</span>}
              </p>
            </div>

            {/* Search form */}
            <form className="catalogue-search-form">
              {category && <input type="hidden" name="category" value={category} />}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#fff', border: '1.5px solid var(--bem-gray-100)',
                borderRadius: '8px', padding: '0 12px', height: '38px',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--bem-gray-400)', flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  name="search"
                  defaultValue={search}
                  placeholder="Rechercher un produit…"
                  style={{
                    border: 'none', outline: 'none', fontSize: '12px',
                    flex: 1, background: 'transparent', color: 'var(--bem-black)',
                    minWidth: 0,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  style={{
                    height: '38px', padding: '0 18px', borderRadius: '8px',
                    background: 'var(--bem-black)', color: '#fff',
                    fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  OK
                </button>
                {search && (
                  <Link href="/catalogue" style={{
                    height: '38px', padding: '0 14px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center',
                    border: '1.5px solid var(--bem-gray-100)', fontSize: '12px',
                    color: 'var(--bem-gray-400)', textDecoration: 'none', flexShrink: 0,
                  }}>
                    ✕ Effacer
                  </Link>
                )}
              </div>
            </form>
          </div>

          {/* Category pills (mobile: horizontal scroll / desktop: also visible) */}
          <div style={{ paddingBottom: '16px' }}>
            <CatalogueFilters categories={categories} activeCategory={category} search={search} sort={sort} />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="catalogue-body" style={{ paddingTop: '28px' }}>

        {/* Sidebar — hidden on mobile, card on desktop */}
        <aside className="catalogue-sidebar">
          {categories.length > 0 && (
            <FilterSection title="Catégories">
              <FilterLink
                label="Tout voir"
                href={`/catalogue${search ? `?search=${search}` : ''}`}
                active={!category}
              />
              {categories.map((cat) => (
                <FilterLink
                  key={cat.id}
                  label={cat.name}
                  href={`/catalogue?category=${cat.slug}${search ? `&search=${search}` : ''}`}
                  active={category === cat.slug}
                />
              ))}
            </FilterSection>
          )}
        </aside>

        {/* Grid */}
        <div className="catalogue-main">
          {/* Active filters bar */}
          {(search || category) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {search && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'var(--bem-black)', color: '#fff',
                  fontSize: '11px', fontWeight: 700, padding: '5px 10px',
                  borderRadius: '99px', letterSpacing: '0.06em',
                }}>
                  &ldquo;{search}&rdquo;
                  <Link href={`/catalogue${category ? `?category=${category}` : ''}`}
                    style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', lineHeight: 1 }}>
                    ×
                  </Link>
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--bem-gray-400)' }}>
                {total} résultat{total > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <ProductGrid products={products} columns={4} />

          {/* Pagination */}
          {totalPages > 1 && (
            <FadeIn>
              <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '48px' }}
                aria-label="Pagination">

                {currentPage > 1 && (
                  <Link href={buildHref(currentPage - 1)} style={pgStyle(false)}>‹</Link>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const show =
                    p === 1 || p === totalPages ||
                    Math.abs(p - currentPage) <= 1;
                  const isEllipsis =
                    (p === 2 && currentPage > 4) ||
                    (p === totalPages - 1 && currentPage < totalPages - 3);

                  if (!show && !isEllipsis) return null;
                  if (isEllipsis && !show) {
                    return (
                      <span key={p} style={{ ...pgStyle(false), cursor: 'default', color: 'var(--bem-gray-400)' }}>
                        …
                      </span>
                    );
                  }
                  return (
                    <Link key={p} href={buildHref(p)} style={pgStyle(p === currentPage)}>
                      {p}
                    </Link>
                  );
                })}

                {currentPage < totalPages && (
                  <Link href={buildHref(currentPage + 1)} style={pgStyle(false)}>›</Link>
                )}
              </nav>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function pgStyle(active: boolean): React.CSSProperties {
  return {
    width: '34px', height: '34px', borderRadius: '8px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: active ? '13px' : '14px', fontWeight: 600,
    textDecoration: 'none', transition: 'all .15s',
    background: active ? 'var(--bem-black)' : '#fff',
    color: active ? '#fff' : 'var(--bem-black)',
    border: active ? '1.5px solid var(--bem-black)' : '1.5px solid var(--bem-gray-100)',
  };
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--bem-gray-400)', marginBottom: '10px',
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {children}
      </div>
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      fontSize: '12px',
      color: active ? 'var(--bem-red)' : 'var(--bem-gray-700)',
      fontWeight: active ? 700 : 400,
      textDecoration: 'none',
      padding: '5px 8px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: active ? 'rgba(204,31,39,0.06)' : 'transparent',
      transition: 'background .15s, color .15s',
    }}
      className="hover:text-[var(--bem-red)] hover:bg-[rgba(204,31,39,0.04)]">
      {active && (
        <span style={{
          display: 'inline-block', width: '5px', height: '5px',
          borderRadius: '50%', background: 'var(--bem-red)', flexShrink: 0,
        }} />
      )}
      {label}
    </Link>
  );
}
