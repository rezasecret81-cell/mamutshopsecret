import { useState } from 'react';
import { Link } from '@/lib/router-context';
import { useAuth } from '@/lib/auth-context';
import { MessageCircle, X, Headphones, MessageSquare, HelpCircle, Phone } from 'lucide-react';

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 left-4 z-30 w-14 h-14 rounded-full bg-gradient-to-l from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 flex items-center justify-center transition-all hover:scale-110"
        aria-label="پشتیبانی"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {open && (
        <div className="fixed bottom-20 left-4 z-30 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-card-hover border border-gray-100 overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-l from-primary-600 to-primary-700 text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="font-600 text-sm">پشتیبانی ماموت شاپ</p>
              <p className="text-xs text-primary-200">آنلاین - پاسخ سریع</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-sm text-gray-600 mb-3">چگونه می‌توانیم کمکتان کنیم؟</p>

            {/* Live Chat - Primary action */}
            {user && (
              <Link to="/account/chat" onClick={() => setOpen(false)} className="block p-3 rounded-xl bg-gradient-to-l from-primary-50 to-primary-100 border border-primary-200 hover:from-primary-100 hover:to-primary-50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-600 text-primary-800">چت آنلاین</p>
                    <p className="text-xs text-primary-600">شروع گفتگو با پشتیبانی</p>
                  </div>
                </div>
              </Link>
            )}

            <Link to="/faq" onClick={() => setOpen(false)} className="block p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-600 text-gray-800">سوالات متداول</p>
                  <p className="text-xs text-gray-500">پاسخ سریع به سوالات</p>
                </div>
              </div>
            </Link>

            <Link to="/account/tickets" onClick={() => setOpen(false)} className="block p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-600 text-gray-800">تیکت پشتیبانی</p>
                  <p className="text-xs text-gray-500">ثبت درخواست پشتیبانی</p>
                </div>
              </div>
            </Link>

            <Link to="/contact" onClick={() => setOpen(false)} className="block p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-600 text-gray-800">تماس با ما</p>
                  <p className="text-xs text-gray-500">راه‌های ارتباطی</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
