import type { CartItem } from './types/shop.types';

const KEY = 'bem_guest_cart';

export type GuestCartEntry = {
  productId: string;
  product: Pick<CartItem['product'], 'id' | 'name' | 'price' | 'imageUrls'>;
  quantity: number;
};

function read(): GuestCartEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function write(entries: GuestCartEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export const guestCart = {
  getItems(): GuestCartEntry[] {
    return read();
  },

  addItem(product: GuestCartEntry['product'], quantity: number) {
    const items = read();
    const idx = items.findIndex((i) => i.productId === product.id);
    if (idx >= 0) {
      items[idx].quantity += quantity;
    } else {
      items.push({ productId: product.id, product, quantity });
    }
    write(items);
  },

  removeItem(productId: string) {
    write(read().filter((i) => i.productId !== productId));
  },

  updateQty(productId: string, quantity: number) {
    const items = read();
    const idx = items.findIndex((i) => i.productId === productId);
    if (idx >= 0) {
      items[idx].quantity = quantity;
      write(items);
    }
  },

  clear() {
    localStorage.removeItem(KEY);
  },
};
