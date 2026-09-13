export type RouteParams = Record<string, string>;

export type Route = {
  path: string;
  pattern: RegExp;
  keys: string[];
};

export function parseRoute(pattern: string): Route {
  const keys: string[] = [];
  const regex = pattern.replace(/:([^/]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  }).replace(/\//g, '\\/');
  return { path: pattern, pattern: new RegExp(`^${regex}$`), keys };
}

export function matchRoute(routes: Route[], pathname: string): { route?: Route; params: RouteParams } {
  for (const route of routes) {
    const match = pathname.match(route.pattern);
    if (match) {
      const params: RouteParams = {};
      route.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(match[i + 1]);
      });
      return { route, params };
    }
  }
  return { params: {} };
}

const ROUTE_DEFINITIONS = [
  '/', '/shop', '/product/:slug', '/category/:slug', '/cart', '/checkout', '/wishlist', '/compare', '/faq',
  '/login', '/register', '/forgot-password', '/account', '/account/profile',
  '/account/addresses', '/account/orders', '/account/tickets', '/account/chat',
  '/admin', '/admin/products', '/admin/orders', '/admin/users', '/admin/categories',
  '/admin/brands', '/admin/coupons', '/admin/tickets', '/admin/inventory', '/admin/reviews',
  '/admin/reports', '/admin/faqs', '/admin/flash-sales', '/admin/settings', '/admin/chat', '/admin/seo',
  '/about', '/contact', '/terms', '/shipping', '/returns', '/privacy',
  '/order/:orderNumber', '/payment/verify',
];

export const ROUTES = ROUTE_DEFINITIONS.map(parseRoute);
