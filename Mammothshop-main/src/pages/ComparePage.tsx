import { useCompare } from '@/lib/compare-context';
import { Link } from '@/lib/router-context';
import { Seo } from '@/components/Seo';
import { formatPrice, effectivePrice, toPersianDigits } from '@/lib/format';
import { useCart } from '@/lib/cart-context';
import { ShoppingBag, X, GitCompare } from 'lucide-react';
import { useEffect } from 'react';

export function ComparePage() {
  const { items, remove, clear } = useCompare();
  const { addToCart } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (items.length === 0) {
    return (
      <>
        <Seo title="مقایسه محصولات" canonicalPath="/compare" />
        <div className="container mx-auto px-4 py-16">
          <div className="card p-8 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
              <GitCompare className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-600 text-gray-800">لیست مقایسه شما خالی است</h3>
            <p className="text-sm text-gray-500 max-w-md">برای مقایسه محصولات، از دکمه مقایسه در صفحه محصول استفاده کنید.</p>
            <Link to="/shop" className="btn btn-primary mt-2">مشاهده فروشگاه</Link>
          </div>
        </div>
      </>
    );
  }

  const allSpecKeys = Array.from(new Set(items.flatMap((p) => Object.keys(p.specifications || {}))));

  return (
    <>
      <Seo title="مقایسه محصولات" canonicalPath="/compare" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-700">مقایسه محصولات</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{toPersianDigits(items.length)} محصول</span>
            <button onClick={clear} className="text-xs text-error-600 hover:underline">پاک کردن همه</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="sticky right-0 bg-white p-3 w-32 shrink-0 font-600 text-sm text-gray-500 border-b">محصول</td>
                {items.map((p) => (
                  <td key={p.id} className="p-3 border-b border-r border-gray-100 min-w-[200px]">
                    <div className="relative">
                      <button
                        onClick={() => remove(p.id)}
                        className="absolute -top-1 left-0 w-6 h-6 rounded-full bg-error-50 text-error-500 flex items-center justify-center hover:bg-error-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <Link to={`/product/${p.slug}`}>
                        <img src={p.image_url || ''} alt={p.name} className="w-full aspect-square object-cover rounded-xl bg-gray-50 mb-2" />
                        <p className="text-sm font-600 text-gray-800 hover:text-primary-700 line-clamp-2">{p.name}</p>
                        {p.brand && <p className="text-xs text-gray-400">{p.brand.name}</p>}
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky right-0 bg-white p-3 font-600 text-sm text-gray-500 border-b">قیمت</td>
                {items.map((p) => (
                  <td key={p.id} className="p-3 border-b border-r border-gray-100">
                    <span className="font-700 text-primary-700">{formatPrice(effectivePrice(p))}</span>
                    <span className="text-xs text-gray-400 mr-1">تومان</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky right-0 bg-white p-3 font-600 text-sm text-gray-500 border-b">موجودی</td>
                {items.map((p) => (
                  <td key={p.id} className="p-3 border-b border-r border-gray-100">
                    <span className={`text-sm ${p.stock > 0 ? 'text-success-600' : 'text-error-500'}`}>
                      {p.stock > 0 ? `${toPersianDigits(p.stock)} عدد موجود` : 'ناموجود'}
                    </span>
                  </td>
                ))}
              </tr>
              {allSpecKeys.map((specKey) => (
                <tr key={specKey}>
                  <td className="sticky right-0 bg-white p-3 font-600 text-sm text-gray-500 border-b">{specKey}</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3 border-b border-r border-gray-100 text-sm text-gray-700">
                      {p.specifications?.[specKey] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="sticky right-0 bg-white p-3 font-600 text-sm text-gray-500">عملیات</td>
                {items.map((p) => (
                  <td key={p.id} className="p-3 border-r border-gray-100">
                    <button
                      onClick={() => addToCart(p, 1)}
                      disabled={p.stock === 0}
                      className="btn btn-primary btn-sm w-full"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {p.stock === 0 ? 'ناموجود' : 'افزودن به سبد'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
