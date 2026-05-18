'use client';

import { useRouter } from 'next/navigation';

const CATS = [
  { id: '',            label: 'Tout voir' },
  { id: 'vetements',   label: 'Vêtements' },
  { id: 'accessoires', label: 'Accessoires' },
  { id: 'tech',        label: 'Tech' },
  { id: 'papeterie',   label: 'Papeterie' },
  { id: 'goodies',     label: 'Goodies' },
];

type Props = {
  activeCategory?: string;
  search?: string;
  sort?: string;
};

export default function CatalogueFilters({ activeCategory, search, sort }: Props) {
  const router = useRouter();

  function select(id: string) {
    const q = new URLSearchParams();
    q.set('page', '1');
    if (id)     q.set('category', id);
    if (search) q.set('search', search);
    if (sort)   q.set('sort', sort);
    router.push(`/catalogue?${q.toString()}`);
  }

  return (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '1px' }}>
      {CATS.map((cat) => {
        const isActive = (cat.id === '' && !activeCategory) || cat.id === activeCategory;
        return (
          <button
            key={cat.id}
            onClick={() => select(cat.id)}
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
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
