'use client';

import {
  createContext, useContext, useEffect, useState,
  useCallback, useRef, type ReactNode,
} from 'react';
import type { CartItem } from './types/shop.types';
import { guestCart } from './guestCart';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type CartCtx = {
  items: CartItem[];
  count: number;
  ready: boolean;
  addItem: (product: CartItem['product'], qty: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // Start empty (matches SSR) — populate after hydration to avoid mismatch
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const isGuest = useRef(false);

  useEffect(() => {
    // Load localStorage first so guests see their cart before the API responds
    const local = guestCart.getItems() as CartItem[];
    if (local.length > 0) setItems(local);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    fetch(`${API}/cart`, { credentials: 'include', signal: controller.signal })
      .then(async (res) => {
        if (res.status === 401) {
          isGuest.current = true;
        } else if (res.ok) {
          isGuest.current = false;
          const data = await res.json();
          const apiItems: CartItem[] = Array.isArray(data)
            ? data
            : (data.items ?? data.data ?? []);
          setItems(apiItems);
        }
      })
      .catch(() => { isGuest.current = true; })
      .finally(() => { clearTimeout(timer); setReady(true); });
  }, []);

  const count = items.reduce((s, i) => s + i.quantity, 0);

  const addItem = useCallback((product: CartItem['product'], qty: number) => {
    // Instant optimistic update
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        return prev.map((item, j) =>
          j === idx ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { productId: product.id, product, quantity: qty }];
    });

    // Background sync
    fetch(`${API}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId: product.id, quantity: qty }),
    })
      .then((res) => { if (res.status === 401) guestCart.addItem(product, qty); })
      .catch(() => guestCart.addItem(product, qty));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    if (isGuest.current) guestCart.removeItem(productId);

    fetch(`${API}/cart/items/${productId}`, { method: 'DELETE', credentials: 'include' })
      .then((res) => { if (res.status === 401) guestCart.removeItem(productId); })
      .catch(() => {});
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i)
    );
    if (isGuest.current) guestCart.updateQty(productId, qty);

    fetch(`${API}/cart/items/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantity: qty }),
    })
      .then((res) => { if (res.status === 401) guestCart.updateQty(productId, qty); })
      .catch(() => {});
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    guestCart.clear?.();
    fetch(`${API}/cart`, { method: 'DELETE', credentials: 'include' }).catch(() => {});
  }, []);

  return (
    <CartContext.Provider value={{ items, count, ready, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
