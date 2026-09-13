import { useWishlist } from '@/lib/wishlist-context';
import { useCart } from '@/lib/cart-context';
import { Link } from '@/lib/router-context';
import { Seo } from '@/components/Seo';
import { EmptyState } from '@/components/Layout';
import { formatPrice, effectivePrice, toPersianDigits } from '@/lib/format';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

export function WishlistPage() {
  const { items, remove, clear } = useWishlist();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <>
        <Seo title="علاقه‌مندی‌ها" canonicalPath="/wishlist" />
        <div className="container mx-auto px-4 py-16">
          <EmptyState
            icon={<Heart className="w-10 h-10" />}
            title="لیست علاقه‌مندی‌های شما خالی است"
            description="محصولات مورد علاقه خود را به این لیست اضافه کنید تا بعداً به راحتی آن‌ها را پیدا کنید"
            action={<Link to="/shop" className="btn btn-primary mt-2">مشاهده فروشگاه</Link>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="علاقه‌مندی‌ها" canonicalPath="/wishlist" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-700">علاقه‌مندی‌های من</h1>
          <span className="text-sm text-gray-500">{toPersianDigits(items.length)} محصول</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((product) => (
            <div key={product.id} className="card p-4 flex gap-4">
              <Link to={`/product/${product.slug}`} className="shrink-0">
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg'}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-xl bg-gray-50"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${product.slug}`} className="font-600 text-gray-800 hover:text-primary-700 line-clamp-2 mb-1">
                  {product.name}
                </Link>
                {product.brand && <p className="text-xs text-gray-400 mb-2">{product.brand.name}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-700 text-primary-700">{formatPrice(effectivePrice(product))}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="btn btn-primary btn-sm"
                      disabled={product.stock === 0}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {product.stock === 0 ? 'ناموجود' : 'افزودن'}
                    </button>
                    <button
                      onClick={() => remove(product.id)}
                      className="p-2 rounded-lg text-error-500 hover:bg-error-50 transition-colors"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button onClick={clear} className="btn btn-ghost text-error-600">پاک کردن لیست</button>
        </div>
      </div>
    </>
  );
}
