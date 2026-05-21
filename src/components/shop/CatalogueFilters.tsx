'use client';

import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types/shop.types';

type Props = {
  categories: Category[];
  activeCategory?: string;
  search?: string;
  sort?: string;
};

export default function CatalogueFilters({ categories, activeCategory, search, sort }: Props) {
  const router = useRouter();

  function select(slug: string) {
    const q = new URLSearchParams();
    q.set('page', '1');
    if (slug)   q.set('category', slug);
    if (search) q.set('search', search);
    if (sort)   q.set('sort', sort);
    router.push(`/catalogue?${q.toString()}`);
  }

  const all = [{ id: '', name: 'Tout voir', slug: '' }, ...categories];

  return (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '1px' }}>
      {all.map((cat) => {
        const isActive = (cat.slug === '' && !activeCategory) || cat.slug === activeCategory;
        return (
          <button
            key={cat.slug || '__all'}
            onClick={() => select(cat.slug)}
            style={{
              flexShrink: 0,
              padding: '7px 16px',
              borderRadius: '99px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              border: isActive
                ? '1.5px solid var(--bem-black)'
                : '1.5px solid var(--bem-gray-100)',
              background: isActive ? 'var(--bem-black)' : '#fff',
              color: isActive ? '#fff' : 'var(--bem-gray-700)',
              transition: 'all .15s',
              marginBottom: '-1px',
            }}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
