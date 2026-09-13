import { createContext, useContext, useRef, useCallback, useEffect, type ReactNode } from 'react';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

type PageState = {
  search: string;
  filters: Record<string, string>;
  page: number;
  sort: string;
  selectedRows: string[];
  scrollPosition: number;
  formState: Record<string, unknown>;
  activeTab: string;
  expandedSections: string[];
  [key: string]: unknown;
};

type AdminState = {
  products: PageState;
  orders: PageState;
  users: PageState;
  categories: PageState;
  brands: PageState;
  coupons: PageState;
  tickets: PageState;
  reviews: PageState;
  chat: PageState;
  [key: string]: PageState;
};

type CacheContextValue = {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttlMs?: number) => void;
  invalidate: (key: string) => void;
  invalidatePattern: (pattern: string) => void;
  getAdminState: (section: string) => PageState;
  setAdminState: (section: string, state: Partial<PageState>) => void;
  clearAdminState: (section: string) => void;
};

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const DEFAULT_PAGE_STATE: PageState = {
  search: '',
  filters: {},
  page: 1,
  sort: '',
  selectedRows: [],
  scrollPosition: 0,
  formState: {},
  activeTab: '',
  expandedSections: [],
};

const CacheContext = createContext<CacheContextValue | undefined>(undefined);

export function CacheProvider({ children }: { children: ReactNode }) {
  const cacheRef = useRef<Map<string, CacheEntry<unknown>>>(new Map());
  const adminStateRef = useRef<AdminState>({
    products: { ...DEFAULT_PAGE_STATE },
    orders: { ...DEFAULT_PAGE_STATE },
    users: { ...DEFAULT_PAGE_STATE },
    categories: { ...DEFAULT_PAGE_STATE },
    brands: { ...DEFAULT_PAGE_STATE },
    coupons: { ...DEFAULT_PAGE_STATE },
    tickets: { ...DEFAULT_PAGE_STATE },
    reviews: { ...DEFAULT_PAGE_STATE },
    chat: { ...DEFAULT_PAGE_STATE },
  });

  // Load admin state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('adminState');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AdminState>;
        adminStateRef.current = { ...adminStateRef.current, ...parsed };
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save admin state to sessionStorage on changes
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        sessionStorage.setItem('adminState', JSON.stringify(adminStateRef.current));
      } catch {
        // Ignore errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const get = useCallback(<T,>(key: string): T | null => {
    const entry = cacheRef.current.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      cacheRef.current.delete(key);
      return null;
    }
    return entry.data;
  }, []);

  const set = useCallback(<T,>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }, []);

  const invalidate = useCallback((key: string): void => {
    cacheRef.current.delete(key);
  }, []);

  const invalidatePattern = useCallback((pattern: string): void => {
    const regex = new RegExp(pattern);
    for (const key of cacheRef.current.keys()) {
      if (regex.test(key)) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  const getAdminState = useCallback((section: string): PageState => {
    return adminStateRef.current[section] || { ...DEFAULT_PAGE_STATE };
  }, []);

  const setAdminState = useCallback((section: string, state: Partial<PageState>): void => {
    adminStateRef.current[section] = {
      ...adminStateRef.current[section],
      ...DEFAULT_PAGE_STATE,
      ...state,
    };
    // Save immediately for important changes
    try {
      sessionStorage.setItem('adminState', JSON.stringify(adminStateRef.current));
    } catch {
      // Ignore
    }
  }, []);

  const clearAdminState = useCallback((section: string): void => {
    adminStateRef.current[section] = { ...DEFAULT_PAGE_STATE };
    try {
      sessionStorage.setItem('adminState', JSON.stringify(adminStateRef.current));
    } catch {
      // Ignore
    }
  }, []);

  return (
    <CacheContext.Provider
      value={{
        get,
        set,
        invalidate,
        invalidatePattern,
        getAdminState,
        setAdminState,
        clearAdminState,
      }}
    >
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const ctx = useContext(CacheContext);
  if (!ctx) throw new Error('useCache must be used within CacheProvider');
  return ctx;
}

// Hook for cached API calls
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
) {
  const { get, set } = useCache();
  const { ttl = DEFAULT_TTL, enabled = true } = options;

  const cached = get<T>(key);

  const fetchData = useCallback(async (): Promise<T> => {
    const data = await fetcher();
    set(key, data, ttl);
    return data;
  }, [key, fetcher, set, ttl]);

  return {
    data: cached,
    isLoading: cached === null,
    refetch: fetchData,
  };
}
