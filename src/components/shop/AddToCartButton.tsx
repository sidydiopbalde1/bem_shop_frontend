'use client';

import { useState } from 'react';
import { useCart } from '@/lib/CartContext';
import type { CartItem } from '@/lib/types/shop.types';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingBag, Minus, Plus } from 'lucide-react';

type Props = {
  productId: string;
  isOutOfStock: boolean;
  product?: Pick<CartItem['product'], 'id' | 'name' | 'price' | 'imageUrls'>;
};

export default function AddToCartButton({ productId, isOutOfStock, product }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function change(delta: number) {
    setQty((q) => Math.max(1, q + delta));
  }

  function handleAdd() {
    if (isOutOfStock || added) return;
    const p = product ?? { id: productId, name: '', price: 0, imageUrls: [] };
    addItem(p, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="space-y-5">
      {/* Quantity selector */}
      {!isOutOfStock && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-3 text-gray-500">
            Quantité
          </p>
          <div className="inline-flex items-center rounded-full bg-gray-50 border-[1.5px] border-gray-100 p-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => change(-1)}
              disabled={qty <= 1}
              aria-label="Diminuer"
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                qty <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-black hover:bg-white hover:shadow-sm cursor-pointer'
              }`}
            >
              <Minus size={18} strokeWidth={2} />
            </motion.button>
            
            <span className="w-10 text-center font-semibold text-lg select-none">
              {qty}
            </span>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => change(1)}
              aria-label="Augmenter"
              className="w-10 h-10 flex items-center justify-center rounded-full text-black hover:bg-white hover:shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={18} strokeWidth={2} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Add to cart button */}
      <motion.button
        whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
        whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`relative w-full h-[56px] rounded-full text-[15px] font-semibold tracking-wide overflow-hidden transition-colors ${
          isOutOfStock 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : added 
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' 
              : 'bg-black text-white hover:shadow-xl hover:shadow-black/20'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOutOfStock ? (
            <motion.span key="out-of-stock" className="flex items-center justify-center w-full h-full">
              Rupture de stock
            </motion.span>
          ) : added ? (
            <motion.span 
              key="added"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center justify-center gap-2 w-full h-full"
            >
              <Check size={20} strokeWidth={3} />
              Ajouté au panier !
            </motion.span>
          ) : (
            <motion.span 
              key="add"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center justify-center gap-2 w-full h-full"
            >
              <ShoppingBag size={20} strokeWidth={2} />
              Ajouter au panier
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
