import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useRouter } from '@/lib/router-context';
import { api } from '@/lib/api';
import { useSettings } from '@/lib/settings-context';
import { Seo } from '@/components/Seo';
import { ProductCard } from '@/components/ProductCard';
import type { Brand, Product } from '@/lib/types';
import { formatPrice, toPersianDigits } from '@/lib/format';
import { ChevronLeft, Truck, ShieldCheck, Headphones, CreditCard, Sparkles, TrendingUp, ArrowLeft, Zap, Tag, Clock, Award, ChevronRight, Eye } from 'lucide-react';

export function HomePage() {
  const { navigate } = useRouter();
  const { settings } = useSettings();
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [mostViewed, setMostViewed] = useState<Product[]>([]);
  const [discounted, setDiscounted] = useState<Product[]>([]);
  const [flashSale, setFlashSale] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [flashSaleData, setFlashSaleData] = useState<{ title: string; endsAt: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const hasDataRef = useRef(false);

  useEffect(() => {
    const loadAll = async () => {
      if (hasDataRef.current) {
        // Background revalidation — keep existing data visible
        try {
          const [newP, featP, bestP, discP, brandP, flashP, activeFlash] = await Promise.all([
            settings.show_new_products ? api.getProducts({ sort: 'newest', limit: 12 }).catch(() => []) : Promise.resolve([]),
            api.getProducts({ featured: true, limit: 12 }).catch(() => []),
            settings.show_bestsellers ? api.getProducts({ bestseller: true, limit: 12 }).catch(() => []) : Promise.resolve([]),
            settings.show_discounted ? api.getDiscountedProducts(12).catch(() => []) : Promise.resolve([]),
            api.getBrands().catch(() => []),
            settings.show_flash_sale ? api.getFlashSaleProducts().catch(() => []) : Promise.resolve([]),
            settings.show_flash_sale ? api.getActiveFlashSale().catch(() => null) : Promise.resolve(null),
          ]);
          setNewProducts(newP as Product[]);
          setFeatured(featP as Product[]);
          setBestsellers(bestP as Product[]);
          setDiscounted(discP as Product[]);
          setBrands((brandP as Brand[]).filter(b => b.is_active));
          setFlashSale(flashP as Product[]);
          const allProducts = [...(newP as Product[]), ...(featP as Product[])].reduce((acc, p) => {
            if (!acc.find(x => x.id === p.id)) acc.push(p);
            return acc;
          }, [] as Product[]);
          setMostViewed(allProducts.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 8));
          if (activeFlash) {
            setFlashSaleData({ title: activeFlash.title, endsAt: new Date(activeFlash.ends_at) });
          }
        } catch {
          // keep existing data on refetch failure
        }
        return;
      }
      try {
        const [newP, featP, bestP, discP, brandP, flashP, activeFlash] = await Promise.all([
          settings.show_new_products ? api.getProducts({ sort: 'newest', limit: 12 }).catch(() => []) : Promise.resolve([]),
          api.getProducts({ featured: true, limit: 12 }).catch(() => []),
          settings.show_bestsellers ? api.getProducts({ bestseller: true, limit: 12 }).catch(() => []) : Promise.resolve([]),
          settings.show_discounted ? api.getDiscountedProducts(12).catch(() => []) : Promise.resolve([]),
          api.getBrands().catch(() => []),
          settings.show_flash_sale ? api.getFlashSaleProducts().catch(() => []) : Promise.resolve([]),
          settings.show_flash_sale ? api.getActiveFlashSale().catch(() => null) : Promise.resolve(null),
        ]);
        setNewProducts(newP as Product[]);
        setFeatured(featP as Product[]);
        setBestsellers(bestP as Product[]);
        setDiscounted(discP as Product[]);
        setBrands((brandP as Brand[]).filter(b => b.is_active));
        setFlashSale(flashP as Product[]);
        const allProducts = [...(newP as Product[]), ...(featP as Product[])].reduce((acc, p) => {
          if (!acc.find(x => x.id === p.id)) acc.push(p);
          return acc;
        }, [] as Product[]);
        setMostViewed(allProducts.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 8));
        if (activeFlash) {
          setFlashSaleData({ title: activeFlash.title, endsAt: new Date(activeFlash.ends_at) });
        }
        hasDataRef.current = true;
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!flashSaleData) return;
    const tick = () => {
      const diff = flashSaleData.endsAt.getTime() - Date.now();
      if (diff <= 0) return;
      setCountdown({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [flashSaleData]);

  return (
    <>
      <Seo
        description="ماموت شاپ - فروشگاه آنلاین لوازم دیجیتال با بهترین قیمت، ضمانت اصالت کالا و ارسال سریع به سراسر ایران"
        canonicalPath="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'OnlineStore',
          name: 'ماموت شاپ',
          description: 'فروشگاه آنلاین لوازم دیجیتال با بهترین قیمت و ارسال سریع',
          url: 'https://mamutshop.ir',
        }}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {settings.hero_background_image && (
            <img src={settings.hero_background_image} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-xl">
            <span className="badge bg-white/20 text-white backdrop-blur-md mb-4">
              <Sparkles className="w-3.5 h-3.5" /> تخفیف‌های ویژه تابستانه
            </span>
            <h1 className="text-3xl md:text-5xl font-800 text-white leading-tight mb-4 text-balance">
              {settings.hero_title}
            </h1>
            <p className="text-primary-100 text-base md:text-lg leading-relaxed mb-8">
              {settings.hero_subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/shop" className="btn btn-accent btn-lg shadow-xl">
                مشاهده فروشگاه <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link to="/shop?sort=bestseller" className="btn bg-white/10 text-white backdrop-blur-md hover:bg-white/20 btn-lg">
                پرفروش‌ترین‌ها
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="card p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <TrustItem icon={<Truck className="w-6 h-6" />} title="ارسال رایگان" desc="بالای ۵ میلیون تومان" />
          <TrustItem icon={<ShieldCheck className="w-6 h-6" />} title="ضمانت اصالت" desc="کالای اصل ۱۰۰٪" />
          <TrustItem icon={<Headphones className="w-6 h-6" />} title="پشتیبانی ۲۴/۷" desc="همیشه در دسترس" />
          <TrustItem icon={<CreditCard className="w-6 h-6" />} title="پرداخت امن" desc="درگاه معتبر بانکی" />
        </div>
      </section>

      {/* Flash Sale */}
      {settings.show_flash_sale && flashSale.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-l from-error-600 to-accent-500 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 fill-amber-300 text-amber-300" />
                <h2 className="text-xl md:text-2xl font-800">{flashSaleData?.title || 'فروش ویژه'}</h2>
              </div>
              {flashSaleData && (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  <span className="tabular-nums font-700">
                    {toPersianDigits(String(countdown.hours).padStart(2,'0'))}:{toPersianDigits(String(countdown.minutes).padStart(2,'0'))}:{toPersianDigits(String(countdown.seconds).padStart(2,'0'))}
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <ProductCarousel products={flashSale} />
            </div>
          </div>
        </section>
      )}

      {/* New Products Showcase */}
      {settings.show_new_products && (
        <section className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="rounded-[2rem] bg-slate-900 p-5 md:p-8">
              <div className="h-8 w-48 skeleton rounded-xl mb-6" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[280px] max-w-[280px] shrink-0"><ProductCardSkeleton /></div>
                ))}
              </div>
            </div>
          ) : (
            <ProductShowcase 
              products={newProducts} 
              onMore={() => navigate('/shop?sort=newest')}
              title={settings.new_products_title}
              subtitle={settings.new_products_subtitle}
            />
          )}
        </section>
      )}

      {/* Featured Products Carousel */}
      <section className="container mx-auto px-4 py-8">
        <SectionHeader
          title="محصولات ویژه"
          subtitle="منتخبی از بهترین محصولات"
          icon={<Sparkles className="w-5 h-5 text-accent-500" />}
          onMore={() => navigate('/shop?featured=true')}
        />
        <ProductCarousel products={featured} />
      </section>

      {/* Banner */}
      <section className="container mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl gradient-accent text-white">
          <div className="absolute inset-0 opacity-10">
            <img src="https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg" alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          </div>
          <div className="relative px-6 md:px-12 py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-700 mb-2">جشنواره فروش ویژه</h3>
              <p className="text-accent-100 mb-4">تا ۳۰٪ تخفیف روی محصولات منتخب</p>
              <code className="text-sm bg-white/20 px-3 py-1.5 rounded-lg">کد: WELCOME10</code>
            </div>
            <Link to="/shop" className="btn bg-white text-accent-700 hover:bg-accent-50 btn-lg">
              خرید کنید <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers Carousel */}
      {settings.show_bestsellers && (
        <section className="container mx-auto px-4 py-8">
          <SectionHeader
            title="پرفروش‌ترین‌ها"
            subtitle="محبوب‌ترین محصولات کاربران"
            icon={<TrendingUp className="w-5 h-5 text-success-500" />}
            onMore={() => navigate('/shop?sort=bestseller')}
          />
          <ProductCarousel products={bestsellers} />
        </section>
      )}

      {/* Most Viewed Carousel */}
      {mostViewed.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <SectionHeader
            title="پربازدیدترین‌ها"
            subtitle="محصولات با بیشترین بازدید"
            icon={<Eye className="w-5 h-5 text-primary-500" />}
            onMore={() => navigate('/shop')}
          />
          <ProductCarousel products={mostViewed} />
        </section>
      )}

      {/* Discounted Products Carousel */}
      {settings.show_discounted && discounted.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <SectionHeader
            title="محصولات تخفیف‌دار"
            subtitle="فرصت محدود برای خرید با تخفیف ویژه"
            icon={<Tag className="w-5 h-5 text-error-500" />}
            onMore={() => navigate('/shop?discount=true')}
          />
          <ProductCarousel products={discounted} />
        </section>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <SectionHeader
            title="برندهای محبوب"
            subtitle="انتخاب از بهترین برندها"
            icon={<Award className="w-5 h-5 text-accent-500" />}
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {brands.slice(0, 8).map((brand) => (
              <Link
                key={brand.id}
                to={`/shop?brand=${brand.slug}`}
                className="card p-4 flex flex-col items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden group-hover:bg-primary-50 transition-colors">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                  ) : (
                    <Tag className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <span className="text-xs font-600 text-gray-700 text-center line-clamp-1">{brand.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container mx-auto px-4 py-12">
        <div className="card p-8 md:p-12 text-center bg-gradient-to-br from-primary-50 to-white">
          <Sparkles className="w-10 h-10 text-accent-500 mx-auto mb-3" />
          <h3 className="text-2xl font-700 mb-2">عضویت در خبرنامه</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">از تخفیف‌های ویژه و جدیدترین محصولات با خبر شوید</p>
          <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input className="input" type="email" placeholder="ایمیل شما" />
            <button type="submit" className="btn btn-primary whitespace-nowrap">عضویت</button>
          </form>
        </div>
      </section>
    </>
  );
}

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    stateRef.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false };
    el.style.cursor = 'grabbing';
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    stateRef.current.isDown = false;
    el.style.cursor = 'grab';
  }, []);

  const onMouseUp = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    stateRef.current.isDown = false;
    el.style.cursor = 'grab';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || !stateRef.current.isDown) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - stateRef.current.startX) * 1.5;
    if (Math.abs(walk) > 3) stateRef.current.moved = true;
    el.scrollLeft = stateRef.current.scrollLeft - walk;
  }, []);

  const preventClick = useCallback((e: React.MouseEvent) => {
    if (stateRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      stateRef.current.moved = false;
    }
  }, []);

  return { ref, onMouseDown, onMouseLeave, onMouseUp, onMouseMove, preventClick };
}

