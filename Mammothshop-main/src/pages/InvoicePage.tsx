import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Seo } from '@/components/Seo';
import type { Order, OrderItem } from '@/lib/types';
import { formatDate, formatPrice, toPersianDigits } from '@/lib/format';
import { useRouter, Link } from '@/lib/router-context';
import { CheckCircle2, Loader, Printer, Package, MapPin } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  pending: { label: 'در انتظار پرداخت', badge: 'badge-warning' },
  paid: { label: 'پرداخت شد', badge: 'badge-primary' },
  processing: { label: 'در حال آماده‌سازی', badge: 'badge-primary' },
  shipped: { label: 'ارسال شد', badge: 'badge-accent' },
  delivered: { label: 'تحویل شد', badge: 'badge-success' },
  cancelled: { label: 'لغو شد', badge: 'badge-error' },
};

export function InvoicePage({ orderNumber }: { orderNumber: string }) {
  const { navigate } = useRouter();
  const [data, setData] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrderDetails(orderNumber)
      .then((d) => setData(d))
      .catch((err) => setError(err instanceof Error ? err.message : 'خطا'))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{error || 'سفارش یافت نشد'}</p>
        <Link to="/account/orders" className="btn btn-primary">سفارشات من</Link>
      </div>
    );
  }

  const { order, items } = data;
  const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
  const shipping = order.total_amount > 0 && items.length > 0 ? 0 : 0;
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  return (
    <>
      <Seo title={`فاکتور ${order.order_number}`} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Status banner */}
          <div className="card p-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-success-50 text-success-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-700">سفارش ثبت شد</h1>
                <p className="text-sm text-gray-500">شماره سفارش: <span className="font-700 text-primary-600">{order.order_number}</span></p>
              </div>
            </div>
            <span className={`badge ${status.badge} px-3 py-1`}>{status.label}</span>
          </div>

          {/* Invoice */}
          <div className="card p-6 md:p-8" id="invoice">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-800">ماموت شاپ</h2>
                <p className="text-xs text-gray-500 mt-1">فروشگاه آنلاین لوازم دیجیتال</p>
              </div>
              <div className="text-left text-sm">
                <p className="text-gray-500">تاریخ صدور:</p>
                <p className="font-600">{formatDate(order.created_at)}</p>
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-700 flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-primary-600" /> آدرس تحویل</h3>
              <p className="text-sm text-gray-700">
                {String(order.shipping_address?.recipient ?? '') as string} {order.shipping_address?.province ? `- ${String(order.shipping_address.province)}` : ''} {order.shipping_address?.city ? `- ${String(order.shipping_address.city)}` : ''}
              </p>
              {order.shipping_address?.address ? <p className="text-sm text-gray-600 mt-1">{String(order.shipping_address.address)}</p> : null}
            </div>

            {/* Items */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="text-right py-2 font-500">ردیف</th>
                  <th className="text-right py-2 font-500">محصول</th>
                  <th className="text-center py-2 font-500">تعداد</th>
                  <th className="text-left py-2 font-500">قیمت واحد</th>
                  <th className="text-left py-2 font-500">مبلغ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 text-gray-400">{toPersianDigits(i + 1)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {item.image_url && <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                        <span className="font-600 text-gray-800">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">{toPersianDigits(item.quantity)}</td>
                    <td className="py-3 text-left">{formatPrice(item.unit_price)}</td>
                    <td className="py-3 text-left font-600">{formatPrice(item.unit_price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">جمع کالاها:</span><span>{formatPrice(subtotal)} تومان</span></div>
                <div className="flex justify-between"><span className="text-gray-500">هزینه ارسال:</span><span>{shipping === 0 ? 'رایگان' : formatPrice(shipping)}</span></div>
                {order.discount_amount > 0 && <div className="flex justify-between text-error-600"><span>تخفیف:</span><span>- {formatPrice(order.discount_amount)}</span></div>}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-700 text-primary-700">
                  <span>مبلغ کل:</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking */}
          {order.tracking_code && (
            <div className="card p-4 mb-6 flex items-center gap-3">
              <Package className="w-5 h-5 text-accent-500" />
              <div className="text-sm">
                <span className="text-gray-500">کد رهگیری: </span>
                <span className="font-700 text-accent-600" dir="ltr">{order.tracking_code}</span>
              </div>
            </div>
          )}

          {!order.tracking_code && order.status === 'pending' && (
            <div className="card p-4 mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">این سفارش در انتظار پرداخت است</p>
              <Link to={`/checkout`} className="btn btn-primary btn-sm">پرداخت</Link>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => window.print()} className="btn btn-secondary">
              <Printer className="w-4 h-4" /> چاپ فاکتور
            </button>
            <Link to="/account/orders" className="btn btn-ghost">سفارشات من</Link>
            <Link to="/shop" className="btn btn-ghost">ادامه خرید</Link>
            {order.status === 'pending' && (
              <button onClick={() => navigate('/')} className="btn btn-ghost">لغو سفارش</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
