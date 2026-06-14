'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCart } from '@/lib/CartContext';

interface Product {
  id: string;
  name: string;
  price: number | string;
  stock: number;
  imageUrls: string[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ProductCard({ product }: { product: Product }) {
  const [adding, setAdding] = useState(false);
  const [done, setDone]     = useState(false);
  const { addItem }         = useCart();
  const shouldReduce        = useReducedMotion();

  const isSoldOut = product.stock === 0;
  const price     = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const formatted = new Intl.NumberFormat('fr-SN', {
    style: 'currency', currency: 'XOF', minimumFractionDigits: 0,
  }).format(price);

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut || adding) return;
    setAdding(true);
    try {
      await addItem({ id: product.id, name: product.name, price, imageUrls: product.imageUrls }, 1);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } finally {
      setAdding(false);
    }
  }

  return (
    <motion.div
      className="product-card-hover group flex flex-col"
      whileHover={shouldReduce ? {} : { y: -4 }}
      transition={{ duration: 0.25, ease: EASE }}
      style={{ willChange: 'transform', borderRadius: '12px' }}
    >
      {/* Image */}
      <Link href={`/produits/${product.id}`}>
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: '1/1', borderRadius: '10px', background: 'var(--bem-gray-50)' }}
        >
          {product.imageUrls?.[0] ? (
            <Image
              src={product.imageUrls[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: '12px', color: 'var(--bem-gray-400)' }}>Image à venir</span>
            </div>
          )}

          {isSoldOut && (
            <span
              className="absolute top-2.5 left-2.5 bg-white text-[10px] font-bold uppercase tracking-wider px-2 py-1"
              style={{ borderRadius: '4px', color: 'var(--bem-black)', border: '1px solid var(--bem-gray-100)' }}
            >
              Épuisé
            </span>
          )}
        </div>
      </Link>

      {/* Info + bouton */}
      <div className="flex flex-col flex-1 mt-3 gap-2">
        <Link href={`/produits/${product.id}`} className="flex-1">
          <p
            className="text-[13px] font-semibold leading-snug truncate transition-colors duration-150"
            style={{ color: 'var(--bem-black)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bem-red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bem-black)')}
          >
            {product.name}
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--bem-gray-700)', fontWeight: 500 }}>
            {formatted}
          </p>
        </Link>

        {/* Bouton ajouter au panier */}
        <motion.button
          onClick={handleAdd}
          disabled={isSoldOut || adding}
          whileTap={(!isSoldOut && !shouldReduce) ? { scale: 0.96 } : {}}
          className="w-full transition-colors duration-200"
          style={{
            minHeight: '44px',
            padding: '9px 0',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: isSoldOut ? 'not-allowed' : 'pointer',
            background: done
              ? '#16a34a'
              : isSoldOut
              ? 'var(--bem-gray-100)'
              : 'var(--bem-black)',
            color: isSoldOut ? 'var(--bem-gray-400)' : '#fff',
            border: 'none',
          }}
        >
          {isSoldOut
            ? 'Épuisé'
            : done
            ? '✓ Ajouté'
            : adding
            ? '…'
            : '+ Ajouter au panier'}
        </motion.button>
      </div>
    </motion.div>
  );
}
