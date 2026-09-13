export function formatPrice(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  return num.toLocaleString('fa-IR');
}

export function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

export function formatJalaliDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function effectivePrice(product: {
  price: number;
  discount_price: number | null;
}): number {
  if (product.discount_price && product.discount_price > 0 && product.discount_price < product.price) {
    return product.discount_price;
  }
  return product.price;
}

export function discountPercent(product: {
  price: number;
  discount_price: number | null;
}): number {
  if (!product.discount_price || product.discount_price >= product.price) return 0;
  return Math.round(((product.price - product.discount_price) / product.price) * 100);
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

export function slugify(text: string): string {
  return text
    . toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function generateOrderNumber(): string {
  const now = new Date();
  const stamp = now.getTime().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DM-${stamp}-${rand}`;
}

export function stockStatus(stock: number, threshold = 5): {
  label: string;
  color: string;
} {
  if (stock === 0) return { label: 'ناموجود', color: 'badge-error' };
  if (stock <= threshold) return { label: `تنها ${toPersianDigits(stock)} عدد مانده`, color: 'badge-warning' };
  return { label: 'موجود', color: 'badge-success' };
}
