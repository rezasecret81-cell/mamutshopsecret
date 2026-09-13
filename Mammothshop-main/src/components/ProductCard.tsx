import { Link } from '@/lib/router-context';
import type { Product } from '@/lib/types';
import { formatPrice, discountPercent, effectivePrice, stockStatus, toPersianDigits } from '@/lib/format';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { useCompare } from '@/lib/compare-context';
import { ShoppingBag, Star, Heart, GitCompare, Eye, Zap } from 'lucide-react';
import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { toggle, has } = useWishlist();
  const { toggle: toggleCompare, has: hasCompare } = useCompare();
  const [adding, setAdding] = useState(false);
  const status = stockStatus(product.stock, product.low_stock_threshold);
  const discount = discountPercent(product);
  const price = effectivePrice(product);
  const isWishlisted = has(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    setAdding(true);
    addToCart(product, 1);
    setTimeout(() => setAdding(false), 600);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(product);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group/card relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-200 transition-all duration-500 hover:-translate-y-2 flex flex-col"
    >
      {/* Image container with gradient overlay */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={product.image_url || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

        {/* Top badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          {discount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-l from-error-500 to-error-600 text-white text-[11px] font-600 shadow-lg shadow-error-500/30">
              <Zap className="w-3 h-3" />
              ٪{toPersianDigits(discount)}
            </span>
          )}
          {product.is_bestseller && (
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-l from-amber-500 to-orange-500 text-white text-[11px] font-600 shadow-lg shadow-amber-500/30">
              پرفروش
            </span>
          )}
          {product.is_featured && (
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-l from-primary-600 to-primary-700 text-white text-[11px] font-600 shadow-lg shadow-primary-500/30">
              ویژه
            </span>
          )}
        </div>

        {/* Action buttons - left side */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <button
            onClick={handleWishlist}
            className={`w-9 h-9 rounded-full backdrop-blur-md shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              isWishlisted
                ? 'bg-error-500 text-white'
                : 'bg-white/90 text-gray-500 hover:bg-error-500 hover:text-white'
            }`}
            aria-label="افزودن به علاقه‌مندی‌ها"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleCompare}
            className={`w-9 h-9 rounded-full backdrop-blur-md shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              hasCompare(product.id)
                ? 'bg-primary-600 text-white'
                : 'bg-white/90 text-gray-500 hover:bg-primary-600 hover:text-white opacity-0 group-hover/card:opacity-100'
            }`}
            aria-label="افزودن به مقایسه"
          >
            <GitCompare className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom action bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white to-transparent translate-y-full group-hover/card:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAdd}
            disabled={product.stock === 0 || adding}
            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-600 transition-all duration-300 ${
              product.stock === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30'
            }`}
            aria-label="افزودن به سبد"
          >
            {adding ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال افزودن...
              </span>
            ) : product.stock === 0 ? (
              'ناموجود'
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                افزودن به سبد
              </>
            )}
          </button>
        </div>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-600">ناموجود</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Brand */}
        {product.brand && (
          <span className="text-[11px] text-primary-600 font-600 mb-1.5 uppercase tracking-wide">{product.brand.name}</span>
        )}

        {/* Title */}
        <h3 className="text-sm font-600 text-gray-800 line-clamp-2 mb-3 group-hover:text-primary-700 transition-colors leading-relaxed min-h-[2.75rem]">
          {product.name}
        </h3>

        {/* Rating & Stock */}
        <div className="flex items-center gap-2 mb-3">
          {product.rating > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-600 text-amber-700">{toPersianDigits(product.rating.toFixed(1))}</span>
            </div>
          )}
          <span className={`text-[11px] font-500 px-2 py-0.5 rounded-full ${
            status.color.includes('success') ? 'bg-success-50 text-success-700' :
            status.color.includes('warning') ? 'bg-warning-50 text-warning-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {status.label}
          </span>
        </div>

        {/* Price section */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1">
              {discount > 0 && (
                <p className="text-xs text-gray-400 line-through mb-0.5">{formatPrice(product.price)} تومان</p>
              )}
              <p className="text-lg font-800 text-gray-900">
                {formatPrice(price)}
                <span className="text-[11px] font-500 text-gray-500 mr-1.5">تومان</span>
              </p>
            </div>
            {product.stock > 0 && (
              <div className="flex items-center gap-1 text-success-600 text-[11px] font-500">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                موجود
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="aspect-square skeleton" />
      <div className="p-4">
        <div className="h-2.5 w-1/4 skeleton rounded-full mb-3" />
        <div className="h-4 w-full skeleton rounded-lg mb-2" />
        <div className="h-4 w-2/3 skeleton rounded-lg mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-12 skeleton rounded-full" />
          <div className="h-5 w-16 skeleton rounded-full" />
        </div>
        <div className="h-6 w-1/2 skeleton rounded-lg" />
      </div>
    </div>
  );
}

