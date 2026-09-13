import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useRouter, Link } from '@/lib/router-context';
import { useToast } from '@/components/Toast';
import { Seo } from '@/components/Seo';
import { generateOrderNumber, formatPrice, effectivePrice, toPersianDigits } from '@/lib/format';
import type { Address } from '@/lib/types';
import { CheckCircle2, MapPin, Tag, CreditCard, Loader, ArrowLeft } from 'lucide-react';

export function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payingStep, setPayingStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (user) {
      api.getAddresses(user.id).then((addrs) => {
        setAddresses(addrs);
        const def = addrs.find((a) => a.is_default) ?? addrs[0];
        if (def) setSelectedAddress(def.id);
      });
    }
  }, [user]);

  if (items.length === 0 && payingStep !== 'success') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">سبد خرید شما خالی است</p>
        <Link to="/shop" className="btn btn-primary">رفتن به فروشگاه</Link>
      </div>
    );
  }

  const shipping = totalPrice >= 5000000 ? 0 : 150000;
  const discountAmount = appliedCoupon?.discount ?? 0;
  const grandTotal = Math.max(0, totalPrice + shipping - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const coupon = await api.validateCoupon(couponCode, totalPrice);
      const discount =
        coupon.discount_type === 'percent'
          ? Math.round((totalPrice * coupon.discount_value) / 100)
          : coupon.discount_value;
      setAppliedCoupon({ code: coupon.code, discount });
      toast(`کد تخفیف اعمال شد: ${formatPrice(discount)} تومان تخفیف`, 'success');
    } catch (err) {
      setAppliedCoupon(null);
      toast(err instanceof Error ? err.message : 'کد نامعتبر است', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedAddress) {
      toast('لطفاً آدرس تحویل را انتخاب کنید', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const address = addresses.find((a) => a.id === selectedAddress);
      const newOrderNumber = generateOrderNumber();
      setOrderNumber(newOrderNumber);

      const order = await api.createOrder({
        userId: user.id,
        orderNumber: newOrderNumber,
        total: grandTotal,
        discountAmount,
        shippingAddress: address as unknown as Record<string, unknown>,
        couponCode: appliedCoupon?.code ?? null,
        notes,
        items: items.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: effectivePrice(i.product),
          image_url: i.product.image_url,
        })),
      });

      setPayingStep('processing');

      const { gatewayUrl } = await api.requestPayment(order.id, grandTotal, user.id, newOrderNumber);
      window.location.href = gatewayUrl;
    } catch (err) {
      setPayingStep('idle');
      toast(err instanceof Error ? err.message : 'خطا در ثبت سفارش', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (payingStep === 'success') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-success-50 text-success-600 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-700 mb-2">سفارش شما با موفقیت ثبت شد!</h1>
          <p className="text-gray-500 mb-6">شماره سفارش: <span className="font-700 text-primary-600">{orderNumber}</span></p>
          <p className="text-sm text-gray-600 mb-8">پرداخت شما با موفقیت انجام شد. جزئیات سفارش در پنل کاربری شما قابل مشاهده است.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => navigate(`/order/${orderNumber}`)} className="btn btn-primary">مشاهده فاکتور</button>
            <Link to="/account/orders" className="btn btn-secondary">سفارشات من</Link>
            <Link to="/shop" className="btn btn-ghost">ادامه خرید</Link>
          </div>
        </div>
      </div>
    );
  }

  if (payingStep === 'processing') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-700 mb-2">در حال اتصال به درگاه پرداخت...</h1>
          <p className="text-sm text-gray-500">لطفاً صبر کنید</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo title="تسویه حساب" />
      <div className="container mx-auto px-4 py-8">
        <button onClick={() => navigate('/cart')} className="btn btn-ghost btn-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> بازگشت به سبد
        </button>
        <h1 className="text-2xl font-700 mb-6">تسویه حساب</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Address + notes */}
          <div className="lg:col-span-2 space-y-6">
            <section className="card p-5">
              <h3 className="font-700 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-600" /> آدرس تحویل</h3>
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">آدرسی ثبت نشده است</p>
                  <Link to="/account/addresses" className="btn btn-primary btn-sm">افزودن آدرس</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`block border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedAddress === addr.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddress === addr.id}
                          onChange={() => setSelectedAddress(addr.id)}
                          className="mt-1 text-primary-600"
                        />
                        <div className="flex-1">
                          <p className="font-600 text-gray-800">{addr.recipient || addr.title || 'گیرنده'}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {addr.province} - {addr.city} - {addr.address}
                          </p>
                          {addr.postal_code && <p className="text-xs text-gray-400 mt-1" dir="ltr">کد پستی: {addr.postal_code}</p>}
                          {addr.is_default && <span className="badge badge-primary mt-2">پیش‌فرض</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                  <Link to="/account/addresses" className="text-sm text-primary-600 hover:underline block mt-3">
                    + افزودن آدرس جدید
                  </Link>
                </div>
              )}
            </section>

            <section className="card p-5">
              <h3 className="font-700 mb-4">یادداشت سفارش</h3>
              <textarea
                className="input min-h-24"
                placeholder="توضیحات_optional برای سفارش (مثلاً زمان تحویل)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </section>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h3 className="font-700 mb-4">خلاصه سفارش</h3>

              {/* Items mini list */}
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 text-sm">
                    <img src={item.product.image_url || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="flex-1 line-clamp-1 text-gray-700">{item.product.name}</span>
                    <span className="text-gray-400">×{toPersianDigits(item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pr-9 py-2 text-sm"
                    placeholder="کد تخفیف"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim() || !!appliedCoupon}
                  className="btn btn-secondary btn-sm whitespace-nowrap"
                >
                  {appliedCoupon ? 'اعمال شد' : 'اعمال'}
                </button>
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <Row label="جمع کالاها" value={`${formatPrice(totalPrice)} تومان`} />
                <Row label="هزینه ارسال" value={shipping === 0 ? <span className="text-success-600 font-600">رایگان</span> : `${formatPrice(shipping)} تومان`} />
                {discountAmount > 0 && <Row label="تخفیف" value={<span className="text-error-600">- {formatPrice(discountAmount)}</span>} />}
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
                <span className="font-600">مبلغ نهایی</span>
                <span className="font-800 text-primary-700 text-lg">{formatPrice(grandTotal)}</span>
              </div>
              <span className="block text-xs text-gray-400 text-left mb-4">تومان</span>

              <button onClick={handleCheckout} disabled={submitting} className="btn btn-primary w-full btn-lg">
                <CreditCard className="w-5 h-5" />
                {submitting ? 'در حال پردازش...' : `پرداخت ${formatPrice(grandTotal)} تومان`}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                با کلیک روی «پرداخت»، شرایط و قوانین ماموت شاپ را می‌پذیرید.
              </p>
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
