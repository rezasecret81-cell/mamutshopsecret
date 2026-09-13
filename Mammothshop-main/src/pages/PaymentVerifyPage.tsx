import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/router-context';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function PaymentVerifyPage() {
  const { params, query, navigate } = useRouter();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('در حال تایید پرداخت...');
  const [refId, setRefId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    const order = params.order || query.order || '';
    const authority = query.Authority || query.authority || '';
    const statusParam = query.Status || query.status || '';

    setOrderNumber(order);

    if (!order || !authority) {
      setStatus('failed');
      setMessage('اطلاعات پرداخت ناقص است.');
      return;
    }

    const verify = async () => {
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id, total_amount, status')
          .eq('order_number', order)
          .maybeSingle();

        if (!orderData) {
          setStatus('failed');
          setMessage('سفارش یافت نشد.');
          return;
        }

        // If already paid, just show success
        if (orderData.status === 'paid') {
          setStatus('success');
          setMessage('این سفارش قبلاً پرداخت شده است.');
          clearCart();
          return;
        }

        const { data: tx } = await supabase
          .from('payment_transactions')
          .select('id')
          .eq('order_id', orderData.id)
          .eq('authority', authority)
          .maybeSingle();

        if (!tx) {
          setStatus('failed');
          setMessage('تراکنش یافت نشد.');
          return;
        }

        const result = await api.verifyPayment(authority, orderData.total_amount, tx.id, statusParam);

        if (result.success) {
          // Update order status
          await api.updateOrderStatus(orderData.id, 'paid');
          // Decrease stock for products
          await api.decreaseStock(orderData.id);
          // Clear cart
          clearCart();

          setRefId(result.refId || null);
          setStatus('success');
          setMessage(result.message);
        } else {
          setStatus('failed');
          setMessage(result.message);
        }
      } catch (e: any) {
        setStatus('failed');
        setMessage(e.message || 'خطا در تایید پرداخت');
      }
    };

    verify();
  }, [clearCart]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6">
              <Loader className="w-16 h-16 text-primary-500 animate-spin" />
            </div>
            <h2 className="text-xl font-700 text-gray-800 mb-2">در حال تایید پرداخت</h2>
            <p className="text-gray-500">لطفاً صبر کنید...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-success-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success-600" />
            </div>
            <h2 className="text-xl font-700 text-gray-800 mb-2">پرداخت با موفقیت انجام شد</h2>
            <p className="text-gray-500 mb-1">{message}</p>
            {refId && (
              <p className="text-sm text-gray-600 mb-4">
                کد پیگیری: <span className="font-700 text-primary-600">{refId}</span>
              </p>
            )}
            {orderNumber && (
              <p className="text-sm text-gray-600 mb-6">
                شماره سفارش: <span className="font-700">{orderNumber}</span>
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate(`/order/${orderNumber}`)} className="btn btn-primary gap-2">
                <ArrowLeft className="w-4 h-4" /> مشاهده سفارش
              </button>
              <button onClick={() => navigate('/')} className="btn btn-ghost">
                بازگشت به فروشگاه
              </button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-error-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-error-600" />
            </div>
            <h2 className="text-xl font-700 text-gray-800 mb-2">پرداخت ناموفق بود</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/cart')} className="btn btn-primary">
                تلاش مجدد
              </button>
              <button onClick={() => navigate('/')} className="btn btn-ghost">
                بازگشت به فروشگاه
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
