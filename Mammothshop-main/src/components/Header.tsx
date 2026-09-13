import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/lib/router-context';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { ShoppingBag, Menu, Search, User, Heart, X, LogOut, Package, MapPin, Ticket, ChevronDown, ShieldCheck, Truck, Phone, ChevronLeft, Headphones } from 'lucide-react';
import { toPersianDigits } from '@/lib/format';
import type { Category } from '@/lib/types';

export function Header() {
  const { navigate } = useRouter();
  const { itemCount } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { settings } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const NAV_LINKS = [
    { to: '/', label: 'صفحه اصلی' },
    { to: '/shop', label: 'فروشگاه' },
    { to: '/about', label: 'درباره ما' },
    { to: '/faq', label: 'سوالات متداول' },
    { to: '/contact', label: 'تماس با ما' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/shop?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setMobileOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Top bar */}
      <div className="bg-primary-950 text-white text-xs hidden md:block">
        <div className="container mx-auto px-4 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-primary-200">
              <Phone className="w-3 h-3" /> پشتیبانی ۲۴ ساعته: {settings.site_phone}
            </span>
            <span className="flex items-center gap-1 text-primary-200">
              <Truck className="w-3 h-3" /> ارسال رایگان بالای {toPersianDigits((settings.free_shipping_threshold / 1000000).toFixed(0))} میلیون تومان
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="hover:text-white transition-colors">قوانین و مقررات</Link>
            <span className="text-primary-700">|</span>
            <Link to="/account/tickets" className="hover:text-white transition-colors">پشتیبانی</Link>
          </div>
        </div>
      </div>

      <header className={`sticky top-0 z-40 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'shadow-sm'} border-b border-gray-100`}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Logo className="w-9 h-9 sm:w-10 sm:h-10" showText={true} />
            </Link>

            {/* Search (desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
              <div className="relative w-full">
                <input
                  className="input pr-10 pl-20 bg-gray-50"
                  placeholder="جستجو در میان هزاران محصول..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <button type="submit" className="absolute left-1 top-1/2 -translate-y-1/2 btn btn-primary btn-sm">جستجو</button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="جستجو"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors hidden sm:flex"
                aria-label="علاقه‌مندی‌ها"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="سبد خرید"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 bg-accent-500 text-white text-[10px] font-700 rounded-full flex items-center justify-center animate-scale-in">
                    {toPersianDigits(itemCount)}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-600">
                      <User className="w-4 h-4" />
                    </div>
                    <ChevronDown className="w-4 h-4 hidden sm:block" />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-card-hover border border-gray-100 py-2 z-50 animate-slide-down">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-600 truncate">{user.email}</p>
                          {isAdmin && (
                            <span className="badge badge-accent mt-1.5">
                              <ShieldCheck className="w-3 h-3" /> مدیر
                            </span>
                          )}
                        </div>
                        <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <User className="w-4 h-4 text-gray-400" /> پروفایل من
                        </Link>
                        <Link to="/account/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Package className="w-4 h-4 text-gray-400" /> سفارشات من
                        </Link>
                        <Link to="/account/addresses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <MapPin className="w-4 h-4 text-gray-400" /> آدرس‌ها
                        </Link>
                        <Link to="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Heart className="w-4 h-4 text-gray-400" /> علاقه‌مندی‌ها
                        </Link>
                        <Link to="/account/tickets" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Ticket className="w-4 h-4 text-gray-400" /> تیکت‌های پشتیبانی
                        </Link>
                        <Link to="/account/chat" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Headphones className="w-4 h-4 text-gray-400" /> چت آنلاین
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-accent-700 hover:bg-accent-50 transition-colors">
                            <ShieldCheck className="w-4 h-4" /> پنل مدیریت
                          </Link>
                        )}
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={() => { setUserMenuOpen(false); signOut(); navigate('/'); }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" /> خروج از حساب
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn btn-ghost hidden sm:flex">
                  <User className="w-4 h-4" /> ورود / ثبت‌نام
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="منو"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          {searchOpen && (
            <form onSubmit={handleSearch} className="md:hidden pb-3 animate-slide-down">
              <div className="relative">
                <input
                  className="input pr-10"
                  placeholder="جستجو..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </form>
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:block border-t border-gray-100">
          <div className="container mx-auto px-4">
            <ul className="flex items-center gap-1 h-12">
              {/* Categories dropdown */}
              <li className="relative">
                <button
                  onClick={() => setCategoriesMenuOpen(!categoriesMenuOpen)}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-500 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  دسته‌بندی‌ها
                  <ChevronDown className={`w-4 h-4 transition-transform ${categoriesMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {categoriesMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCategoriesMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-slide-down">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/category/${cat.slug}`}
                          onClick={() => setCategoriesMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                      {categories.length === 0 && (
                        <span className="block px-4 py-2 text-sm text-gray-400">دسته‌بندی یافت نشد</span>
                      )}
                    </div>
                  </>
                )}
              </li>
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="px-4 py-2 rounded-lg text-sm font-500 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mr-auto">
                <Link to="/shop?sort=bestseller" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-500 text-accent-600 hover:bg-accent-50 transition-colors">
                  <Heart className="w-4 h-4" /> پرفروش‌ترین‌ها
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-2xl animate-slide-down overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <Logo className="w-8 h-8" showText={true} />
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-500 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {categories.length > 0 && (
                <div className="border-t border-gray-100 my-2 pt-2">
                  <p className="px-4 py-2 text-xs text-gray-400 font-500">دسته‌بندی‌ها</p>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
              {user && (
                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-500 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Heart className="w-4 h-4 text-gray-400" /> علاقه‌مندی‌ها
                </Link>
              )}
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-500 text-primary-600 hover:bg-primary-50 transition-colors mt-2"
                >
                  ورود / ثبت‌نام
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export { NAV_LINKS };