function ProductShowcase({ products, onMore, title, subtitle }: { products: Product[]; onMore: () => void; title?: string; subtitle?: string }) {
  const [featuredProduct, ...restProducts] = products;
  const ds = useDragScroll();
  const scrollRef = ds.ref;

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -300 : 300,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950 p-5 text-white shadow-2xl shadow-primary-950/20 md:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="relative mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-700 tracking-[0.18em] text-primary-300">
            <span className="h-2 w-2 rounded-full bg-accent-400 shadow-[0_0_0_5px_rgba(251,146,60,0.12)]" />
            انتخاب تازه ماموت
          </div>
          <h2 className="text-2xl font-800 leading-tight md:text-3xl">{title || 'تازه رسیده، برای شما انتخاب شده'}</h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">{subtitle || 'جدیدترین انتخاب‌های ماموت شاپ را قبل از همه ببینید.'}</p>
        </div>
        <button onClick={onMore} className="group flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-600 text-slate-200 transition-all hover:border-primary-300/50 hover:bg-primary-500/15 hover:text-white">
          مشاهده همه <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </button>
      </div>

      {featuredProduct ? (
        <div className="relative grid gap-5 lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,2fr)]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-3 shadow-xl shadow-black/10 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between px-2 text-xs text-slate-400">
              <span>انتخاب سردبیر</span>
              <span className="rounded-full bg-accent-400/15 px-2 py-1 text-accent-300">۰۱</span>
            </div>
            <ProductCard product={featuredProduct} />
          </div>

          <div className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-3 shadow-inner shadow-white/[0.03] sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-xs font-600 text-slate-400">انتخاب‌های جدید این هفته</span>
              <span className="text-xs text-primary-300">{toPersianDigits(String(products.length))} محصول</span>
            </div>
            <div className="group/rail relative">
              <div ref={scrollRef} onMouseDown={ds.onMouseDown} onMouseLeave={ds.onMouseLeave} onMouseUp={ds.onMouseUp} onMouseMove={ds.onMouseMove} onClickCapture={ds.preventClick} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide scroll-smooth cursor-grab select-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {restProducts.map((product, index) => (
                  <div key={product.id} className="min-w-[250px] max-w-[250px] shrink-0 snap-start sm:min-w-[270px] sm:max-w-[270px]">
                    <div className="relative">
                      <ProductCard product={product} />
                      <span className="pointer-events-none absolute left-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-[10px] font-700 text-white backdrop-blur-md">{toPersianDigits(String(index + 2).padStart(2, '0'))}</span>
                    </div>
                  </div>
                ))}
              </div>
              {restProducts.length > 3 && (
                <>
                  <button onClick={() => scroll('right')} aria-label="محصولات بعدی" className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 opacity-0 shadow-xl transition-all hover:bg-primary-50 hover:text-primary-600 group-hover/rail:opacity-100">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button onClick={() => scroll('left')} aria-label="محصولات قبلی" className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 opacity-0 shadow-xl transition-all hover:bg-primary-50 hover:text-primary-600 group-hover/rail:opacity-100">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-slate-400">محصول جدیدی یافت نشد</div>
      )}
    </div>
  );
}

function ProductCarousel({ products }: { products: Product[] }) {
  const ds = useDragScroll();
  const scrollRef = ds.ref;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative group/carousel">
      <div
        ref={scrollRef}
        onMouseDown={ds.onMouseDown}
        onMouseLeave={ds.onMouseLeave}
        onMouseUp={ds.onMouseUp}
        onMouseMove={ds.onMouseMove}
        onClickCapture={ds.preventClick}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth cursor-grab select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
        {products.length === 0 && (
          <div className="w-full text-center py-8 text-gray-500">محصولی یافت نشد</div>
        )}
      </div>
      {/* Navigation arrows */}
      {products.length > 4 && (
        <>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}

function TrustItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-600 text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
  onMore,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onMore?: () => void;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h2 className="text-xl md:text-2xl font-700 text-gray-900">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {onMore && (
        <button onClick={onMore} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-500 transition-colors">
          مشاهده همه <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function FlashSaleCard({ product }: { product: Product }) {
  const flashPrice = product.flash_sale?.sale_price ?? product.price;
  const discount = product.price > 0 ? Math.round((1 - flashPrice / product.price) * 100) : 0;
  const soldCount = product.flash_sale?.sold_count ?? 0;
  const quantityLimit = product.flash_sale?.quantity_limit ?? 0;
  const progress = quantityLimit > 0 ? Math.min(100, (soldCount / quantityLimit) * 100) : 0;

  return (
    <Link to={`/product/${product.slug}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-card-hover transition-all">
        <div className="relative">
          <img
            src={product.image_url || ''}
            alt={product.name}
            className="w-full aspect-square object-cover rounded-xl bg-gray-50 mb-2"
          />
          <span className="absolute top-1 right-1 badge bg-error-500 text-white">٪{toPersianDigits(discount)} تخفیف</span>
        </div>
        <h3 className="text-sm font-600 text-gray-800 line-clamp-2 mb-1 group-hover:text-primary-700">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <span className="font-700 text-error-600">{formatPrice(flashPrice)}</span>
          {product.price > flashPrice && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        {quantityLimit > 0 && (
          <div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-l from-error-500 to-accent-400" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{toPersianDigits(soldCount)} فروش رفته</p>
          </div>
        )}
      </div>
    </Link>
  );
}

function ProductCardSkeleton() {
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

