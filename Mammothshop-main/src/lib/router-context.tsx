import { createContext, useCallback, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { matchRoute, ROUTES, parseRoute } from './router';

export type QueryParams = Record<string, string>;

function parsePath(pathname: string, search: string): { pathname: string; query: QueryParams } {
  const query: QueryParams = {};
  if (search) {
    const searchParams = new URLSearchParams(search);
    searchParams.forEach((value, key) => {
      query[key] = value;
    });
  }
  return { pathname: pathname || '/', query };
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    router.navigate(to, replace);
  }, [router.navigate, to, replace]);

  return null;
}

type RouterContextValue = {
  path: string;
  route?: ReturnType<typeof parseRoute>;
  params: Record<string, string>;
  query: QueryParams;
  navigate: (to: string, replace?: boolean) => void;
  previousPath: string | null;
};

function useRouterInternal(): RouterContextValue {
  const [location, setLocation] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));
  const previousPathRef = useRef<string | null>(null);
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    const onPopState = () => {
      previousPathRef.current = pathnameRef.current;
      pathnameRef.current = window.location.pathname;
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateFn = useCallback((to: string, replace = false) => {
    const clean = to.startsWith('/') ? to : `/${to}`;
    previousPathRef.current = pathnameRef.current;
    pathnameRef.current = clean.split('?')[0];

    if (replace) {
      window.history.replaceState(null, '', clean);
    } else {
      window.history.pushState(null, '', clean);
    }

    setLocation({
      pathname: pathnameRef.current,
      search: clean.includes('?') ? '?' + clean.split('?')[1] : '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { pathname, query } = parsePath(location.pathname, location.search);
  const { route, params } = matchRoute(ROUTES, pathname);

  return {
    path: pathname,
    route,
    params,
    query,
    navigate: navigateFn,
    previousPath: previousPathRef.current,
  };
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const value = useRouterInternal();
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export function Link({
  to,
  children,
  className,
  onClick,
  replace,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  replace?: boolean;
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onClick?.();
    router.navigate(to, replace);
  };

  return (
    <a href={to} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
