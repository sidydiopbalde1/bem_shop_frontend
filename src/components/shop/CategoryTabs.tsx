'use client';

import { useState } from 'react';

const CATEGORIES = [
  { id: 'all',         label: 'Tout voir' },
  { id: 'vetements',   label: 'Vêtements' },
  { id: 'accessoires', label: 'Accessoires' },
  { id: 'tech',        label: 'Tech' },
  { id: 'papeterie',   label: 'Papeterie' },
  { id: 'goodies',     label: 'Goodies' },
];

type Props = {
  onChange: (slug: string) => void;
};

export default function CategoryTabs({ onChange }: Props) {
  const [active, setActive] = useState('all');

  function select(id: string) {
    setActive(id);
    onChange(id);
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => select(cat.id)}
          className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 whitespace-nowrap"
          style={{
            background: active === cat.id ? 'var(--bem-black)' : 'var(--bem-gray-50)',
            color: active === cat.id ? '#fff' : 'var(--bem-gray-700)',
            border: active === cat.id
              ? '1.5px solid var(--bem-black)'
              : '1.5px solid var(--bem-gray-100)',
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
