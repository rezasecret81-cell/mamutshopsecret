import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Seo } from '@/components/Seo';
import { ProductCard } from '@/components/ProductCard';
import { Loader } from '@/components/Loader';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { useCompare } from '@/lib/compare-context';
import { useRouter } from '@/lib/router-context';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth-context';
import { useCache } from '@/lib/cache-context';
import type { Product, Review, ProductQuestion } from '@/lib/types';
import { formatPrice, discountPercent, effectivePrice, stockStatus, toPersianDigits } from '@/lib/format';
import { ShoppingBag, Minus, Plus, Star, Truck, ShieldCheck, RefreshCw, ChevronLeft, Heart, GitCompare, Download, FileText, MessageCircle, Send, Package, Settings, Info, Search, Home, HelpCircle, Link2 } from 'lucide-react';
import { Link } from '@/lib/router-context';

export function ProductPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { addToCart } = useCart();
  const { toggle: toggleWishlist, has } = useWishlist();
  const { toggle: toggleCompare, has: hasCompare } = useCompare();
  const { toast } = useToast();
  const { user } = useAuth();
  const { get, set } = useCache();

  // Try to get cached product first
  const cachedProduct = get<Product>(`product:${slug}`);
  const [product, setProduct] = useState<Product | null>(cachedProduct);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!cachedProduct);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews' | 'qa' | 'faq' | 'files'>('description');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [newQuestion, setNewQuestion] = useState('');

  const lastSlugRef = useRef(slug);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadProduct = useCallback(async (productSlug: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Check cache first
    const cacheKey = `product:${productSlug}`;
    const cached = get<Product>(cacheKey);

    if (cached) {
      setProduct(cached);
      setLoading(false);
      setNotFound(false);
      // Load related data in background
      api.getRelatedProducts(cached, 5).then(setRelated).catch(() => {});
      api.getReviews(cached.id).then(r => setReviews(r as Review[])).catch(() => {});
      api.getQuestions(cached.id).then(q => setQuestions(q as ProductQuestion[])).catch(() => {});
      return;
    }

    setLoading(true);
    setNotFound(false);

    try {
      const p = await api.getProduct(productSlug);
      if (!p) {
        setNotFound(true);
        setProduct(null);
        setLoading(false);
        return;
      }

      setProduct(p);
      set(cacheKey, p, 10 * 60 * 1000); // 10 minutes cache
      setLoading(false);

      // Load related data
      const [relatedProducts, productReviews, productQuestions] = await Promise.all([
        api.getRelatedProducts(p, 5).catch(() => []),
        api.getReviews(p.id).catch(() => []),
        api.getQuestions(p.id).catch(() => []),
      ]);

      setRelated(relatedProducts);
      setReviews(productReviews as Review[]);
      setQuestions(productQuestions as ProductQuestion[]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast(err instanceof Error ? err.message : 'خطا در بارگذاری محصول', 'error');
      setNotFound(true);
      setLoading(false);
    }
  }, [get, set, toast]);

  useEffect(() => {
    if (lastSlugRef.current !== slug) {
      lastSlugRef.current = slug;
      setQuantity(1);
      setActiveImage(0);
      setActiveTab('description');
      loadProduct(slug);
    } else if (!product && !notFound) {
      loadProduct(slug);
    }
  }, [slug, loadProduct, product, notFound]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (loading) {
    return <Loader variant="page" text="در حال بارگذاری محصول..." />;
  }

  if (notFound || !product) {
    return <ProductNotFound slug={slug} />;
  }

  const status = stockStatus(product.stock, product.low_stock_threshold);
  const discount = discountPercent(product);
  const price = effectivePrice(product);
  const images = [product.image_url, ...(product.images?.map(i => i.image_url) ?? [])].filter(Boolean) as string[];

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast(`${product.name} به سبد خرید اضافه شد`, 'success');
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };

  return (
    <>
      <Seo
        title={product.seo_title || product.name}
        description={product.seo_description || product.description || undefined}
        image={product.og_image || product.image_url || undefined}
        type="product"
        product={product}
        reviews={reviews}
        canonicalPath={`/product/${product.slug}`}
        breadcrumbs={[
          { name: 'خانه', url: '/' },
          { name: 'فروشگاه', url: '/shop' },
          ...(product.category ? [{ name: product.category.name, url: `/category/${product.category.slug}` }] : []),
          { name: product.name, url: `/product/${product.slug}` },
        ]}
        faq={product.faq ?? undefined}
      />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          <Link to="/" className="hover:text-primary-600">خانه</Link>
          <ChevronLeft className="w-3 h-3" />
          <Link to="/shop" className="hover:text-primary-600">فروشگاه</Link>
          {product.category && (
            <>
              <ChevronLeft className="w-3 h-3" />
              <Link to={`/category/${product.category.slug}`} className="hover:text-primary-600">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronLeft className="w-3 h-3" />
          <span className="text-gray-800 truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Product detail */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="card overflow-hidden aspect-square bg-gray-50 relative">
              {discount > 0 && (
                <span className="absolute top-4 right-4 z-10 badge bg-error-500 text-white text-sm px-3 py-1">
                  ٪{toPersianDigits(discount)} تخفیف
                </span>
              )}
              <img
                src={images[activeImage] || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImage === i ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && (
              <Link to={`/shop?brand=${product.brand.slug}`} className="text-sm text-primary-600 font-500 hover:underline block mb-1">
                {product.brand.name}
              </Link>
            )}
            <h1 className="text-2xl md:text-3xl font-700 text-gray-900 leading-tight mb-3">{product.name}</h1>

            <div className="flex items-center gap-4 mb-5 text-sm">
              {product.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-600 text-gray-700">{toPersianDigits(product.rating.toFixed(1))}</span>
                </div>
              )}
              <span className={`badge ${status.color}`}>{status.label}</span>
              {product.is_bestseller && <span className="badge badge-accent">پرفروش</span>}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-4">{product.description}</p>

            {/* Price */}
            <div className="card p-5 mb-6 bg-gradient-to-l from-primary-50 to-white">
              <div className="flex items-end gap-3">
                <div>
                  {discount > 0 && (
                    <p className="text-sm text-gray-400 line-through mb-1">{formatPrice(product.price)} تومان</p>
                  )}
                  <p className="text-3xl font-800 text-primary-700">
                    {formatPrice(price)}
                    <span className="text-sm font-500 text-gray-500 mr-1">تومان</span>
                  </p>
                </div>
                {discount > 0 && (
                  <span className="badge bg-error-500 text-white mb-2">٪{toPersianDigits(discount)} تخفیف</span>
                )}
              </div>
            </div>

            {/* Quantity + add to cart */}
            <div className="flex items-stretch gap-3 mb-6">
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-700 text-lg">{toPersianDigits(quantity)}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn btn-secondary flex-1"
              >
                <ShoppingBag className="w-5 h-5" /> افزودن به سبد
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="btn btn-primary flex-1"
              >
                خرید فوری
              </button>
            </div>

            {/* Compare & Wishlist */}
            <div className="flex gap-2">
              <button
                onClick={() => toggleCompare(product)}
                className={`btn flex-1 ${hasCompare(product.id) ? 'btn-primary' : 'btn-secondary'}`}
              >
                <GitCompare className="w-4 h-4" />
                {hasCompare(product.id) ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`btn flex-1 ${has(product.id) ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Heart className={`w-4 h-4 ${has(product.id) ? 'fill-current' : ''}`} />
                {has(product.id) ? 'در علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 text-center mt-6">
              <TrustMini icon={<Truck className="w-5 h-5" />} text="ارسال سریع" />
              <TrustMini icon={<ShieldCheck className="w-5 h-5" />} text="ضمانت اصالت" />
              <TrustMini icon={<RefreshCw className="w-5 h-5" />} text="۷ روز بازگشت" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
            <TabButton active={activeTab === 'description'} onClick={() => setActiveTab('description')}>توضیحات</TabButton>
            <TabButton active={activeTab === 'specs'} onClick={() => setActiveTab('specs')}>مشخصات فنی</TabButton>
            <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>نظرات ({toPersianDigits(reviews.length)})</TabButton>
            <TabButton active={activeTab === 'qa'} onClick={() => setActiveTab('qa')}>پرسش و پاسخ</TabButton>
            {product.faq && product.faq.length > 0 && (
              <TabButton active={activeTab === 'faq'} onClick={() => setActiveTab('faq')}>سوالات متداول</TabButton>
            )}
            <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')}>فایل‌ها</TabButton>
          </div>

          {activeTab === 'description' && (
            <div className="card p-6 md:p-8">
              {product.seo_description ? (
                <div className="text-gray-700 leading-relaxed seo-content" dangerouslySetInnerHTML={{ __html: product.seo_description }} />
              ) : (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.description || 'توضیحاتی برای این محصول ثبت نشده است.'}</p>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              {(product.weight || product.length || product.width || product.height) && (
                <div className="card p-6">
                  <h3 className="font-700 text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary-500" />
                    مشخصات فیزیکی و ارسال
                  </h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {product.weight && <SpecItem label="وزن" value={`${product.weight} کیلوگرم`} />}
                    {product.length && product.width && product.height && (
                      <SpecItem label="ابعاد" value={`${product.length} × ${product.width} × ${product.height} سانتی‌متر`} />
                    )}
                    {product.color && <SpecItem label="رنگ" value={product.color} />}
                  </div>
                </div>
              )}
              <div className="card p-6">
                <h3 className="font-700 text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-500" />
                  مشخصات فنی
                </h3>
                {Object.keys(product.specifications || {}).length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                    {Object.entries(product.specifications || {}).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-500 shrink-0 ml-4">{key}</span>
                        <span className="text-sm font-600 text-gray-800 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">مشخصات فنی ثبت نشده است</p>
                )}
              </div>
              {(product.model_number || product.sku || product.country_of_origin || product.warranty) && (
                <div className="card p-6">
                  <h3 className="font-700 text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-500" />
                    اطلاعات محصول
                  </h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {product.model_number && <SpecItem label="مدل" value={product.model_number} />}
                    {product.sku && <SpecItem label="SKU" value={product.sku} mono />}
                    {product.country_of_origin && <SpecItem label="کشور سازنده" value={product.country_of_origin} />}
                    {product.warranty && <SpecItem label="گارانتی" value={product.warranty} />}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {user && (
                <div className="card p-6">
                  <h3 className="font-700 mb-4">ثبت نظر جدید</h3>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })} className="transition-transform hover:scale-110">
                        <Star className={`w-7 h-7 ${s <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                  <input
                    className="input mb-3"
                    placeholder="عنوان نظر"
                    value={reviewForm.title}
                    onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                  />
                  <textarea
                    className="input mb-3 min-h-[100px]"
                    placeholder="نظر خود را بنویسید..."
                    value={reviewForm.body}
                    onChange={e => setReviewForm({ ...reviewForm, body: e.target.value })}
                  />
                  <button
                    onClick={async () => {
                      try {
                        await api.addReview(product.id, user.id, reviewForm.rating, reviewForm.title, reviewForm.body);
                        toast('نظر شما ثبت شد', 'success');
                        setReviewForm({ rating: 5, title: '', body: '' });
                        const updatedReviews = await api.getReviews(product.id);
                        setReviews(updatedReviews as Review[]);
                      } catch (e) {
                        toast(e instanceof Error ? e.message : 'خطا', 'error');
                      }
                    }}
                    className="btn btn-primary"
                  >
                    <Send className="w-4 h-4" /> ثبت نظر
                  </button>
                </div>
              )}
              {reviews.length === 0 ? (
                <div className="card p-8 text-center text-gray-500">هنوز نظری برای این محصول ثبت نشده است.</div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                        {review.title && <span className="font-600 text-sm">{review.title}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                    {review.body && <p className="text-sm text-gray-700 leading-relaxed">{review.body}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-4">
              {user && (
                <div className="card p-6">
                  <h3 className="font-700 mb-4">سوال خود را بپرسید</h3>
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="سوال خود را بنویسید..."
                      value={newQuestion}
                      onChange={e => setNewQuestion(e.target.value)}
                    />
                    <button
                      onClick={async () => {
                        if (!newQuestion.trim()) return;
                        try {
                          await api.addQuestion(product.id, user.id, newQuestion);
                          toast('سوال شما ثبت شد', 'success');
                          setNewQuestion('');
                          const updatedQuestions = await api.getQuestions(product.id);
                          setQuestions(updatedQuestions as ProductQuestion[]);
                        } catch (e) {
                          toast(e instanceof Error ? e.message : 'خطا', 'error');
                        }
                      }}
                      className="btn btn-primary shrink-0"
                    >
                      <Send className="w-4 h-4" /> ارسال
                    </button>
                  </div>
                </div>
              )}
              {questions.length === 0 ? (
                <div className="card p-8 text-center text-gray-500">هنوز سوالی برای این محصول پرسیده نشده است.</div>
              ) : (
                questions.map(q => (
                  <div key={q.id} className="card p-5">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-600 text-gray-800 mb-2">{q.question}</p>
                        {q.answer ? (
                          <p className="text-sm text-gray-600 leading-relaxed pr-3 border-r-2 border-primary-200">{q.answer}</p>
                        ) : (
                          <p className="text-xs text-gray-400">در انتظار پاسخ کارشناسان</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'faq' && product.faq && product.faq.length > 0 && (
            <div className="space-y-3">
              {product.faq.map((item, i) => (
                <div key={i} className="card p-5">
                  <h3 className="font-700 text-gray-900 mb-2 flex items-start gap-2">
                    <HelpCircle className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    {item.question}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed pr-7">{item.answer}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="card p-6 md:p-8">
              {product.files && product.files.length > 0 ? (
                <div className="space-y-2">
                  {product.files.map(file => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          file.file_type === 'catalog' ? 'bg-accent-50 text-accent-600' :
                          file.file_type === 'datasheet' ? 'bg-primary-50 text-primary-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {file.file_type === 'catalog' ? <FileText className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-600 group-hover:text-primary-700">{file.name}</p>
                          <p className="text-xs text-gray-400">
                            {file.file_type === 'catalog' ? 'کاتالوگ' : file.file_type === 'datasheet' ? 'دیتاشیت' : file.file_type === 'manual' ? 'راهنما' : 'فایل'}
                          </p>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">فایلی برای دانلود موجود نیست.</p>
              )}
            </div>
          )}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-700 mb-6">محصولات مرتبط</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-sm font-600 border-b-2 transition-colors -mb-px ${
        active ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function TrustMini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="card p-3 flex flex-col items-center gap-1.5">
      <div className="text-primary-600">{icon}</div>
      <span className="text-xs text-gray-600">{text}</span>
    </div>
  );
}

function SpecItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-600 text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function ProductNotFound({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const { get } = useCache();

  useEffect(() => {
    const cachedProducts = get<Product[]>('products:all');
    if (cachedProducts) {
      setSuggestions(cachedProducts.slice(0, 4));
    } else {
      api.getProducts({ limit: 4 }).then(p => {
        setSuggestions(p);
      }).catch(() => {});
    }
  }, [get]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Seo title="محصول یافت نشد" noIndex />
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <Search className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-800 mb-3">محصول یافت نشد</h1>
        <p className="text-gray-500 mb-6">
          متأسفانه محصول مورد نظر شما یافت نشد.
          <br />
          ممکن است این محصول حذف شده یا آدرس تغییر کرده باشد.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto mb-8">
          <input
            type="text"
            className="input flex-1"
            placeholder="جستجوی محصول..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex gap-3 justify-center mb-8">
          <button onClick={() => navigate('/shop')} className="btn btn-secondary">
            <ShoppingBag className="w-4 h-4" />
            فروشگاه
          </button>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            <Home className="w-4 h-4" />
            صفحه اصلی
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-700 mb-4">محصولات پیشنهادی</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {suggestions.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
