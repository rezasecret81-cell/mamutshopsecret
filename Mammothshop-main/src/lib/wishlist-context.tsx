import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from './types';

type WishlistContextValue = {
  items: Product[];
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  count: number;
  clear: () => void;
};

const STORAGE_KEY = 'mammoth_wishlist';

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      /* noop */
    }
  }, []);

  const persist = (next: Product[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  const toggle = (product: Product) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      const next = exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
      persist(next);
      return next;
    });
  };

  const remove = (productId: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      persist(next);
      return next;
    });
  };

  const has = (productId: string) => items.some((p) => p.id === productId);
  const clear = () => persist([]);

  return (
    <WishlistContext.Provider value={{ items, toggle, remove, has, count: items.length, clear }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
