'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ProductCard from './ProductCard';

type Props = {
  products: {
    id: string; name: string; price: number | string;
    stock: number; imageUrls: string[];
  }[];
  columns?: 2 | 3 | 4 | 5 | 6;
};

const gridClassMap: Record<number, string> = {
  2: 'product-grid-cols-2',
  3: 'product-grid-cols-3',
  4: 'product-grid-cols-4',
  5: 'product-grid-cols-5',
  6: 'product-grid-cols-6',
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ProductGrid({ products, columns = 4 }: Props) {
  const shouldReduce = useReducedMotion();

  if (products.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--bem-gray-400)', fontSize: '14px' }}>
        Aucun produit disponible pour le moment.
      </div>
    );
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldReduce ? 0 : 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: shouldReduce ? 1 : 0, y: shouldReduce ? 0 : 20, scale: shouldReduce ? 1 : 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: EASE },
    },
  };

  return (
    <motion.div
      className={gridClassMap[columns] ?? 'product-grid-cols-4'}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      <AnimatePresence>
        {products.map((p) => (
          <motion.div key={p.id} variants={itemVariants}>
            <ProductCard product={p} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
