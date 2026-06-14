'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Category } from '@/lib/types/shop.types';

type Props = {
  categories: Category[];
  activeCategory?: string;
  search?: string;
  sort?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CatalogueFilters({ categories, activeCategory, search, sort }: Props) {
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  // Track locally so layoutId animates before navigation
  const [localActive, setLocalActive] = useState(activeCategory ?? '');

  function select(slug: string) {
    setLocalActive(slug);
    const q = new URLSearchParams();
    q.set('page', '1');
    if (slug)   q.set('category', slug);
    if (search) q.set('search', search);
    if (sort)   q.set('sort', sort);
    router.push(`/catalogue?${q.toString()}`);
  }

  const all = [{ id: '', name: 'Tout voir', slug: '' }, ...categories];

  return (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
      {all.map((cat) => {
        const isActive = cat.slug === localActive ||
          (cat.slug === '' && !localActive && !activeCategory);
        return (
          <button
            key={cat.slug || '__all'}
            onClick={() => select(cat.slug)}
            style={{
              position: 'relative',
              flexShrink: 0,
              padding: '7px 16px',
              borderRadius: '99px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              border: isActive
                ? '1.5px solid transparent'
                : '1.5px solid var(--bem-gray-100)',
              background: 'transparent',
              color: isActive ? '#fff' : 'var(--bem-gray-700)',
              transition: 'color .15s, border-color .15s',
              marginBottom: '-1px',
            }}
          >
            {/* Sliding pill background */}
            {isActive && !shouldReduce && (
              <motion.span
                layoutId="filter-pill-bg"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '99px',
                  background: 'var(--bem-black)',
                  zIndex: 0,
                }}
                transition={{ duration: 0.3, ease: EASE }}
              />
            )}
            {isActive && shouldReduce && (
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '99px',
                  background: 'var(--bem-black)',
                  zIndex: 0,
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
