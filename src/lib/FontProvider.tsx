'use client';
import { useEffect } from 'react';

export type FontId = 'arciform' | 'dm-sans' | 'poppins' | 'plus-jakarta' | 'playfair';

export const FONT_OPTIONS: {
  id: FontId;
  label: string;
  stack: string;
  description: string;
  isSerif?: boolean;
}[] = [
  {
    id: 'arciform',
    label: 'Arciform',
    stack: "'Arciform', sans-serif",
    description: 'Géométrique moderne · Défaut',
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    stack: 'var(--font-dm-sans), sans-serif',
    description: 'Propre et très lisible',
  },
  {
    id: 'poppins',
    label: 'Poppins',
    stack: 'var(--font-poppins), sans-serif',
    description: 'Arrondi et chaleureux',
  },
  {
    id: 'plus-jakarta',
    label: 'Plus Jakarta',
    stack: 'var(--font-plus-jakarta), sans-serif',
    description: 'Contemporain et élégant',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    stack: 'var(--font-playfair), serif',
    description: 'Classique et raffiné',
    isSerif: true,
  },
];

const STORAGE_KEY = 'bem_site_font';

export function getFontStack(id: string): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.stack ?? FONT_OPTIONS[0].stack;
}

export function applyFont(id: string) {
  document.documentElement.style.setProperty('--font-primary', getFontStack(id));
  localStorage.setItem(STORAGE_KEY, id);
}

export function FontProvider() {
  useEffect(() => {
    // Apply cached font instantly to avoid FOUC on repeat visits
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      document.documentElement.style.setProperty('--font-primary', getFontStack(cached));
    }

    // Sync with server
    fetch('/api/settings')
      .then((r) => r.json())
      .then(({ font }: { font: string }) => {
        applyFont(font);
      })
      .catch(() => {});
  }, []);

  return null;
}
