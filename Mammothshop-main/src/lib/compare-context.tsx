import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from './types';

type CompareContextValue = {
  items: Product[];
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  count: number;
  clear: () => void;
};

const STORAGE_KEY = 'mammoth_compare';
const MAX_COMPARE = 4;

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
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
      if (exists) {
        const next = prev.filter((p) => p.id !== product.id);
        persist(next);
        return next;
      }
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, product];
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
    <CompareContext.Provider value={{ items, toggle, remove, has, count: items.length, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
