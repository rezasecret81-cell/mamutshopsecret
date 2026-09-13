import { useCart } from '@/lib/cart-context';
import { useRouter, Link } from '@/lib/router-context';
import { Seo } from '@/components/Seo';
import { EmptyState } from '@/components/Layout';
import { formatPrice, effectivePrice, toPersianDigits } from '@/lib/format';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

export function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice, itemCount, clearCart } = useCart();
  const { navigate } = useRouter();

  if (items.length === 0) {
    return (
      <>
        <Seo title="سبد خرید" />
        <div className="container mx-auto px-4 py-16">
          <EmptyState
            icon={<ShoppingBag className="w-10 h-10" />}
            title="سبد خرید شما خالی است"
            description="برای شروع خرید به فروشگاه بروید و محصولات مورد علاقه خود را اضافه کنید"
            action={<Link to="/shop" className="btn btn-primary mt-2">شروع خرید</Link>}
          />
        </div>
      </>
    );
  }

  const shipping = totalPrice >= 5000000 ? 0 : 150000;
  const grandTotal = totalPrice + shipping;

  return (
    <>
      <Seo title="سبد خرید" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-700">سبد خرید</h1>
          <span className="text-sm text-gray-500">{toPersianDigits(itemCount)} کالا</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const unit = effectivePrice(item.product);
              return (
                <div key={item.product.id} className="card p-4 flex gap-4">
                  <Link to={`/product/${item.product.slug}`} className="shrink-0">
                    <img
                      src={item.product.image_url || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg'}
                      alt={item.product.name}
                      className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl bg-gray-50"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product.slug}`} className="block font-600 text-gray-800 hover:text-primary-700 line-clamp-2 mb-1">
                      {item.product.name}
                    </Link>
                    {item.product.brand && <p className="text-xs text-gray-400 mb-2">{item.product.brand.name}</p>}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-700">{toPersianDigits(item.quantity)}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-error-500 hover:bg-error-50 p-2 rounded-lg transition-colors"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-700 text-primary-700">{formatPrice(unit * item.quantity)}</p>
                    <p className="text-xs text-gray-400 mt-1">تومان</p>
                    {item.quantity > 1 && <p className="text-xs text-gray-400 mt-2">{formatPrice(unit)} × {toPersianDigits(item.quantity)}</p>}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/shop')} className="btn btn-ghost btn-sm">
                <ArrowLeft className="w-4 h-4" /> ادامه خرید
              </button>
              <button onClick={clearCart} className="text-xs text-error-600 hover:underline">پاک کردن سبد</button>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h3 className="font-700 mb-4">خلاصه سفارش</h3>
              <div className="space-y-2 text-sm">
                <Row label="جمع کالاها" value={`${formatPrice(totalPrice)} تومان`} />
                <Row
                  label="هزینه ارسال"
                  value={shipping === 0 ? <span className="text-success-600 font-600">رایگان</span> : `${formatPrice(shipping)} تومان`}
                />
                {shipping > 0 && (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                    برای ارسال رایگان {formatPrice(5000000 - totalPrice)} تومان دیگر خرید کنید
                  </p>
                )}
              </div>
              <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
                <span className="font-600">مبلغ قابل پرداخت</span>
                <span className="font-800 text-primary-700 text-lg">{formatPrice(grandTotal)}</span>
              </div>
              <span className="block text-xs text-gray-400 text-left mb-3">تومان</span>
              <button onClick={() => navigate('/checkout')} className="btn btn-primary w-full btn-lg">
                ادامه و تسویه حساب
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-500 text-gray-800">{value}</span>
    </div>
  );
}
