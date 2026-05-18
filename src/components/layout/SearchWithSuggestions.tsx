'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search } from 'lucide-react';

type Suggestion = {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  category: { name: string };
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchWithSuggestions() {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<Suggestion[]>([]);
  const [loading, setLoading]     = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const wrapperRef                = useRef<HTMLDivElement>(null);
  const router                    = useRouter();
  const debouncedQuery            = useDebounce(query, 280);

  // Fetch suggestions
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?search=${encodeURIComponent(debouncedQuery)}&limit=5`)
      .then((r) => r.json())
      .then((data) => setResults(data.data ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/catalogue?search=${encodeURIComponent(q)}`);
    setQuery('');
    setOpen(false);
  }

  function handleSelect(id: string) {
    router.push(`/produits/${id}`);
    setQuery('');
    setOpen(false);
  }

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={wrapperRef} className="relative hidden md:block" style={{ width: '340px' }}>
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-2 px-4 transition-all duration-200"
          style={{
            height: '40px',
            borderRadius: '8px',
            background: 'var(--bem-gray-50)',
            border: open ? '1.5px solid var(--bem-black)' : '1.5px solid var(--bem-gray-100)',
          }}
        >
          <Search size={16} className="flex-shrink-0 text-[var(--bem-gray-400)]" strokeWidth={1.8} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Rechercher un produit, une marque…"
            className="flex-1 bg-transparent outline-none border-none text-[13px] text-[var(--bem-black)] placeholder:text-[var(--bem-gray-400)]"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); }}
              className="flex-shrink-0 text-[var(--bem-gray-400)] hover:text-[var(--bem-black)] transition-colors text-lg leading-none">
              ×
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white shadow-2xl z-[100] overflow-hidden"
          style={{ borderRadius: '10px', border: '1px solid var(--bem-gray-100)' }}
        >
          {/* Loading */}
          {loading && (
            <div className="p-4 text-center text-[13px] text-[var(--bem-gray-400)]">
              Recherche en cours…
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <>
              <div className="px-4 py-2.5 border-b border-[var(--bem-gray-100)] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--bem-gray-400)]">
                  Produits suggérés
                </span>
                <button onClick={() => router.push(`/catalogue?search=${encodeURIComponent(query)}`)}
                  className="text-[11px] font-bold text-[var(--bem-red)] hover:underline uppercase tracking-wide">
                  Tout voir →
                </button>
              </div>

              <ul>
                {results.map((product) => {
                  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
                  const formatted = new Intl.NumberFormat('fr-SN', {
                    style: 'currency', currency: 'XOF', minimumFractionDigits: 0,
                  }).format(price);

                  return (
                    <li key={product.id}>
                      <button
                        onClick={() => handleSelect(product.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bem-gray-50)] transition-colors text-left"
                      >
                        <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[var(--bem-gray-100)]">
                          {product.imageUrls?.[0] ? (
                            <Image src={product.imageUrls[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="w-full h-full bg-[var(--bem-gray-100)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--bem-black)] truncate">{product.name}</p>
                          <p className="text-[11px] text-[var(--bem-gray-400)]">{product.category.name}</p>
                        </div>
                        <span className="text-[13px] font-bold text-[var(--bem-red)] flex-shrink-0">{formatted}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Full search CTA */}
              <button
                onClick={() => router.push(`/catalogue?search=${encodeURIComponent(query)}`)}
                className="w-full flex items-center justify-center gap-2 py-3 border-t border-[var(--bem-gray-100)] text-[12px] font-bold uppercase tracking-widest text-[var(--bem-black)] hover:bg-[var(--bem-gray-50)] transition-colors"
              >
                <Search size={14} strokeWidth={2} />
                Résultats complets pour &ldquo;{query}&rdquo;
              </button>
            </>
          )}

          {/* Empty */}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="px-4 py-6 text-center">
              <p className="text-[13px] text-[var(--bem-gray-400)]">Aucun produit trouvé pour &ldquo;{query}&rdquo;</p>
              <button
                onClick={() => router.push(`/catalogue?search=${encodeURIComponent(query)}`)}
                className="mt-2 text-[12px] font-bold text-[var(--bem-red)] hover:underline"
              >
                Voir tout le catalogue →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
