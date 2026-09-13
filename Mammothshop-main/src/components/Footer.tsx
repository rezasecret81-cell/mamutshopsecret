import { Link } from '@/lib/router-context';
import { useSettings } from '@/lib/settings-context';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Instagram, Send, ShieldCheck, Truck, Headphones, CreditCard } from 'lucide-react';
import { Logo } from '@/components/Logo';
import type { Category } from '@/lib/types';

export function Footer() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      {/* Trust badges */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="flex items-center gap-3 text-white">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-sm font-600">ارسال سریع</p>
                <p className="text-xs text-gray-500">تحویل در کوتاه‌ترین زمان</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-success-500/20 text-success-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-sm font-600">ضمانت اصالت</p>
                <p className="text-xs text-gray-500">تضمین کالای اصل</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-accent-500/20 text-accent-400 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-sm font-600">پشتیبانی ۲۴/۷</p>
                <p className="text-xs text-gray-500">همیشه در کنار شما</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-sm font-600">پرداخت امن</p>
                <p className="text-xs text-gray-500">درگاه پرداخت معتبر</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Logo className="w-10 h-10" showText={true} />
            </div>
            <p className="text-sm leading-relaxed">
              فروشگاه آنلاین لوازم دیجیتال با بیش از یک دهه تجربه در ارائه بهترین محصولات با ضمانت اصالت و ارسال سریع به سراسر کشور.
            </p>
            <div className="flex items-center gap-2 mt-4">
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-white transition-colors" aria-label="اینستاگرام">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.telegram && (
                <a href={settings.telegram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-white transition-colors" aria-label="تلگرام">
                  <Send className="w-5 h-5" />
                </a>
              )}
              {!settings.instagram && !settings.telegram && (
                <>
                  <span className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-600" aria-label="اینستاگرام">
                    <Instagram className="w-5 h-5" />
                  </span>
                  <span className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-600" aria-label="تلگرام">
                    <Send className="w-5 h-5" />
                  </span>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-white font-600 mb-4">دسترسی سریع</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-primary-400 transition-colors">فروشگاه</Link></li>
              <li><Link to="/about" className="hover:text-primary-400 transition-colors">درباره ما</Link></li>
              <li><Link to="/contact" className="hover:text-primary-400 transition-colors">تماس با ما</Link></li>
              <li><Link to="/terms" className="hover:text-primary-400 transition-colors">قوانین و مقررات</Link></li>
              <li><Link to="/account/tickets" className="hover:text-primary-400 transition-colors">پشتیبانی</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-600 mb-4">دسته‌بندی‌ها</h3>
            <ul className="space-y-2 text-sm">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`} className="hover:text-primary-400 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="text-gray-500">در حال بارگذاری...</li>
              )}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-600 mb-4">تماس با ما</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                <span>{settings.site_address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary-400 shrink-0" />
                <span className="text-white font-500" dir="ltr">{settings.site_phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-400 shrink-0" />
                <span dir="ltr">{settings.site_email}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p>* {new Date().getFullYear()} {settings.site_name} " تمامی حقوق محفوظ است.</p>
          <div className="flex items-center gap-3">
            <span className="badge bg-gray-800 text-gray-300">نماد اعتماد الکترونیک</span>
            <span className="badge bg-gray-800 text-gray-300">پرداخت امن</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
