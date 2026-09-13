import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/components/Toast';
import { Link, Navigate } from '@/lib/router-context';
import { Seo } from '@/components/Seo';
import type { Brand, Category, Coupon, Faq, FlashSale, Order, OrderItem, OrderTimeline, Product, Profile, Review } from '@/lib/types';
import { formatPrice, formatDate, toPersianDigits } from '@/lib/format';
import { Layout, ShieldCheck, Package, ShoppingBag, Users, Tag, FolderTree, Ticket as TicketIcon, Boxes, LayoutDashboard, ChevronLeft, BarChart3, AlertTriangle, Download, Plus, Edit, Trash2, Star, Settings, CreditCard, Save, Upload, X, Image as ImageIcon, Sparkles, Headphones, Send, MessageSquare, Search, CheckCircle, XCircle, Clock, Truck, Eye, User, MapPin, Circle, Wand2 } from 'lucide-react';
import { AiSeoPanel, BulkAiSeo, SeoDashboard } from '@/components/AiSeoPanel';

type AdminSection = 'overview' | 'products' | 'orders' | 'users' | 'categories' | 'brands' | 'coupons' | 'tickets' | 'chat' | 'inventory' | 'reviews' | 'reports' | 'faqs' | 'flash-sales' | 'settings' | 'seo';

// Stale-while-revalidate loading: only true on the very first fetch when no data exists yet.
// Subsequent refetches (tab refocus, filter change, etc.) keep existing data visible.
function useInitialLoading() {
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);
  const startFetch = useCallback(() => {
    if (loadedRef.current) return;
    setLoading(true);
  }, []);
  const finishFetch = useCallback(() => {
    loadedRef.current = true;
    setLoading(false);
  }, []);
  return { loading, startFetch, finishFetch, loadedRef };
}

const NAV: { key: AdminSection; label: string; icon: React.ReactNode; path: string }[] = [
  { key: 'overview', label: 'داشبورد', icon: <LayoutDashboard className="w-5 h-5" />, path: '/admin' },
  { key: 'products', label: 'محصولات', icon: <Package className="w-5 h-5" />, path: '/admin/products' },
  { key: 'orders', label: 'سفارشات', icon: <ShoppingBag className="w-5 h-5" />, path: '/admin/orders' },
  { key: 'users', label: 'کاربران', icon: <Users className="w-5 h-5" />, path: '/admin/users' },
  { key: 'categories', label: 'دسته‌بندی‌ها', icon: <FolderTree className="w-5 h-5" />, path: '/admin/categories' },
  { key: 'brands', label: 'برندها', icon: <Tag className="w-5 h-5" />, path: '/admin/brands' },
  { key: 'coupons', label: 'کدهای تخفیف', icon: <Tag className="w-5 h-5" />, path: '/admin/coupons' },
  { key: 'tickets', label: 'تیکت‌ها', icon: <TicketIcon className="w-5 h-5" />, path: '/admin/tickets' },
  { key: 'chat', label: 'چت آنلاین', icon: <Headphones className="w-5 h-5" />, path: '/admin/chat' },
  { key: 'inventory', label: 'انبار', icon: <Boxes className="w-5 h-5" />, path: '/admin/inventory' },
  { key: 'reviews', label: 'نظرات', icon: <Star className="w-5 h-5" />, path: '/admin/reviews' },
  { key: 'reports', label: 'گزارش‌ها', icon: <BarChart3 className="w-5 h-5" />, path: '/admin/reports' },
  { key: 'faqs', label: 'سوالات متداول', icon: <LayoutDashboard className="w-5 h-5" />, path: '/admin/faqs' },
  { key: 'flash-sales', label: 'حراج ویژه', icon: <Tag className="w-5 h-5" />, path: '/admin/flash-sales' },
  { key: 'seo', label: 'سئو', icon: <Star className="w-5 h-5" />, path: '/admin/seo' },
  { key: 'settings', label: 'تنظیمات سایت', icon: <Settings className="w-5 h-5" />, path: '/admin/settings' },
];

export function AdminLayout({ section, title, children }: { section: AdminSection; title: string; children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="py-12 text-center text-gray-500">در حال بارگذاری...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <>
      <Seo title={`مدیریت - ${title}`} noIndex />
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent-400" />
            <span className="font-700">پنل مدیریت ماموت شاپ</span>
          </div>
          <Link to="/" className="text-sm text-gray-300 hover:text-white flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> سایت
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          <aside className="lg:col-span-1">
            <nav className="card overflow-hidden sticky top-4">
              {NAV.map((n) => (
                <Link
                  key={n.key}
                  to={n.path}
                  className={`flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 transition-colors ${
                    section === n.key ? 'bg-primary-50 text-primary-700 font-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {n.icon} {n.label}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="lg:col-span-4">
            <h1 className="text-xl font-700 mb-4">{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminOverview() {
  const { toast } = useToast();
  const { loading, finishFetch } = useInitialLoading();
  const [stats, setStats] = useState({ products: 0, orders: 0, pendingOrders: 0, totalSales: 0, users: 0, tickets: 0, lowStock: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id, total_amount, status'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('products').select('stock, low_stock_threshold'),
    ])
      .then(([p, o, u, t, s]) => {
        const orders = (o.data ?? []) as { total_amount: number; status: string }[];
        const sales = orders.filter((x) => x.status !== 'cancelled').reduce((sum, x) => sum + Number(x.total_amount), 0);
        const products = (s.data ?? []) as { stock: number; low_stock_threshold: number }[];
        const lowStock = products.filter((p) => p.stock <= (p.low_stock_threshold ?? 0)).length;
        setStats({
          products: p.count ?? 0,
          orders: orders.length,
          pendingOrders: orders.filter((x) => x.status === 'pending').length,
          totalSales: sales,
          users: u.count ?? 0,
          tickets: t.count ?? 0,
          lowStock,
        });
      })
      .catch((e: any) => toast(e.message, 'error'))
      .finally(finishFetch);
  }, [toast, finishFetch]);

  return (
    <AdminLayout section="overview" title="داشبورد">
      {loading ? (
        <div className="py-12 text-center text-gray-500">در حال بارگذاری...</div>
      ) : (
        <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard color="primary" icon={<Package className="w-5 h-5" />} label="محصولات" value={toPersianDigits(stats.products)} />
        <StatCard color="accent" icon={<ShoppingBag className="w-5 h-5" />} label="سفارشات" value={toPersianDigits(stats.orders)} />
        <StatCard color="success" icon={<Users className="w-5 h-5" />} label="کاربران" value={toPersianDigits(stats.users)} />
        <StatCard color="warning" icon={<TicketIcon className="w-5 h-5" />} label="تیکت‌های باز" value={toPersianDigits(stats.tickets)} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">فروش کل</p>
          <p className="text-3xl font-800 text-success-600">{formatPrice(stats.totalSales)}</p>
          <span className="text-xs text-gray-400">تومان</span>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">سفارشات در انتظار</p>
          <p className="text-3xl font-800 text-warning-600">{toPersianDigits(stats.pendingOrders)}</p>
          <span className="text-xs text-gray-400">سفارش</span>
        </div>
      </div>
      {stats.lowStock > 0 && (
        <div className="card p-4 mt-4 bg-warning-50 border border-warning-200">
          <p className="text-sm text-warning-700">
            هشدار: {toPersianDigits(stats.lowStock)} محصول در حال اتمام موجودی هستند.{' '}
            <Link to="/admin/inventory" className="font-700 underline">مشاهده</Link>
          </p>
        </div>
      )}
        </>
      )}
    </AdminLayout>
  );
}

function StatCard({ color, icon, label, value }: { color: 'primary' | 'accent' | 'success' | 'warning' | 'error'; icon: React.ReactNode; label: string; value: string }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
  };
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-800 text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const { loading, finishFetch } = useInitialLoading();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      supabase.from('products').select('*, category:categories(*), brand:brands(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
    ]).then(([p, c, b]) => {
      setProducts((p.data ?? []) as Product[]);
      setCategories((c.data ?? []) as Category[]);
      setBrands((b.data ?? []) as Brand[]);
    }).catch((e) => toast(e.message, 'error')).finally(finishFetch);
  }, [toast, finishFetch]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('حذف این محصول؟')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      toast('محصول حذف شد', 'success');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  return (
    <AdminLayout section="products" title="مدیریت محصولات">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">{toPersianDigits(products.length)} محصول</span>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn btn-primary btn-sm"
        >
          + افزودن محصول
        </button>
      </div>

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          brands={brands}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      {loading ? <div className="card p-8 text-center text-gray-500">در حال بارگذاری...</div> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-right p-3">محصول</th>
                <th className="text-right p-3">دسته</th>
                <th className="text-right p-3">قیمت</th>
                <th className="text-right p-3">موجودی</th>
                <th className="text-center p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img src={p.image_url || ''} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-600 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{p.category?.name ?? '—'}</td>
                  <td className="p-3 font-600">{formatPrice(p.discount_price ?? p.price)}</td>
                  <td className="p-3">
                    <span className={`badge ${p.stock === 0 ? 'badge-error' : p.stock <= p.low_stock_threshold ? 'badge-warning' : 'badge-success'}`}>
                      {toPersianDigits(p.stock)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditing(p); setShowForm(true); }} className="btn btn-ghost btn-sm">ویرایش</button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-ghost btn-sm text-error-600">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">محصولی ثبت نشده است</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

function ProductForm({ product, categories, brands, onClose, onSaved }: {
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const formId = product?.id || 'new-product';
  const STORAGE_KEY = `product-form-${formId}`;

  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'specs' | 'shipping' | 'seo' | 'ai-seo'>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY}-tab`);
    return (saved as 'basic' | 'images' | 'specs' | 'shipping' | 'seo' | 'ai-seo') || 'basic';
  });

  const [form, setForm] = useState(() => {
    // Try to restore from sessionStorage first
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && !product) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      price: String(product?.price ?? ''),
      discount_price: product?.discount_price ? String(product.discount_price) : '',
      stock: String(product?.stock ?? '0'),
      low_stock_threshold: String(product?.low_stock_threshold ?? '5'),
      category_id: product?.category_id ?? '',
      brand_id: product?.brand_id ?? '',
      image_url: product?.image_url ?? '',
      is_featured: product?.is_featured ?? false,
      is_bestseller: product?.is_bestseller ?? false,
      color: product?.color ?? '',
      weight: product?.weight ? String(product.weight) : '',
      length: product?.length ? String(product.length) : '',
      width: product?.width ? String(product.width) : '',
      height: product?.height ? String(product.height) : '',
      shipping_class: product?.shipping_class ?? 'standard',
      package_type: product?.package_type ?? '',
      model_number: product?.model_number ?? '',
      sku: product?.sku ?? '',
      country_of_origin: product?.country_of_origin ?? '',
      warranty: product?.warranty ?? '',
      seo_title: product?.seo_title ?? '',
      seo_description: product?.seo_description ?? '',
      seo_keywords: product?.seo_keywords ?? '',
      canonical_url: product?.canonical_url ?? '',
      og_image: product?.og_image ?? '',
      meta_robots: product?.meta_robots ?? 'index, follow',
      focus_keyword: product?.focus_keyword ?? '',
    };
  });

  const [specifications, setSpecifications] = useState<[string, string][]>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY}-specs`);
    if (saved && !product) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const specs = product?.specifications ?? {};
    return Object.entries(specs);
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [additionalImages, setAdditionalImages] = useState<string[]>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY}-images`);
    if (saved && !product) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return product?.images?.map(i => i.url) ?? [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  // Save form state to sessionStorage on changes
  useEffect(() => {
    if (!product) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      sessionStorage.setItem(`${STORAGE_KEY}-specs`, JSON.stringify(specifications));
      sessionStorage.setItem(`${STORAGE_KEY}-images`, JSON.stringify(additionalImages));
      sessionStorage.setItem(`${STORAGE_KEY}-tab`, activeTab);
    }
  }, [form, specifications, additionalImages, activeTab, STORAGE_KEY, product]);

  // Clear saved state on successful save
  const clearSavedState = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(`${STORAGE_KEY}-specs`);
    sessionStorage.removeItem(`${STORAGE_KEY}-images`);
    sessionStorage.removeItem(`${STORAGE_KEY}-tab`);
  };

  const SPEC_PRESETS = [
    { key: 'weight', label: 'وزن' },
    { key: 'dimensions', label: 'ابعاد' },
    { key: 'material', label: 'جنس' },
    { key: 'color', label: 'رنگ' },
    { key: 'capacity', label: 'ظرفیت' },
    { key: 'voltage', label: 'ولتاژ' },
    { key: 'power', label: 'توان' },
    { key: 'ram', label: 'رم' },
    { key: 'storage', label: 'حافظه داخلی' },
    { key: 'cpu', label: 'پردازنده' },
    { key: 'gpu', label: 'گرافیک' },
    { key: 'os', label: 'سیستم عامل' },
    { key: 'screen_size', label: 'اندازه صفحه' },
    { key: 'resolution', label: 'رزولوشن' },
    { key: 'battery', label: 'باتری' },
    { key: 'connectivity', label: 'اتصالات' },
    { key: 'bluetooth', label: 'بلوتوث' },
    { key: 'wifi', label: 'وای‌فای' },
    { key: 'warranty', label: 'گارانتی' },
    { key: 'origin', label: 'کشور سازنده' },
    { key: 'model', label: 'مدل' },
    { key: 'sku', label: 'SKU' },
  ];

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      toast('خطا در آپلود تصویر', 'error');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('فقط فایل تصویر مجاز است', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('حجم فایل نباید بیشتر از ۵ مگابایت باشد', 'error'); return; }
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setForm({ ...form, image_url: url });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => {
      if (!f.type.startsWith('image/')) { toast(`فایل ${f.name} تصویر نیست`, 'error'); return false; }
      if (f.size > 5 * 1024 * 1024) { toast(`فایل ${f.name} بزرگ است`, 'error'); return false; }
      return true;
    });
    if (validFiles.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of validFiles) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setAdditionalImages([...additionalImages, ...urls]);
    setUploading(false);
    if (additionalInputRef.current) additionalInputRef.current.value = '';
  };

  const addSpecification = (key = '', value = '') => {
    setSpecifications([...specifications, [key, value]]);
  };

  const updateSpecification = (index: number, key: string, value: string) => {
    const updated = [...specifications];
    updated[index] = [key, value];
    setSpecifications(updated);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = form.slug || form.name.trim().replace(/\s+/g, '-').toLowerCase();
      const specs: Record<string, string> = {};
      specifications.forEach(([key, value]) => {
        if (key.trim() && value.trim()) specs[key.trim()] = value.trim();
      });

      const payload = {
        name: form.name.trim(),
        slug,
        description: form.description || null,
        specifications: specs,
        price: Number(form.price) || 0,
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        stock: Number(form.stock) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 5,
        category_id: form.category_id || null,
        brand_id: form.brand_id || null,
        image_url: form.image_url || null,
        color: form.color || null,
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        weight: form.weight ? Number(form.weight) : null,
        length: form.length ? Number(form.length) : null,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        shipping_class: form.shipping_class || 'standard',
        package_type: form.package_type || null,
        model_number: form.model_number || null,
        sku: form.sku || null,
        country_of_origin: form.country_of_origin || null,
        warranty: form.warranty || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        seo_keywords: form.seo_keywords || null,
        canonical_url: form.canonical_url || null,
        og_image: form.og_image || null,
        meta_robots: form.meta_robots || 'index, follow',
        focus_keyword: form.focus_keyword || null,
      };

      let productId = product?.id;

      if (product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) {
          if (error.code === '23505') toast('محصول با این اسلاگ قبلاً ثبت شده', 'error');
          else throw error;
        }
        await supabase.from('product_images').delete().eq('product_id', product.id);
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) {
          if (error.code === '23505') toast('محصول با این اسلاگ قبلاً ثبت شده', 'error');
          else throw error;
        }
        productId = data?.id;
      }

      if (productId && additionalImages.length > 0) {
        const imageRecords = additionalImages.map((url, idx) => ({
          product_id: productId,
          image_url: url,
          sort_order: idx,
        }));
        await supabase.from('product_images').insert(imageRecords);
      }

      toast('محصول ذخیره شد', 'success');
      clearSavedState();
      onSaved();
    } catch {
      toast('خطا در ذخیره محصول', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'basic', label: 'اطلاعات پایه', icon: Package },
    { key: 'images', label: 'تصاویر', icon: ImageIcon },
    { key: 'specs', label: 'مشخصات فنی', icon: Settings },
    { key: 'shipping', label: 'ارسال', icon: Package },
    { key: 'seo', label: 'سئو', icon: Star },
    { key: 'ai-seo', label: 'سئو با AI', icon: Sparkles },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-down">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-700">{product ? 'ویرایش محصول' : 'محصول جدید'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-500 whitespace-nowrap transition-colors ${
                activeTab === t.key ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">نام محصول *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="مثال: گوشی سامسونگ Galaxy S24" />
                </div>
                <div>
                  <label className="label">اسلاگ (URL)</label>
                  <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" placeholder="samsung-galaxy-s24" />
                </div>
              </div>
              <div>
                <label className="label">توضیحات</label>
                <textarea className="input min-h-32" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="توضیحات کامل محصول..." />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">دسته‌بندی</label>
                  <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">بدون دسته‌بندی</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">برند</label>
                  <select className="input" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                    <option value="">بدون برند</option>
                    {brands.filter(b => b.is_active).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">قیمت (تومان) *</label>
                  <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div>
                  <label className="label">قیمت تخفیف‌خورده</label>
                  <input type="number" className="input" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">رنگ</label>
                  <input className="input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="مثال: مشکی" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">موجودی *</label>
                  <input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                </div>
                <div>
                  <label className="label">آستانه موجودی کم</label>
                  <input type="number" className="input" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded text-primary-600" />
                  <span className="text-sm">محصول ویژه</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_bestseller} onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked })} className="rounded text-primary-600" />
                  <span className="text-sm">پرفروش</span>
                </label>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div>
                <label className="label mb-3">تصویر اصلی</label>
                <div className="flex items-start gap-4">
                  <div className="relative w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    {form.image_url ? (
                      <>
                        <img src={form.image_url} alt="تصویر اصلی" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="absolute top-1 left-1 w-6 h-6 rounded-full bg-error-500 text-white flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" id="main-image-upload" />
                    <label htmlFor="main-image-upload" className={`btn btn-secondary cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading ? 'در حال آپلود...' : <><Upload className="w-4 h-4" /> آپلود تصویر</>}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG, WebP | حداکثر ۵ مگابایت</p>
                    <input className="input mt-3 text-xs" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="یا لینک تصویر را وارد کنید" dir="ltr" />
                  </div>
                </div>
              </div>
              <div>
                <label className="label mb-3">تصاویر اضافی</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {additionalImages.map((url, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={url} alt={`تصویر ${idx + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setAdditionalImages(additionalImages.filter((_, i) => i !== idx))} className="absolute top-1 left-1 w-5 h-5 rounded-full bg-error-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {additionalImages.length === 0 && <p className="text-sm text-gray-400 py-4">تصویر اضافی ندارد</p>}
                </div>
                <input ref={additionalInputRef} type="file" accept="image/*" multiple onChange={handleAdditionalImagesUpload} className="hidden" id="additional-images-upload" />
                <label htmlFor="additional-images-upload" className={`btn btn-secondary btn-sm cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploading ? 'در حال آپلود...' : <><Plus className="w-4 h-4" /> افزودن تصاویر</>}
                </label>
              </div>
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">مشخصات فنی محصول را وارد کنید</p>
                <button type="button" onClick={() => addSpecification()} className="btn btn-secondary btn-sm">
                  <Plus className="w-4 h-4" /> افزودن مشخصه
                </button>
              </div>
              {specifications.length === 0 ? (
                <div className="card p-8 text-center border-dashed">
                  <Settings className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">مشخصاتی ثبت نشده</p>
                  <button type="button" onClick={() => addSpecification()} className="btn btn-primary btn-sm">افزودن اولین مشخصه</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {specifications.map(([key, value], idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="label text-xs mb-1">نام مشخصه</label>
                          <input
                            className="input text-sm"
                            value={key}
                            onChange={(e) => updateSpecification(idx, e.target.value, value)}
                            placeholder="مثال: وزن"
                            list={`spec-keys-${idx}`}
                          />
                          <datalist id={`spec-keys-${idx}`}>
                            {SPEC_PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                          </datalist>
                        </div>
                        <div>
                          <label className="label text-xs mb-1">مقدار</label>
                          <input className="input text-sm" value={value} onChange={(e) => updateSpecification(idx, key, e.target.value)} placeholder="مثال: ۱۸۰ گرم" />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeSpecification(idx)} className="p-2 text-error-500 hover:bg-error-50 rounded-lg shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="label">وزن (کیلوگرم)</label>
                  <input type="number" step="0.01" className="input" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
                <div>
                  <label className="label">طول (سانتی‌متر)</label>
                  <input type="number" step="0.1" className="input" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
                </div>
                <div>
                  <label className="label">عرض (سانتی‌متر)</label>
                  <input type="number" step="0.1" className="input" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
                </div>
                <div>
                  <label className="label">ارتفاع (سانتی‌متر)</label>
                  <input type="number" step="0.1" className="input" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">طبقه ارسال</label>
                  <select className="input" value={form.shipping_class} onChange={(e) => setForm({ ...form, shipping_class: e.target.value })}>
                    <option value="standard">معمولی</option>
                    <option value="express">سریع</option>
                    <option value="fragile">شکننده</option>
                    <option value="oversized">حجیم</option>
                  </select>
                </div>
                <div>
                  <label className="label">نوع بسته‌بندی</label>
                  <select className="input" value={form.package_type} onChange={(e) => setForm({ ...form, package_type: e.target.value })}>
                    <option value="">—</option>
                    <option value="box">جعبه مقوایی</option>
                    <option value="bubble">حباب‌دار</option>
                    <option value="envelope">پاکت</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">شماره مدل</label>
                  <input className="input" value={form.model_number} onChange={(e) => setForm({ ...form, model_number: e.target.value })} dir="ltr" />
                </div>
                <div>
                  <label className="label">SKU</label>
                  <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} dir="ltr" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">کشور سازنده</label>
                  <input className="input" value={form.country_of_origin} onChange={(e) => setForm({ ...form, country_of_origin: e.target.value })} placeholder="مثال: کره جنوبی" />
                </div>
                <div>
                  <label className="label">گارانتی</label>
                  <input className="input" value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} placeholder="مثال: ۱۸ ماه گارانتی" />
                </div>
              </div>
              <hr className="border-gray-200" />
              <h4 className="font-600 text-gray-900">تنظیمات سئو</h4>
              <div>
                <label className="label">عنوان سئو (SEO Title)</label>
                <input className="input" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="عنوان بهینه برای موتورهای جستجو" maxLength={60} />
                <p className="text-xs text-gray-500 mt-1">{toPersianDigits(form.seo_title?.length || 0)} / ۶۰ کاراکتر</p>
              </div>
              <div>
                <label className="label">توضیحات سئو (Meta Description)</label>
                <textarea className="input min-h-20" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder="توضیحات کوتاه برای نمایش در نتایج جستجو" maxLength={160} />
                <p className="text-xs text-gray-500 mt-1">{toPersianDigits(form.seo_description?.length || 0)} / ۱۶۰ کاراکتر</p>
              </div>
              <div>
                <label className="label">کلمات کلیدی</label>
                <input className="input" value={form.seo_keywords} onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })} placeholder="موبایل, سامسونگ, گوشی" />
                <p className="text-xs text-gray-500 mt-1">کلمات را با کاما جدا کنید</p>
              </div>
              <div>
                <label className="label">کلمه کلیدی اصلی</label>
                <input className="input" value={form.focus_keyword} onChange={(e) => setForm({ ...form, focus_keyword: e.target.value })} placeholder="کلمه کلیدی هدف" />
              </div>
              <div>
                <label className="label">تصویر Open Graph</label>
                <input className="input" value={form.og_image} onChange={(e) => setForm({ ...form, og_image: e.target.value })} placeholder="لینک تصویر اجتماعی" dir="ltr" />
              </div>
              <div>
                <label className="label">Canonical URL</label>
                <input className="input" value={form.canonical_url} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} placeholder="https://example.com/product/..." dir="ltr" />
              </div>
              <div>
                <label className="label">دستور ربات</label>
                <select className="input" value={form.meta_robots} onChange={(e) => setForm({ ...form, meta_robots: e.target.value })}>
                  <option value="index, follow">ایندکس و دنبال کردن (پیشفرض)</option>
                  <option value="index, nofollow">ایندکس بدون دنبال کردن</option>
                  <option value="noindex, follow">بدون ایندکس با دنبال کردن</option>
                  <option value="noindex, nofollow">بدون ایندکس و بدون دنبال کردن</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'ai-seo' && product && (
            <AiSeoPanel product={product} onApplied={onSaved} />
          )}
          {activeTab === 'ai-seo' && !product && (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>ابتدا محصول را ذخیره کنید تا بتوانید سئو با هوش مصنوعی تولید کنید</p>
            </div>
          )}
        </form>

        <div className="p-4 border-t border-gray-100 flex gap-2 justify-end shrink-0">
          <button type="button" onClick={onClose} className="btn btn-ghost">انصراف</button>
          <button type="submit" onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'در حال ذخیره...' : 'ذخیره محصول'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const { loading, finishFetch } = useInitialLoading();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterShipping, setFilterShipping] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderTimeline, setOrderTimeline] = useState<OrderTimeline[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [stats, setStats] = useState({
    total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0,
    todaySales: 0, monthSales: 0
  });

  const loadOrders = useCallback(async () => {
    try {
      let query = supabase.from('orders').select('*, profiles(id, full_name, phone)', { count: 'exact' });
      if (search) {
        query = query.or(`order_number.ilike.%${search}%,tracking_code.ilike.%${search}%`);
      }
      if (filterStatus) query = query.eq('status', filterStatus);
      if (filterPayment) query = query.eq('payment_status', filterPayment);
      if (filterShipping) query = query.eq('shipping_status', filterShipping);
      if (filterDate) {
        const date = new Date(filterDate);
        query = query.gte('created_at', date.toISOString()).lt('created_at', new Date(date.getTime() + 86400000).toISOString());
      }
      const from = (page - 1) * pageSize;
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);
      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch {
      toast('خطا در بارگذاری سفارشات', 'error');
    } finally {
      finishFetch();
    }
  }, [toast, search, filterStatus, filterPayment, filterShipping, filterDate, page, finishFetch]);

  const loadStats = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: allOrders } = await supabase.from('orders').select('status, total_amount, created_at');
      if (allOrders) {
        const total = allOrders.length;
        const pending = allOrders.filter(o => o.status === 'pending').length;
        const processing = allOrders.filter(o => o.status === 'processing').length;
        const shipped = allOrders.filter(o => o.status === 'shipped').length;
        const delivered = allOrders.filter(o => o.status === 'delivered').length;
        const cancelled = allOrders.filter(o => o.status === 'cancelled').length;
        const todaySales = allOrders.filter(o => new Date(o.created_at) >= today).reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const monthSales = allOrders.filter(o => new Date(o.created_at) >= monthStart).reduce((sum, o) => sum + (o.total_amount || 0), 0);
        setStats({ total, pending, processing, shipped, delivered, cancelled, todaySales, monthSales });
      }
    } catch {
      // ignore stats errors
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadStats();
    // Real-time subscription for new orders
    const channel = supabase.channel('orders-changes');
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
      loadOrders();
      loadStats();
      toast('سفارش جدید ثبت شد!', 'success');
    });
    channel.subscribe();
    return () => { channel.unsubscribe(); };
  }, [loadOrders, loadStats, toast]);

  const loadOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
    const [{ data: items }, { data: timeline }] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', order.id),
      supabase.from('order_timeline').select('*').eq('order_id', order.id).order('created_at', { ascending: true }),
    ]);
    setOrderItems((items as OrderItem[]) || []);
    setOrderTimeline((timeline as OrderTimeline[]) || []);
  };

  const updateOrderStatus = async (orderId: string, updates: Partial<Order>, timelineNote?: string) => {
    try {
      const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
      if (error) throw error;
      if (timelineNote) {
        await supabase.from('order_timeline').insert({
          order_id: orderId,
          status: updates.status || updates.payment_status || updates.shipping_status || 'updated',
          note: timelineNote
        });
      }
      toast('به‌روزرسانی شد', 'success');
      loadOrders();
      if (selectedOrder?.id === orderId) {
        loadOrderDetails({ ...selectedOrder, ...updates });
      }
    } catch {
      toast('خطا در به‌روزرسانی', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedOrders);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedOrders(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(orders.map(o => o.id)));
  };

  const bulkAction = async (action: string) => {
    if (selectedOrders.size === 0) return;
    const ids = Array.from(selectedOrders);
    let updates: Partial<Order> = {};
    let note = '';
    switch (action) {
      case 'confirm': updates = { status: 'processing', payment_status: 'paid', confirmed_at: new Date().toISOString() }; note = 'سفارش تایید شد'; break;
      case 'processing': updates = { status: 'processing' }; note = 'در حال آماده‌سازی'; break;
      case 'packed': updates = { shipping_status: 'packed' }; note = 'بسته‌بندی شد'; break;
      case 'shipped': updates = { status: 'shipped', shipping_status: 'shipped', shipped_at: new Date().toISOString() }; note = 'ارسال شد'; break;
      case 'delivered': updates = { status: 'delivered', shipping_status: 'delivered', delivered_at: new Date().toISOString() }; note = 'تحویل شد'; break;
      case 'cancel': updates = { status: 'cancelled', cancelled_at: new Date().toISOString() }; note = 'لغو شد'; break;
      default: return;
    }
    try {
      await supabase.from('orders').update(updates).in('id', ids);
      for (const id of ids) {
        await supabase.from('order_timeline').insert({ order_id: id, status: action, note });
      }
      toast(`${toPersianDigits(ids.length)} سفارش به‌روزرسانی شد`, 'success');
      setSelectedOrders(new Set());
      loadOrders();
      loadStats();
    } catch {
      toast('خطا در به‌روزرسانی گروهی', 'error');
    }
  };

  const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
    { value: 'pending', label: 'در انتظار', color: 'bg-warning-100 text-warning-700' },
    { value: 'paid', label: 'پرداخت شد', color: 'bg-primary-100 text-primary-700' },
    { value: 'processing', label: 'آماده‌سازی', color: 'bg-blue-100 text-blue-700' },
    { value: 'shipped', label: 'ارسال شد', color: 'bg-accent-100 text-accent-700' },
    { value: 'delivered', label: 'تحویل شد', color: 'bg-success-100 text-success-700' },
    { value: 'cancelled', label: 'لغو شد', color: 'bg-error-100 text-error-700' },
    { value: 'returned', label: 'مرجوعی', color: 'bg-gray-100 text-gray-700' },
    { value: 'refunded', label: 'بازگشت وجه', color: 'bg-purple-100 text-purple-700' },
  ];

  const PAYMENT_OPTIONS = [
    { value: 'pending', label: 'در انتظار پرداخت' },
    { value: 'paid', label: 'پرداخت شده' },
    { value: 'failed', label: 'ناموفق' },
    { value: 'refunded', label: 'بازگشت وجه' },
  ];

  const SHIPPING_OPTIONS = [
    { value: 'pending', label: 'در انتظار' },
    { value: 'processing', label: 'در حال پردازش' },
    { value: 'packed', label: 'بسته‌بندی شد' },
    { value: 'shipped', label: 'ارسال شد' },
    { value: 'delivered', label: 'تحویل شد' },
    { value: 'returned', label: 'بازگشت' },
  ];

  return (
    <AdminLayout section="orders" title="مدیریت سفارشات">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <OrderStatCard label="کل سفارشات" value={stats.total} icon={<Package className="w-5 h-5" />} color="bg-primary-100 text-primary-600" />
        <OrderStatCard label="در انتظار" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="bg-warning-100 text-warning-600" />
        <OrderStatCard label="آماده‌سازی" value={stats.processing} icon={<Package className="w-5 h-5" />} color="bg-blue-100 text-blue-600" />
        <OrderStatCard label="ارسال شد" value={stats.shipped} icon={<Truck className="w-5 h-5" />} color="bg-accent-100 text-accent-600" />
        <OrderStatCard label="تحویل شد" value={stats.delivered} icon={<CheckCircle className="w-5 h-5" />} color="bg-success-100 text-success-600" />
        <OrderStatCard label="لغو شده" value={stats.cancelled} icon={<XCircle className="w-5 h-5" />} color="bg-error-100 text-error-600" />
      </div>

      {/* Sales Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card p-4 bg-gradient-to-l from-primary-500 to-primary-700 text-white">
          <p className="text-sm opacity-80">فروش امروز</p>
          <p className="text-2xl font-800 mt-1">{formatPrice(stats.todaySales)}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-accent-500 to-accent-700 text-white">
          <p className="text-sm opacity-80">فروش این ماه</p>
          <p className="text-2xl font-800 mt-1">{formatPrice(stats.monthSales)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pr-10 w-full" placeholder="جستجو شماره سفارش، کد رهگیری..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input w-auto" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">وضعیت سفارش</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="input w-auto" value={filterPayment} onChange={(e) => { setFilterPayment(e.target.value); setPage(1) }}>
            <option value="">وضعیت پرداخت</option>
            {PAYMENT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="input w-auto" value={filterShipping} onChange={(e) => { setFilterShipping(e.target.value); setPage(1) }}>
            <option value="">وضعیت ارسال</option>
            {SHIPPING_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input type="date" className="input w-auto" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="card p-3 mb-4 bg-primary-50 border border-primary-200 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-600 text-primary-700">{toPersianDigits(selectedOrders.size)} سفارش انتخاب شده</span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => bulkAction('confirm')} className="btn btn-success btn-sm">تایید</button>
            <button onClick={() => bulkAction('processing')} className="btn btn-primary btn-sm">آماده‌سازی</button>
            <button onClick={() => bulkAction('packed')} className="btn btn-secondary btn-sm">بسته‌بندی</button>
            <button onClick={() => bulkAction('shipped')} className="btn btn-accent btn-sm">ارسال</button>
            <button onClick={() => bulkAction('delivered')} className="btn btn-success btn-sm">تحویل</button>
            <button onClick={() => bulkAction('cancel')} className="btn btn-error btn-sm">لغو</button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">در حال بارگذاری...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">سفارشی یافت نشد</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3 text-center w-10">
                  <input type="checkbox" checked={selectedOrders.size === orders.length && orders.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="text-right p-3">شماره سفارش</th>
                <th className="text-right p-3">مشتری</th>
                <th className="text-right p-3">مبلغ</th>
                <th className="text-right p-3">وضعیت سفارش</th>
                <th className="text-right p-3">وضعیت ارسال</th>
                <th className="text-right p-3">تاریخ</th>
                <th className="text-center p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const statusInfo = STATUS_OPTIONS.find(s => s.value === o.status) || STATUS_OPTIONS[0];
                const shippingInfo = SHIPPING_OPTIONS.find(s => s.value === o.shipping_status) || SHIPPING_OPTIONS[0];
                return (
                  <tr key={o.id} className={`border-t border-gray-100 hover:bg-gray-50 ${selectedOrders.has(o.id) ? 'bg-primary-50' : ''}`}>
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={selectedOrders.has(o.id)} onChange={() => toggleSelect(o.id)} className="rounded" />
                    </td>
                    <td className="p-3">
                      <button onClick={() => loadOrderDetails(o)} className="font-600 text-primary-600 hover:underline">
                        #{o.order_number}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-600">
                          {(o.profiles as any)?.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-500">{(o.profiles as any)?.full_name || 'کاربر'}</p>
                          <p className="text-xs text-gray-400">{(o.profiles as any)?.phone || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-600">{formatPrice(o.total_amount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-600 ${statusInfo.color}`}>{statusInfo.label}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">{shippingInfo.label}</span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">{formatDate(o.created_at)}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => loadOrderDetails(o)} className="btn btn-ghost btn-sm">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm">قبلی</button>
        <span className="text-sm text-gray-500">صفحه {toPersianDigits(page)}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={orders.length < pageSize} className="btn btn-ghost btn-sm">بعدی</button>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-4xl my-8 animate-slide-down">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-700 text-lg">سفارش #{selectedOrder.order_number}</h3>
                <p className="text-sm text-gray-500">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Timeline */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4">
                {['pending', 'paid', 'processing', 'shipped', 'delivered'].map((s, i) => {
                  const isCompleted = STATUS_OPTIONS.findIndex(x => x.value === selectedOrder.status) >= i;
                  const isCurrent = selectedOrder.status === s;
                  const info = STATUS_OPTIONS.find(x => x.value === s);
                  return (
                    <div key={s} className="flex items-center">
                      <div className={`flex flex-col items-center ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-success-600' : 'text-gray-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrent ? 'bg-primary-100' : isCompleted ? 'bg-success-100' : 'bg-gray-100'}`}>
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <p className="text-xs mt-1 whitespace-nowrap">{info?.label}</p>
                      </div>
                      {i < 4 && <div className={`w-12 h-0.5 mx-1 ${isCompleted ? 'bg-success-300' : 'bg-gray-200'}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Customer & Addresses */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-600 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> اطلاعات مشتری</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <p><span className="text-gray-500">نام:</span> <span className="font-600">{(selectedOrder.profiles as any)?.full_name || 'کاربر'}</span></p>
                    <p><span className="text-gray-500">تلفن:</span> {(selectedOrder.profiles as any)?.phone || '-'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-600 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> آدرس ارسال</h4>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <p>{(selectedOrder.shipping_address as any)?.address || '-'}</p>
                    <p className="text-gray-500 mt-1">{(selectedOrder.shipping_address as any)?.city}، {(selectedOrder.shipping_address as any)?.province}</p>
                    <p className="text-gray-500">کد پستی: {(selectedOrder.shipping_address as any)?.postal_code || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-600 mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> محصولات</h4>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <img src={item.image_url || ''} alt={item.product_name} className="w-16 h-16 rounded-lg object-cover bg-gray-200" />
                      <div className="flex-1">
                        <p className="font-600">{item.product_name}</p>
                        <p className="text-sm text-gray-500">تعداد: {toPersianDigits(item.quantity)}</p>
                      </div>
                      <p className="font-600 text-primary-600">{formatPrice(item.unit_price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">جمع محصولات</span><span>{formatPrice(selectedOrder.total_amount)}</span></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">تخفیف</span><span className="text-error-600">-{formatPrice(selectedOrder.discount_amount)}</span></div>
                {selectedOrder.shipping_cost > 0 && <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">هزینه ارسال</span><span>{formatPrice(selectedOrder.shipping_cost)}</span></div>}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-700">
                  <span>مبلغ نهایی</span>
                  <span className="text-primary-600">{formatPrice(selectedOrder.total_amount - selectedOrder.discount_amount + (selectedOrder.shipping_cost || 0))}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-600 mb-3">تغییر وضعیت</h4>
                <div className="flex flex-wrap gap-2">
                  <select className="input w-auto" value={selectedOrder.status} onChange={(e) => updateOrderStatus(selectedOrder.id, { status: e.target.value as OrderStatus }, 'تغییر وضعیت سفارش')}>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <select className="input w-auto" value={selectedOrder.shipping_status || ''} onChange={(e) => updateOrderStatus(selectedOrder.id, { shipping_status: e.target.value as ShippingStatus }, 'تغییر وضعیت ارسال')}>
                    <option value="">وضعیت ارسال</option>
                    {SHIPPING_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <input className="input w-auto" placeholder="کد رهگیری" value={selectedOrder.tracking_code || ''} onChange={(e) => setSelectedOrder({ ...selectedOrder, tracking_code: e.target.value })} />
                  <button onClick={() => updateOrderStatus(selectedOrder.id, { tracking_code: selectedOrder.tracking_code }, 'ثبت کد رهگیری')} className="btn btn-secondary btn-sm">ذخیره کد رهگیری</button>
                </div>
              </div>

              {/* Timeline */}
              {orderTimeline.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-600 mb-3">تاریخچه سفارش</h4>
                  <div className="space-y-3">
                    {orderTimeline.map((t) => (
                      <div key={t.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                        <div>
                          <p className="font-600">{t.status}</p>
                          {t.note && <p className="text-gray-500">{t.note}</p>}
                          <p className="text-xs text-gray-400">{formatDate(t.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function OrderStatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        <span className="text-2xl font-800">{toPersianDigits(value)}</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{label}</p>
    </div>
  );
}

export function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const { loading, finishFetch } = useInitialLoading();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) toast(error.message, 'error');
        else setUsers((data ?? []) as Profile[]);
      } finally { finishFetch(); }
    })();
  }, [toast, finishFetch]);

  const toggleAdmin = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', id);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_admin: !current } : u)));
      toast('به‌روزرسانی شد', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  return (
    <AdminLayout section="users" title="مدیریت کاربران">
      {loading ? <div className="card p-8 text-center text-gray-500">در حال بارگذاری...</div> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-right p-3">نام</th>
                <th className="text-right p-3">تلفن</th>
                <th className="text-right p-3">تاریخ عضویت</th>
                <th className="text-center p-3">نقش</th>
                <th className="text-center p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="p-3 font-600">{u.full_name ?? '—'}</td>
                  <td className="p-3 text-gray-600" dir="ltr">{u.phone ?? '—'}</td>
                  <td className="p-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                  <td className="p-3 text-center">
                    {u.is_admin ? <span className="badge badge-accent">مدیر</span> : <span className="badge badge-primary">کاربر</span>}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleAdmin(u.id, u.is_admin)} className="btn btn-ghost btn-sm">
                      {u.is_admin ? 'سلب دسترسی' : 'اعطای دسترسی'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">کاربری ثبت نشده است</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const { loading, finishFetch } = useInitialLoading();
  const [showForm, setShowForm] = useState(false);
  const empty = { name: '', slug: '', description: '', image_url: '' };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) toast(error.message, 'error');
        else setCategories((data ?? []) as Category[]);
      } finally { finishFetch(); }
    })();
  }, [toast, finishFetch]);
  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, slug: form.slug || form.name.replace(/\s+/g, '-') };
      if (editingId) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }
      toast('ذخیره شد', 'success');
      setShowForm(false); setForm(empty); setEditingId(null); load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  const handleEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', image_url: c.image_url ?? '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف این دسته؟')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      toast('حذف شد', 'success');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  return (
    <AdminLayout section="categories" title="مدیریت دسته‌بندی‌ها">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">{toPersianDigits(categories.length)} دسته</span>
        <button onClick={() => { setForm(empty); setEditingId(null); setShowForm(true); }} className="btn btn-primary btn-sm">+ افزودن دسته</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card p-6 mb-4 animate-slide-down">
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label">نام</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">slug</label><input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" /></div>
            <div className="md:col-span-2"><label className="label">توضیحات</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="md:col-span-2"><label className="label">آدرس تصویر</label><input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} dir="ltr" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary btn-sm">ذخیره</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-ghost btn-sm">انصراف</button>
          </div>
        </form>
      )}

      {loading ? <div className="card p-8 text-center text-gray-500">در حال بارگذاری...</div> : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="card p-4">
              <p className="font-700 mb-1">{c.name}</p>
              <p className="text-xs text-gray-400" dir="ltr">{c.slug}</p>
              {c.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.description}</p>}
              <div className="flex gap-1 mt-3">
                <button onClick={() => handleEdit(c)} className="btn btn-ghost btn-sm">ویرایش</button>
                <button onClick={() => handleDelete(c.id)} className="btn btn-ghost btn-sm text-error-600">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export function AdminBrands() {
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const { loading, finishFetch } = useInitialLoading();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const empty = { name: '', slug: '', description: '', logo_url: '', is_active: true };
  const [form, setForm] = useState(empty);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 12;

  const load = useCallback(() => {
    (async () => {
      try {
        let query = supabase.from('brands').select('*', { count: 'exact' });
        if (search) query = query.ilike('name', `%${search}%`);
        if (filterActive !== null) query = query.eq('is_active', filterActive);
        const from = (page - 1) * pageSize;
        const { data, error, count } = await query.order('name').range(from, from + pageSize - 1);
        if (error) toast(error.message, 'error');
        else {
          setBrands((data ?? []) as Brand[]);
        }
      } finally { finishFetch(); }
    })();
  }, [toast, search, page, filterActive, finishFetch]);

  useEffect(load, [load]);

  const uploadLogo = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `brand-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `brands/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      toast('خطا در آپلود لوگو', 'error');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('فقط فایل تصویر مجاز است', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast('حجم فایل نباید بیشتر از ۲ مگابایت باشد', 'error');
      return;
    }

    setUploading(true);
    const url = await uploadLogo(file);
    if (url) setForm({ ...form, logo_url: url });
    setUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('نام برند الزامی است', 'error');
      return;
    }
    try {
      const slug = form.slug.trim() || form.name.replace(/\s+/g, '-').toLowerCase();
      const payload = { ...form, slug, name: form.name.trim() };
      if (editingId) {
        const { error } = await supabase.from('brands').update(payload).eq('id', editingId);
        if (error) {
          if (error.code === '23505') toast('برند با این نام یا اسلاگ قبلاً ثبت شده', 'error');
          else throw error;
        } else {
          toast('برند به‌روزرسانی شد', 'success');
          setShowForm(false);
          setForm(empty);
          setEditingId(null);
          load();
        }
      } else {
        const { error } = await supabase.from('brands').insert(payload);
        if (error) {
          if (error.code === '23505') toast('برند با این نام یا اسلاگ قبلاً ثبت شده', 'error');
          else throw error;
        } else {
          toast('برند اضافه شد', 'success');
          setShowForm(false);
          setForm(empty);
          load();
        }
      }
    } catch {
      toast('خطا در ذخیره برند', 'error');
    }
  };

  const handleEdit = (b: Brand) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      slug: b.slug,
      description: b.description ?? '',
      logo_url: b.logo_url ?? '',
      is_active: b.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
      toast('برند حذف شد', 'success');
      setDeleteConfirm(null);
      load();
    } catch {
      toast('خطا در حذف برند', 'error');
    }
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('brands').update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
      toast(isActive ? 'برند غیرفعال شد' : 'برند فعال شد', 'success');
      load();
    } catch {
      toast('خطا در تغییر وضعیت', 'error');
    }
  };

  return (
    <AdminLayout section="brands" title="مدیریت برندها">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pr-10 w-64"
              placeholder="جستجوی برند..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input w-32"
            value={filterActive === null ? '' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              if (e.target.value === '') setFilterActive(null);
              else if (e.target.value === 'active') setFilterActive(true);
              else setFilterActive(false);
              setPage(1);
            }}
          >
            <option value="">همه</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
          </select>
        </div>
        <button onClick={() => { setForm(empty); setEditingId(null); setShowForm(true); }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> افزودن برند جدید
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg animate-slide-down">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-700">{editingId ? 'ویرایش برند' : 'افزودن برند جدید'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">نام برند *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="مثال: سامسونگ" />
                </div>
                <div>
                  <label className="label">اسلاگ (اختیاری)</label>
                  <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" placeholder="مثال: samsung" />
                </div>
              </div>
              <div>
                <label className="label">توضیحات</label>
                <textarea className="input min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="توضیحات برند..." />
              </div>
              <div>
                <label className="label">وضعیت</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={form.is_active} onChange={() => setForm({ ...form, is_active: true })} className="text-primary-600" />
                    <span className="text-sm">فعال</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!form.is_active} onChange={() => setForm({ ...form, is_active: false })} className="text-primary-600" />
                    <span className="text-sm">غیرفعال</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="label">لوگوی برند</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    {form.logo_url ? (
                      <>
                        <img src={form.logo_url} alt="لوگو" className="w-full h-full object-contain" />
                        <button type="button" onClick={() => setForm({ ...form, logo_url: '' })} className="absolute top-1 left-1 w-5 h-5 rounded-full bg-error-500 text-white flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="brand-logo-upload" />
                    <label htmlFor="brand-logo-upload" className={`btn btn-secondary btn-sm cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading ? 'در حال آپلود...' : <><Upload className="w-4 h-4" /> آپلود لوگو</>}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG | حداکثر ۲ مگابایت</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button type="submit" className="btn btn-primary flex-1">ذخیره</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm animate-slide-down text-center">
            <div className="w-14 h-14 rounded-full bg-error-100 text-error-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-700 text-lg mb-2">حذف برند</h3>
            <p className="text-gray-500 text-sm mb-6">آیا از حذف این برند اطمینان دارید؟ این عمل قابل بازگشت نیست.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-error flex-1">حذف</button>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* Brands Grid */}
      {loading ? (
        <div className="card p-12 text-center text-gray-500">در حال بارگذاری...</div>
      ) : brands.length === 0 ? (
        <div className="card p-12 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">برندی یافت نشد</p>
          <button onClick={() => { setForm(empty); setEditingId(null); setShowForm(true); }} className="btn btn-primary btn-sm">افزودن اولین برند</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((b) => (
            <div key={b.id} className={`card p-5 hover:shadow-lg transition-all ${!b.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-3 overflow-hidden">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain" />
                  ) : (
                    <Tag className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <p className="font-700 text-gray-800">{b.name}</p>
                <p className="text-xs text-gray-400" dir="ltr">{b.slug}</p>
                <span className={`badge mt-2 ${b.is_active ? 'badge-success' : 'badge-gray'}`}>{b.is_active ? 'فعال' : 'غیرفعال'}</span>
                {b.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{b.description}</p>}
              </div>
              <div className="flex gap-1 mt-4 justify-center">
                <button onClick={() => handleEdit(b)} className="btn btn-ghost btn-sm" title="ویرایش">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => toggleStatus(b.id, b.is_active)} className="btn btn-ghost btn-sm" title={b.is_active ? 'غیرفعال کردن' : 'فعال کردن'}>
                  {b.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
                <button onClick={() => setDeleteConfirm(b.id)} className="btn btn-ghost btn-sm text-error-600" title="حذف">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination is handled server-side for brands, but showing load more buttons for now */}
    </AdminLayout>
  );
}

export function AdminCoupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const { loading, finishFetch } = useInitialLoading();
  const [showForm, setShowForm] = useState(false);
  const empty = { code: '', discount_type: 'percent' as 'percent' | 'fixed', discount_value: '', max_uses: '', valid_until: '', is_active: true };
  const [form, setForm] = useState(empty);

  const load = useCallback(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
        if (error) toast(error.message, 'error');
        else setCoupons((data ?? []) as Coupon[]);
      } finally { finishFetch(); }
    })();
  }, [toast, finishFetch]);
  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_until: form.valid_until || null,
        is_active: form.is_active,
      };
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) throw error;
      toast('کد تخفیف ایجاد شد', 'success');
      setShowForm(false); setForm(empty); load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف کد تخفیف؟')) return;
    try {
      await supabase.from('coupons').delete().eq('id', id);
      toast('حذف شد', 'success');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  return (
    <AdminLayout section="coupons" title="مدیریت کدهای تخفیف">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">{toPersianDigits(coupons.length)} کد</span>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">+ کد تخفیف جدید</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card p-6 mb-4 animate-slide-down">
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label">کد</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required dir="ltr" /></div>
            <div><label className="label">نوع تخفیف</label>
              <select className="input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percent' | 'fixed' })}>
                <option value="percent">درصدی</option>
                <option value="fixed">مبلغی</option>
              </select>
            </div>
            <div><label className="label">مقدار تخفیف</label><input type="number" className="input" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required /></div>
            <div><label className="label">حداکثر استفاده (اختیاری)</label><input type="number" className="input" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} /></div>
            <div><label className="label">تاریخ انقضا</label><input type="date" className="input" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm mt-4">ایجاد</button>
        </form>
      )}

      {loading ? <div className="card p-8 text-center text-gray-500">در حال بارگذاری...</div> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr>
              <th className="text-right p-3">کد</th><th className="text-right p-3">نوع</th><th className="text-right p-3">مقدار</th>
              <th className="text-right p-3">استفاده شده</th><th className="text-center p-3">عملیات</th>
            </tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="p-3 font-700" dir="ltr">{c.code}</td>
                  <td className="p-3">{c.discount_type === 'percent' ? 'درصدی' : 'مبلغی'}</td>
                  <td className="p-3">{c.discount_type === 'percent' ? `٪${toPersianDigits(c.discount_value)}` : formatPrice(c.discount_value)}</td>
                  <td className="p-3">{toPersianDigits(c.used_count)} / {c.max_uses ? toPersianDigits(c.max_uses) : '∞'}</td>
                  <td className="p-3 text-center"><button onClick={() => handleDelete(c.id)} className="btn btn-ghost btn-sm text-error-600">حذف</button></td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">کدی ثبت نشده است</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export function AdminInventory() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const { loading, finishFetch } = useInitialLoading();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('products').select('id, name, stock, low_stock_threshold, image_url').order('stock', { ascending: true });
        if (error) toast(error.message, 'error');
        else setProducts((data ?? []) as Product[]);
      } finally { finishFetch(); }
    })();
  }, [toast, finishFetch]);

  const updateStock = async (id: string, stock: number) => {
    try {
      const { error } = await supabase.from('products').update({ stock }).eq('id', id);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock } : p)));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'خطا', 'error');
    }
  };

  return (
    <AdminLayout section="inventory" title="مدیریت انبار">
      {loading ? <div className="card p-8 text-center text-gray-500">در حال بارگذاری...</div> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr>
              <th className="text-right p-3">محصول</th><th className="text-right p-3">موجودی فعلی</th><th className="text-right p-3">وضعیت</th><th className="text-center p-3">تغییر موجودی</th>
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img src={p.image_url || ''} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-600 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 font-700">{toPersianDigits(p.stock)}</td>
                  <td className="p-3">
                    <span className={`badge ${p.stock === 0 ? 'badge-error' : p.stock <= p.low_stock_threshold ? 'badge-warning' : 'badge-success'}`}>
                      {p.stock === 0 ? 'ناموجود' : p.stock <= p.low_stock_threshold ? 'در حال اتمام' : 'موجود'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => updateStock(p.id, Math.max(0, p.stock - 1))} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50">−</button>
                      <span className="w-12 text-center">{toPersianDigits(p.stock)}</span>
                      <button onClick={() => updateStock(p.id, p.stock + 1)} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50">+</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

// Stub for admin tickets page (uses existing ticket system filtered)
import { TicketsPage as UserTicketsPage } from './AccountPages';

export function AdminTicketsPage() {
  return <UserTicketsPage />;
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const { loading, finishFetch } = useInitialLoading();
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, products(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews((data ?? []) as Review[]);
    } catch {
      toast('خطا در بارگذاری نظرات', 'error');
    } finally {
      finishFetch();
    }
  }, [toast, finishFetch]);

  useEffect(() => { load(); }, [load]);

  const toggleApprove = async (id: string, approve: boolean) => {
    const { error } = await supabase.from('product_reviews').update({ is_approved: approve }).eq('id', id);
    if (error) { toast('خطا', 'error'); return; }
    toast(approve ? 'نظر تایید شد' : 'نظر رد شد', 'success');
    load();
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('حذف این نظر؟')) return;
    const { error } = await supabase.from('product_reviews').delete().eq('id', id);
    if (error) { toast('خطا', 'error'); return; }
    toast('حذف شد', 'success');
    load();
  };

  return (
    <AdminLayout section="reviews" title="مدیریت نظرات">
      {loading ? (
        <div className="py-12 text-center text-gray-500">در حال بارگذاری...</div>
      ) : reviews.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">نظری ثبت نشده است</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge bg-amber-50 text-amber-600">{toPersianDigits(r.rating)} ★</span>
                    {r.title && <span className="font-600">{r.title}</span>}
                    {r.is_approved ? (
                      <span className="badge badge-success">تایید شده</span>
                    ) : (
                      <span className="badge badge-warning">در انتظار</span>
                    )}
                  </div>
                  {r.body && <p className="text-sm text-gray-600 mb-2">{r.body}</p>}
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fa-IR')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!r.is_approved && (
                    <button onClick={() => toggleApprove(r.id, true)} className="btn btn-success btn-sm">تایید</button>
                  )}
                  {r.is_approved && (
                    <button onClick={() => toggleApprove(r.id, false)} className="btn btn-secondary btn-sm">رد</button>
                  )}
                  <button onClick={() => deleteReview(r.id)} className="btn btn-danger btn-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export function AdminReports() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    completed: 0,
    pending: 0,
    lowStock: 0,
  });
  const [topProducts, setTopProducts] = useState<{ name: string; sold: number; revenue: number }[]>([]);
  const { loading, finishFetch } = useInitialLoading();

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('total_amount, status'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('name, stock, low_stock_threshold, price').lt('stock', 10),
      supabase.from('order_items').select('product_name, quantity, price'),
    ]).then(([orders, productsCount, usersCount, lowStockData, orderItems]) => {
      const totalRevenue = (orders.data ?? []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const completed = (orders.data ?? []).filter((o) => o.status === 'delivered').length;
      const pending = (orders.data ?? []).filter((o) => o.status === 'pending').length;

      setStats({
        totalRevenue,
        totalOrders: orders.data?.length ?? 0,
        totalProducts: productsCount.count ?? 0,
        totalUsers: usersCount.count ?? 0,
        completed,
        pending,
        lowStock: (lowStockData.data as unknown[] | null)?.length ?? 0,
      });

      const productMap = new Map<string, { sold: number; revenue: number }>();
      (orderItems.data ?? []).forEach((item) => {
        const existing = productMap.get(item.product_name) || { sold: 0, revenue: 0 };
        existing.sold += item.quantity;
        existing.revenue += item.quantity * item.price;
        productMap.set(item.product_name, { ...existing });
      });
      const top = Array.from(productMap.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);
      setTopProducts(top);
    }).catch(() => {}).finally(finishFetch);
  }, [finishFetch]);

  if (loading) return <AdminLayout section="reports" title="گزارش‌ها"><div className="py-12 text-center text-gray-500">در حال بارگذاری...</div></AdminLayout>;

  const exportCSV = () => {
    const headers = ['نام محصول', 'تعداد فروش', 'درآمد (تومان)'];
    const rows = topProducts.map((p) => [p.name, p.sold, p.revenue]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout section="reports" title="گزارش فروش">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="درآمد کل" value={`${toPersianDigits(stats.totalRevenue.toLocaleString('en-US'))} ت`} icon={<BarChart3 className="w-5 h-5" />} color="primary" />
        <StatCard label="سفارشات" value={toPersianDigits(stats.totalOrders)} icon={<Package className="w-5 h-5" />} color="accent" />
        <StatCard label="کاربران" value={toPersianDigits(stats.totalUsers)} icon={<Users className="w-5 h-5" />} color="success" />
        <StatCard label="کمبود موجودی" value={toPersianDigits(stats.lowStock)} icon={<AlertTriangle className="w-5 h-5" />} color="error" />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-700">محصولات پرفروش</h3>
          <button onClick={exportCSV} className="btn btn-secondary btn-sm">
            <Download className="w-4 h-4" /> خروجی اکسل
          </button>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-center text-gray-400 py-4">داده‌ای موجود نیست</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="text-right py-2 font-500">نام محصول</th>
                <th className="text-right py-2 font-500">تعداد فروش</th>
                <th className="text-right py-2 font-500">درآمد</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 text-sm font-600">{p.name}</td>
                  <td className="py-3 text-sm text-gray-600">{toPersianDigits(p.sold)}</td>
                  <td className="py-3 text-sm text-gray-600">{toPersianDigits(p.revenue.toLocaleString('en-US'))} تومان</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export function AdminFaqs() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const { loading, finishFetch } = useInitialLoading();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('faqs').select('*').order('sort_order');
      if (error) throw error;
      setFaqs((data ?? []) as Faq[]);
    } catch {
      toast('خطا', 'error');
    } finally {
      finishFetch();
    }
  }, [toast, finishFetch]);

  useEffect(() => { load(); }, [load]);

  const deleteFaq = async (id: string) => {
    if (!window.confirm('حذف؟')) return;
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) { toast('خطا', 'error'); return; }
    toast('حذف شد', 'success');
    load();
  };

  return (
    <AdminLayout section="faqs" title="سوالات متداول">
      <div className="flex justify-end mb-4">
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> سوال جدید
        </button>
      </div>
      {loading ? (
        <div className="py-12 text-center text-gray-500">در حال بارگذاری...</div>
      ) : faqs.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">سوالی ثبت نشده است</div>
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.id} className="card p-5 flex items-start justify-between">
              <div className="flex-1">
                <span className="badge badge-primary mb-2">{f.category}</span>
                <h4 className="font-600 mb-1">{f.question}</h4>
                <p className="text-sm text-gray-600">{f.answer}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => { setEditing(f); setShowForm(true); }} className="btn btn-ghost btn-sm"><Edit className="w-4 h-4" /></button>
                <button onClick={() => deleteFaq(f.id)} className="btn btn-ghost btn-sm text-error-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <FaqForm
          faq={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
    </AdminLayout>
  );
}

function FaqForm({ faq, onClose, onSaved }: { faq: Faq | null; onClose: () => void; onSaved: () => void }) {
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer] = useState(faq?.answer ?? '');
  const [category, setCategory] = useState(faq?.category ?? 'عمومی');
  const [sortOrder, setSortOrder] = useState(faq?.sort_order ?? 0);
  const { toast } = useToast();

  const save = async () => {
    try {
      if (faq) {
        const { error } = await supabase.from('faqs').update({ question, answer, category, sort_order: sortOrder }).eq('id', faq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('faqs').insert({ question, answer, category, sort_order: sortOrder });
        if (error) throw error;
      }
      toast('ذخیره شد', 'success');
      onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'خطا', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-700 mb-4">{faq ? 'ویرایش سوال' : 'سوال جدید'}</h3>
        <div className="space-y-3">
          <div>
            <label className="label">سوال</label>
            <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} />
          </div>
          <div>
            <label className="label">پاسخ</label>
            <textarea className="input min-h-[100px]" value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">دسته</label>
              <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <label className="label">ترتیب</label>
              <input type="number" className="input" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={save} className="btn btn-primary flex-1">ذخیره</button>
          <button onClick={onClose} className="btn btn-secondary">انصراف</button>
        </div>
      </div>
    </div>
  );
}

export function AdminFlashSales() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const { loading, finishFetch } = useInitialLoading();
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('flash_sales').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setSales((data ?? []) as FlashSale[]);
    } catch {
      toast('خطا', 'error');
    } finally {
      finishFetch();
    }
  }, [toast, finishFetch]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from('flash_sales').update({ is_active: !active }).eq('id', id);
    if (error) { toast('خطا', 'error'); return; }
    load();
  };

  return (
    <AdminLayout section="flash-sales" title="حراج‌های ویژه (Flash Sale)">
      {loading ? (
        <div className="py-12 text-center text-gray-500">در حال بارگذاری...</div>
      ) : sales.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">حراج فعالی وجود ندارد</div>
      ) : (
        <div className="space-y-3">
          {sales.map((s) => (
            <div key={s.id} className="card p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-600">{s.title}</h4>
                  {s.is_active ? (
                    <span className="badge badge-success">فعال</span>
                  ) : (
                    <span className="badge badge-warning">غیرفعال</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  شروع: {new Date(s.starts_at).toLocaleDateString('fa-IR')} -
                  پایان: {new Date(s.ends_at).toLocaleDateString('fa-IR')}
                </p>
              </div>
              <button onClick={() => toggleActive(s.id, s.is_active)} className="btn btn-secondary btn-sm">
                {s.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

// ============ Admin Settings ============

export function AdminSettings() {
  const { toast } = useToast();
  const { refresh: refreshSettings } = useSettings();
  const { loading, finishFetch } = useInitialLoading();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'site' | 'hero' | 'about' | 'payment' | 'shipping' | 'appearance' | 'social' | 'notifications'>('site');
  const [settings, setSettings] = useState<any>({});
  const [uploadingHero, setUploadingHero] = useState(false);
  const heroBgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch((e: any) => toast(e.message, 'error'))
      .finally(finishFetch);
  }, [finishFetch]);

  const updateSettings = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: { ...prev?.[key], ...value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const keys = Object.keys(settings);
      await Promise.all(keys.map((k) => api.saveSetting(k, settings[k])));
      await refreshSettings();
      toast('تنظیمات با موفقیت ذخیره شد', 'success');
    } catch (e: any) {
      toast(e.message || 'خطا در ذخیره تنظیمات', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout section="settings" title="تنظیمات سایت">
        <div className="py-12 text-center text-gray-500">در حال بارگذاری...</div>
      </AdminLayout>
    );
  }

  const tabs = [
    { key: 'site', label: 'اطلاعات سایت', icon: LayoutDashboard },
    { key: 'hero', label: 'بنر اصلی', icon: Sparkles },
    { key: 'about', label: 'درباره ما', icon: ShieldCheck },
    { key: 'payment', label: 'درگاه پرداخت', icon: CreditCard },
    { key: 'shipping', label: 'ارسال و پست', icon: Package },
    { key: 'appearance', label: 'ظاهر سایت', icon: Settings },
    { key: 'social', label: 'شبکه‌های اجتماعی', icon: Users },
    { key: 'notifications', label: 'اعلان‌ها', icon: ShieldCheck },
  ] as const;

  const site = settings.site_info || {};
  const payment = settings.payment || {};
  const shipping = settings.shipping || {};
  const appearance = settings.appearance || {};
  const social = settings.social_links || {};
  const notifications = settings.notifications || {};

  return (
    <AdminLayout section="settings" title="تنظیمات سایت">
      <div className="flex flex-col sm:flex-row gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-500 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'site' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-700 mb-4">اطلاعات کلی سایت</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="نام سایت">
              <input className="input" value={site.site_name || ''} onChange={(e) => updateSettings('site_info', { site_name: e.target.value })} />
            </Field>
            <Field label="آدرس وب‌سایت">
              <input className="input" value={site.site_url || ''} onChange={(e) => updateSettings('site_info', { site_url: e.target.value })} />
            </Field>
            <Field label="ایمیل پشتیبانی">
              <input className="input" value={site.site_email || ''} onChange={(e) => updateSettings('site_info', { site_email: e.target.value })} />
            </Field>
            <Field label="شماره تماس">
              <input className="input" value={site.site_phone || ''} onChange={(e) => updateSettings('site_info', { site_phone: e.target.value })} />
            </Field>
            <Field label="شعار سایت">
              <input className="input" value={site.site_tagline || ''} onChange={(e) => updateSettings('site_info', { site_tagline: e.target.value })} />
            </Field>
            <Field label="آدرس">
              <input className="input" value={site.site_address || ''} onChange={(e) => updateSettings('site_info', { site_address: e.target.value })} />
            </Field>
          </div>
          <Field label="توضیحات متا (SEO)">
            <textarea className="input min-h-[80px]" value={site.site_description || ''} onChange={(e) => updateSettings('site_info', { site_description: e.target.value })} />
          </Field>
        </div>
      )}

      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-700 mb-4">بنر اصلی صفحه اصلی</h3>
            <Field label="عنوان اصلی">
              <input className="input" value={appearance.hero_title || ''} onChange={(e) => updateSettings('appearance', { hero_title: e.target.value })} placeholder="جدیدترین لوازم دیجیتال با بهترین قیمت" />
            </Field>
            <Field label="زیرعنوان">
              <textarea className="input min-h-[80px]" value={appearance.hero_subtitle || ''} onChange={(e) => updateSettings('appearance', { hero_subtitle: e.target.value })} placeholder="از موبایل و لپ‌تاپ تا کنسول بازی و لوازم خانگی..." />
            </Field>
            <Field label="متن دکمه اول">
              <input className="input" value={appearance.hero_button1_text || ''} onChange={(e) => updateSettings('appearance', { hero_button1_text: e.target.value })} placeholder="مشاهده فروشگاه" />
            </Field>
            <Field label="متن دکمه دوم">
              <input className="input" value={appearance.hero_button2_text || ''} onChange={(e) => updateSettings('appearance', { hero_button2_text: e.target.value })} placeholder="پرفروش‌ترین‌ها" />
            </Field>
            <Field label="تصویر پس‌زمینه بنر اصلی">
              <div className="flex items-start gap-4">
                <div className="relative w-40 h-24 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                  {appearance.hero_background_image ? (
                    <>
                      <img src={appearance.hero_background_image} alt="پس‌زمینه بنر" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => updateSettings('appearance', { hero_background_image: '' })} className="absolute top-1 left-1 w-6 h-6 rounded-full bg-error-500 text-white flex items-center justify-center">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input ref={heroBgInputRef} type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) { toast('فقط فایل تصویر مجاز است', 'error'); return; }
                    if (file.size > 5 * 1024 * 1024) { toast('حجم فایل نباید بیشتر از ۵ مگابایت باشد', 'error'); return; }
                    setUploadingHero(true);
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `hero-bg-${Date.now()}.${fileExt}`;
                      const filePath = `banners/${fileName}`;
                      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file, { cacheControl: '3600', upsert: true });
                      if (uploadError) { toast('خطا در آپلود تصویر', 'error'); return; }
                      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
                      updateSettings('appearance', { hero_background_image: publicUrl });
                      toast('تصویر آپلود شد', 'success');
                    } catch {
                      toast('خطا در آپلود تصویر', 'error');
                    } finally {
                      setUploadingHero(false);
                      if (heroBgInputRef.current) heroBgInputRef.current.value = '';
                    }
                  }} className="hidden" id="hero-bg-upload" />
                  <label htmlFor="hero-bg-upload" className={`btn btn-secondary cursor-pointer ${uploadingHero ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingHero ? 'در حال آپلود...' : <><Upload className="w-4 h-4" /> آپلود تصویر</>}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG, WebP | حداکثر ۵ مگابایت</p>
                  <input className="input mt-3 text-xs" value={appearance.hero_background_image || ''} onChange={(e) => updateSettings('appearance', { hero_background_image: e.target.value })} placeholder="یا لینک تصویر را وارد کنید" dir="ltr" />
                </div>
              </div>
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-700 mb-4">بنر تبلیغاتی</h3>
            <Field label="عنوان بنر تبلیغاتی">
              <input className="input" value={appearance.banner_title || ''} onChange={(e) => updateSettings('appearance', { banner_title: e.target.value })} placeholder="جشنواره فروش ویژه" />
            </Field>
            <Field label="متن بنر">
              <input className="input" value={appearance.banner_subtitle || ''} onChange={(e) => updateSettings('appearance', { banner_subtitle: e.target.value })} placeholder="تا ۳۰٪ تخفیف روی محصولات منتخب" />
            </Field>
            <Field label="کد تخفیف">
              <input className="input" value={appearance.banner_code || ''} onChange={(e) => updateSettings('appearance', { banner_code: e.target.value })} placeholder="WELCOME10" dir="ltr" />
            </Field>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-700 mb-4">صفحه درباره ما</h3>
          <div className="space-y-4">
            <Field label="عنوان بخش تاریخچه">
              <input className="input" value={settings.about?.history_title || ''} onChange={(e) => updateSettings('about', { history_title: e.target.value })} placeholder="داستان ماموت شاپ" />
            </Field>
            <Field label="متن تاریخچه">
              <textarea className="input min-h-[120px]" value={settings.about?.history_text || ''} onChange={(e) => updateSettings('about', { history_text: e.target.value })} placeholder="از یک ایده کوچک در سال ۱۳۹۲ تا بزرگ‌ترین فروشگاه آنلاین..." />
            </Field>
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-600 mb-3">آمار و ارقام</h4>
              <div className="grid sm:grid-cols-4 gap-4">
                <Field label="تعداد مشتریان">
                  <input className="input" value={settings.about?.stat_customers || ''} onChange={(e) => updateSettings('about', { stat_customers: e.target.value })} placeholder="+۵۰۰٬۰۰۰" />
                </Field>
                <Field label="تعداد محصولات">
                  <input className="input" value={settings.about?.stat_products || ''} onChange={(e) => updateSettings('about', { stat_products: e.target.value })} placeholder="+۵۰۰۰" />
                </Field>
                <Field label="سال‌های تجربه">
                  <input className="input" value={settings.about?.stat_experience || ''} onChange={(e) => updateSettings('about', { stat_experience: e.target.value })} placeholder="۱۰+ سال" />
                </Field>
                <Field label="درصد رضایت">
                  <input className="input" value={settings.about?.stat_satisfaction || ''} onChange={(e) => updateSettings('about', { stat_satisfaction: e.target.value })} placeholder="٪۹۸" />
                </Field>
              </div>
            </div>
            <Field label="عنوان بخش تعهد">
              <input className="input" value={settings.about?.commitment_title || ''} onChange={(e) => updateSettings('about', { commitment_title: e.target.value })} placeholder="تعهد ما به شما" />
            </Field>
            <Field label="متن تعهد">
              <textarea className="input min-h-[80px]" value={settings.about?.commitment_text || ''} onChange={(e) => updateSettings('about', { commitment_text: e.target.value })} placeholder="ما متعهد به ارائه محصولاتی با بالاترین کیفیت..." />
            </Field>
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-700 mb-4">تنظیمات درگاه پرداخت</h3>
            <Field label="درگاه پرداخت فعال">
              <select className="input" value={payment.gateway || 'zarinpal'} onChange={(e) => updateSettings('payment', { gateway: e.target.value })}>
                <option value="zarinpal">زرین‌پال (Zarinpal)</option>
                <option value="asanpardakht">آسان‌پرداخت</option>
                <option value="payir">پی‌آی‌آر (Pay.ir)</option>
                <option value="nextpay">نکست‌پی (NextPay)</option>
              </select>
            </Field>
            <Field label="مرچنت کد (Merchant ID)">
              <input className="input" placeholder="00000000-0000-0000-0000-000000000000" value={payment.merchant_id || ''} onChange={(e) => updateSettings('payment', { merchant_id: e.target.value })} />
              <p className="text-xs text-gray-500 mt-1">کد پذیرنده‌ی درگاه پرداخت. برای زرین‌پال، این یک UUID است.</p>
            </Field>
            <Field label="آدرس کال‌بک (Callback URL)">
              <input className="input" placeholder="خودی پر می‌شود" value={payment.callback_url || ''} onChange={(e) => updateSettings('payment', { callback_url: e.target.value })} />
              <p className="text-xs text-gray-500 mt-1">اگر خالی باشد، به‌صورت خودکار تنظیم می‌شود.</p>
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={payment.sandbox ?? true} onChange={(e) => updateSettings('payment', { sandbox: e.target.checked })} />
              <span className="text-sm font-500">حالت تستی (Sandbox / تست زرین‌پال)</span>
              <span className="text-xs text-gray-500">— در حالت تستی، پرداخت واقعی انجام نمی‌شود</span>
            </label>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-700 mb-4">تراکنش‌های اخیر</h3>
            <AdminPaymentTransactions />
          </div>
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-700 mb-4">تنظیمات ارسال و پست</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="هزینه ارسال (تومان)">
              <input type="number" className="input" value={shipping.shipping_cost || 0} onChange={(e) => updateSettings('shipping', { shipping_cost: Number(e.target.value) })} />
              <p className="text-xs text-gray-500 mt-1">هزینه ارسال برای سفارش‌های زیر آستانه ارسال رایگان</p>
            </Field>
            <Field label="آستانه ارسال رایگان (تومان)">
              <input type="number" className="input" value={shipping.free_shipping_threshold || 0} onChange={(e) => updateSettings('shipping', { free_shipping_threshold: Number(e.target.value) })} />
              <p className="text-xs text-gray-500 mt-1">سفارش‌های بالای این مبلغ، ارسال رایگان دارند</p>
            </Field>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-700 mb-4">بنر اصلی</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="عنوان بنر اصلی">
                <input className="input" value={appearance.hero_title || ''} onChange={(e) => updateSettings('appearance', { hero_title: e.target.value })} />
              </Field>
              <Field label="زیرعنوان بنر اصلی">
                <input className="input" value={appearance.hero_subtitle || ''} onChange={(e) => updateSettings('appearance', { hero_subtitle: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-700 mb-4">بخش‌های صفحه اصلی</h3>
            <p className="text-sm text-gray-500 -mt-2">با فعال یا غیرفعال کردن هر بخش، نمایش یا عدم نمایش آن در صفحه اصلی را کنترل کنید.</p>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={appearance.show_bestsellers ?? true} onChange={(e) => updateSettings('appearance', { show_bestsellers: e.target.checked })} />
                <span className="text-sm">نمایش بخش پرفروش‌ترین‌ها در صفحه اصلی</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={appearance.show_flash_sale ?? true} onChange={(e) => updateSettings('appearance', { show_flash_sale: e.target.checked })} />
                <span className="text-sm">نمایش بخش حراج ویژه در صفحه اصلی</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={appearance.show_discounted ?? true} onChange={(e) => updateSettings('appearance', { show_discounted: e.target.checked })} />
                <span className="text-sm">نمایش بخش تخفیف‌خورده‌ها در صفحه اصلی</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={appearance.show_new_products ?? true} onChange={(e) => updateSettings('appearance', { show_new_products: e.target.checked })} />
                <span className="text-sm">نمایش بخش جدیدترین محصولات در صفحه اصلی</span>
              </label>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-700 mb-4">تنظیمات بخش جدیدترین محصولات</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="عنوان بخش">
                <input className="input" value={appearance.new_products_title || ''} onChange={(e) => updateSettings('appearance', { new_products_title: e.target.value })} placeholder="جدیدترین محصولات" />
              </Field>
              <Field label="زیرعنوان بخش">
                <input className="input" value={appearance.new_products_subtitle || ''} onChange={(e) => updateSettings('appearance', { new_products_subtitle: e.target.value })} placeholder="تازه‌ترین محصولات وارد شده را از دست نده" />
              </Field>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'social' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-700 mb-4">شبکه‌های اجتماعی</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="اینستاگرام">
              <input className="input" placeholder="https://instagram.com/..." value={social.instagram || ''} onChange={(e) => updateSettings('social_links', { instagram: e.target.value })} />
            </Field>
            <Field label="تلگرام">
              <input className="input" placeholder="https://t.me/..." value={social.telegram || ''} onChange={(e) => updateSettings('social_links', { telegram: e.target.value })} />
            </Field>
            <Field label="واتساپ">
              <input className="input" placeholder="https://wa.me/..." value={social.whatsapp || ''} onChange={(e) => updateSettings('social_links', { whatsapp: e.target.value })} />
            </Field>
            <Field label="توییتر / ایکس">
              <input className="input" placeholder="https://twitter.com/..." value={social.twitter || ''} onChange={(e) => updateSettings('social_links', { twitter: e.target.value })} />
            </Field>
            <Field label="فیسبوک">
              <input className="input" placeholder="https://facebook.com/..." value={social.facebook || ''} onChange={(e) => updateSettings('social_links', { facebook: e.target.value })} />
            </Field>
            <Field label="یوتیوب">
              <input className="input" placeholder="https://youtube.com/..." value={social.youtube || ''} onChange={(e) => updateSettings('social_links', { youtube: e.target.value })} />
            </Field>
            <Field label="لینکدین">
              <input className="input" placeholder="https://linkedin.com/..." value={social.linkedin || ''} onChange={(e) => updateSettings('social_links', { linkedin: e.target.value })} />
            </Field>
            <Field label="آپارات">
              <input className="input" placeholder="https://aparat.com/..." value={social.aparat || ''} onChange={(e) => updateSettings('social_links', { aparat: e.target.value })} />
            </Field>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-700 mb-4">اعلان‌ها و نوتیفیکیشن‌ها</h3>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={notifications.order_notifications ?? true} onChange={(e) => updateSettings('notifications', { order_notifications: e.target.checked })} />
              <span className="text-sm">اعلان سفارش جدید برای ادمین</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={notifications.stock_alerts ?? true} onChange={(e) => updateSettings('notifications', { stock_alerts: e.target.checked })} />
              <span className="text-sm">هشدار اتمام موجودی</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={notifications.review_moderation ?? true} onChange={(e) => updateSettings('notifications', { review_moderation: e.target.checked })} />
              <span className="text-sm">نیاز به تایید نظرات</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={notifications.sms_notifications ?? false} onChange={(e) => updateSettings('notifications', { sms_notifications: e.target.checked })}
              />
              <span className="text-sm">ارسال پیامک برای سفارش‌ها</span>
            </label>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </button>
      </div>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-500 text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function AdminPaymentTransactions() {
  const [txs, setTxs] = useState<any[]>([]);
  const { loading, finishFetch } = useInitialLoading();

  useEffect(() => {
    api.getPaymentTransactions()
      .then(setTxs)
      .catch(() => {})
      .finally(finishFetch);
  }, [finishFetch]);

  if (loading) return <p className="text-sm text-gray-500">در حال بارگذاری...</p>;
  if (txs.length === 0) return <p className="text-sm text-gray-500">هنوز تراکنشی ثبت نشده است.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-right text-gray-500 border-b border-gray-100">
            <th className="pb-2 pt-1">مبلغ</th>
            <th className="pb-2 pt-1">وضعیت</th>
            <th className="pb-2 pt-1">کد پیگیری</th>
            <th className="pb-2 pt-1">تاریخ</th>
          </tr>
        </thead>
        <tbody>
          {txs.slice(0, 10).map((tx) => (
            <tr key={tx.id} className="border-b border-gray-50">
              <td className="py-2 font-600">{toPersianDigits(tx.amount.toLocaleString('en-US'))} تومان</td>
              <td className="py-2">
                <span className={`badge ${tx.status === 'success' ? 'badge-success' : tx.status === 'pending' || tx.status === 'redirected' ? 'badge-warning' : 'badge-error'}`}>
                  {tx.status === 'success' ? 'موفق' : tx.status === 'pending' ? 'در انتظار' : tx.status === 'redirected' ? 'ارسال به درگاه' : 'ناموفق'}
                </span>
              </td>
              <td className="py-2 text-gray-600">{tx.ref_id ? toPersianDigits(tx.ref_id) : '—'}</td>
              <td className="py-2 text-gray-500 text-xs">{toPersianDigits(new Date(tx.created_at).toLocaleDateString('fa-IR'))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { Layout };

// ============ Admin SEO ============

export function AdminSeo() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboard' | 'products' | 'bulk-ai' | 'categories' | 'brands' | 'redirects'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [redirects, setRedirects] = useState<{ id: string; from_path: string; to_path: string; redirect_type: number; is_active: boolean }[]>([]);
  const { loading, finishFetch } = useInitialLoading();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, categoriesRes, brandsRes, redirectsRes] = await Promise.all([
          supabase.from('products').select('id, name, slug, seo_title, seo_description, seo_keywords, focus_keyword, meta_robots').order('created_at', { ascending: false }),
          supabase.from('categories').select('id, name, slug, seo_title, seo_description, seo_keywords, focus_keyword, meta_robots').order('created_at', { ascending: false }),
          supabase.from('brands').select('id, name, slug, seo_title, seo_description, seo_keywords, focus_keyword, meta_robots').order('created_at', { ascending: false }),
          supabase.from('seo_redirects').select('*').order('created_at', { ascending: false }),
        ]);
        setProducts((productsRes.data as Product[]) || []);
        setCategories((categoriesRes.data as Category[]) || []);
        setBrands((brandsRes.data as Brand[]) || []);
        setRedirects(redirectsRes.data || []);
      } catch {
        toast('خطا در بارگذاری داده‌ها', 'error');
      } finally {
        finishFetch();
      }
    };
    loadData();
  }, [toast, finishFetch]);

  const stats = {
    totalProducts: products.length,
    productsWithSeo: products.filter(p => p.seo_title && p.seo_description).length,
    productsMissingSeo: products.filter(p => !p.seo_title || !p.seo_description).length,
    noIndexCount: products.filter(p => p.meta_robots?.includes('noindex')).length,
  };

  return (
    <AdminLayout section="settings" title="مدیریت سئو">
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {[
          { key: 'overview', label: 'نمای کلی' },
          { key: 'dashboard', label: 'داشبورد سئو' },
          { key: 'products', label: 'محصولات' },
          { key: 'bulk-ai', label: 'سئو گروهی با AI' },
          { key: 'categories', label: 'دسته‌بندی‌ها' },
          { key: 'brands', label: 'برندها' },
          { key: 'redirects', label: 'تغییر مسیرها' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-3 text-sm font-500 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">در حال بارگذاری...</div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="card p-4">
                  <p className="text-sm text-gray-500">کل محصولات</p>
                  <p className="text-2xl font-800 mt-1">{toPersianDigits(stats.totalProducts)}</p>
                </div>
                <div className="card p-4 bg-success-50">
                  <p className="text-sm text-success-600">با سئو کامل</p>
                  <p className="text-2xl font-800 mt-1 text-success-700">{toPersianDigits(stats.productsWithSeo)}</p>
                </div>
                <div className="card p-4 bg-warning-50">
                  <p className="text-sm text-warning-600">نیاز به بهینه‌سازی</p>
                  <p className="text-2xl font-800 mt-1 text-warning-700">{toPersianDigits(stats.productsMissingSeo)}</p>
                </div>
                <div className="card p-4 bg-gray-50">
                  <p className="text-sm text-gray-500">بدون ایندکس</p>
                  <p className="text-2xl font-800 mt-1">{toPersianDigits(stats.noIndexCount)}</p>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-700 mb-4">محصولات نیاز به بهینه‌سازی</h3>
                {products.filter(p => !p.seo_title || !p.seo_description).length === 0 ? (
                  <p className="text-center text-gray-500 py-4">همه محصولات سئو کامل دارند</p>
                ) : (
                  <div className="space-y-2">
                    {products.filter(p => !p.seo_title || !p.seo_description).slice(0, 10).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-600">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.slug}</p>
                        </div>
                        <div className="flex gap-2">
                          {!p.seo_title && <span className="px-2 py-1 rounded text-xs bg-error-100 text-error-700">بدون عنوان</span>}
                          {!p.seo_description && <span className="px-2 py-1 rounded text-xs bg-warning-100 text-warning-700">بدون توضیحات</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <SeoDashboard />
          )}

          {activeTab === 'bulk-ai' && (
            <BulkAiSeo products={products} onComplete={() => {}} />
          )}

          {activeTab === 'products' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-right p-3">محصول</th>
                    <th className="text-right p-3">عنوان سئو</th>
                    <th className="text-right p-3">توضیحات</th>
                    <th className="text-right p-3">کلمات کلیدی</th>
                    <th className="text-right p-3">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="p-3">
                        <p className="font-600">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.slug}</p>
                      </td>
                      <td className="p-3">
                        <span className={p.seo_title ? 'text-success-600' : 'text-gray-400'}>
                          {p.seo_title ? `${p.seo_title.substring(0, 40)}...` : '—'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={p.seo_description ? 'text-success-600' : 'text-gray-400'}>
                          {p.seo_description ? `${p.seo_description.substring(0, 50)}...` : '—'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{p.seo_keywords || '—'}</td>
                      <td className="p-3">
                        <span className={`badge ${p.meta_robots?.includes('noindex') ? 'badge-error' : 'badge-success'}`}>
                          {p.meta_robots?.includes('noindex') ? 'بدون ایندکس' : 'ایندکس'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-right p-3">دسته‌بندی</th>
                    <th className="text-right p-3">عنوان سئو</th>
                    <th className="text-right p-3">توضیحات</th>
                    <th className="text-right p-3">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100">
                      <td className="p-3 font-600">{c.name}</td>
                      <td className="p-3">{c.seo_title || '—'}</td>
                      <td className="p-3">{c.seo_description?.substring(0, 50) || '—'}</td>
                      <td className="p-3">
                        <span className={`badge ${c.meta_robots?.includes('noindex') ? 'badge-error' : 'badge-success'}`}>
                          {c.meta_robots?.includes('noindex') ? 'بدون ایندکس' : 'ایندکس'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'brands' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-right p-3">برند</th>
                    <th className="text-right p-3">عنوان سئو</th>
                    <th className="text-right p-3">توضیحات</th>
                    <th className="text-right p-3">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b.id} className="border-t border-gray-100">
                      <td className="p-3 font-600">{b.name}</td>
                      <td className="p-3">{b.seo_title || '—'}</td>
                      <td className="p-3">{b.seo_description?.substring(0, 50) || '—'}</td>
                      <td className="p-3">
                        <span className={`badge ${b.meta_robots?.includes('noindex') ? 'badge-error' : 'badge-success'}`}>
                          {b.meta_robots?.includes('noindex') ? 'بدون ایندکس' : 'ایندکس'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'redirects' && (
            <div className="space-y-4">
              <RedirectManager redirects={redirects} setRedirects={setRedirects} toast={toast} />
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

function RedirectManager({ redirects, setRedirects, toast }: {
  redirects: { id: string; from_path: string; to_path: string; redirect_type: number; is_active: boolean }[];
  setRedirects: (r: typeof redirects) => void;
  toast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [form, setForm] = useState({ from_path: '', to_path: '', redirect_type: 301 });

  const addRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from_path || !form.to_path) return;
    try {
      const { data, error } = await supabase.from('seo_redirects').insert({
        from_path: form.from_path,
        to_path: form.to_path,
        redirect_type: form.redirect_type,
        is_active: true,
      }).select().single();
      if (error) throw error;
      setRedirects([...redirects, data]);
      setForm({ from_path: '', to_path: '', redirect_type: 301 });
      toast('تغییر مسیر اضافه شد', 'success');
    } catch {
      toast('خطا در ذخیره', 'error');
    }
  };

  const deleteRedirect = async (id: string) => {
    await supabase.from('seo_redirects').delete().eq('id', id);
    setRedirects(redirects.filter(r => r.id !== id));
    toast('حذف شد', 'success');
  };

  return (
    <>
      <form onSubmit={addRedirect} className="card p-4">
        <h3 className="font-600 mb-3">افزودن تغییر مسیر</h3>
        <div className="flex gap-2 flex-wrap">
          <input className="input flex-1 min-w-[200px]" placeholder="مسیر قدیم (مثال: /old-page)" value={form.from_path} onChange={(e) => setForm({ ...form, from_path: e.target.value })} dir="ltr" />
          <input className="input flex-1 min-w-[200px]" placeholder="مسیر جدید" value={form.to_path} onChange={(e) => setForm({ ...form, to_path: e.target.value })} dir="ltr" />
          <select className="input w-auto" value={form.redirect_type} onChange={(e) => setForm({ ...form, redirect_type: Number(e.target.value) })}>
            <option value={301}>۳۰۱ (دائمی)</option>
            <option value={302}>۳۰۲ (موقت)</option>
          </select>
          <button type="submit" className="btn btn-primary">افزودن</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-right p-3">مسیر قدیم</th>
              <th className="text-right p-3">مسیر جدید</th>
              <th className="text-right p-3">نوع</th>
              <th className="text-center p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {redirects.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="p-3 font-mono text-xs" dir="ltr">{r.from_path}</td>
                <td className="p-3 font-mono text-xs" dir="ltr">{r.to_path}</td>
                <td className="p-3">
                  <span className={`badge ${r.redirect_type === 301 ? 'badge-success' : 'badge-warning'}`}>
                    {r.redirect_type}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => deleteRedirect(r.id)} className="btn btn-ghost btn-sm text-error-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {redirects.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">تغییر مسیری ثبت نشده</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ============ Admin Chat ============

export function AdminChat() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { loading, finishFetch } = useInitialLoading();
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'active' | 'closed'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadRooms = useCallback(async () => {
    try {
      let query = supabase
        .from('chat_rooms')
        .select('*, profiles(full_name)')
        .order('updated_at', { ascending: false });
      if (filter === 'active') query = query.eq('status', 'active');
      else if (filter === 'closed') query = query.eq('status', 'closed');
      const { data, error } = await query;
      if (error) throw error;
      let filtered = (data as ChatRoom[]) || [];
      if (search) {
        filtered = filtered.filter(r =>
          r.profiles?.full_name?.includes(search) || r.subject?.includes(search)
        );
      }
      setRooms(filtered);
    } catch {
      toast('خطا در بارگذاری چت‌ها', 'error');
    } finally {
      finishFetch();
    }
  }, [toast, filter, search, finishFetch]);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  const loadMessages = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setMessages((data as ChatMessage[]) || []);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
      // Mark messages as read
      supabase.from('chat_rooms').update({ unread_admin: 0 }).eq('id', selectedRoom.id);
      const interval = setInterval(() => loadMessages(selectedRoom.id), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom, loadMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedRoom) return;
    setSending(true);
    try {
      await supabase.from('chat_messages').insert({
        room_id: selectedRoom.id,
        message: newMessage.trim(),
        is_from_admin: true,
      });
      await supabase.from('chat_rooms').update({
        updated_at: new Date().toISOString(),
        last_message: newMessage.trim(),
        last_message_at: new Date().toISOString()
      }).eq('id', selectedRoom.id);
      setNewMessage('');
      loadMessages(selectedRoom.id);
      loadRooms();
    } catch {
      toast('خطا در ارسال پیام', 'error');
    } finally {
      setSending(false);
    }
  };

  const closeRoom = async (roomId: string) => {
    await supabase.from('chat_rooms').update({ status: 'closed' }).eq('id', roomId);
    loadRooms();
    setSelectedRoom(null);
  };

  const reopenRoom = async (roomId: string) => {
    await supabase.from('chat_rooms').update({ status: 'active' }).eq('id', roomId);
    loadRooms();
  };

  const totalUnread = rooms.reduce((sum, r) => sum + (r.unread_admin || 0), 0);

  return (
    <AdminLayout section="chat" title="چت آنلاین با مشتریان">
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Rooms list */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pr-10"
                placeholder="جستجو..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {[
                { key: 'all', label: 'همه' },
                { key: 'unread', label: `خوانده نشده ${totalUnread > 0 ? `(${toPersianDigits(totalUnread)})` : ''}` },
                { key: 'active', label: 'فعال' },
                { key: 'closed', label: 'بسته' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as typeof filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-500 transition-colors ${
                    filter === f.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">در حال بارگذاری...</div>
            ) : rooms.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">گفتگویی یافت نشد</p>
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full p-3 text-right border-b border-gray-50 transition-colors ${
                    selectedRoom?.id === room.id ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${room.status === 'active' ? 'bg-success-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-sm font-600">{room.profiles?.full_name || 'کاربر'}</span>
                    </div>
                    {(room.unread_admin || 0) > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-error-500 text-white text-xs font-600 flex items-center justify-center">
                        {toPersianDigits(room.unread_admin)}
                      </span>
                    )}
                  </div>
                  {room.subject && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{room.subject}</p>}
                  {room.last_message && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{room.last_message}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(room.updated_at).toLocaleDateString('fa-IR')} - {new Date(room.updated_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          {selectedRoom ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-700">{selectedRoom.profiles?.full_name || 'کاربر'}</h4>
                    <span className={`text-xs ${selectedRoom.status === 'active' ? 'text-success-600' : 'text-gray-500'}`}>
                      {selectedRoom.status === 'active' ? 'فعال' : 'بسته شده'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedRoom.status === 'active' ? (
                    <button onClick={() => closeRoom(selectedRoom.id)} className="btn btn-ghost btn-sm text-error-600">
                      بستن گفتگو
                    </button>
                  ) : (
                    <button onClick={() => reopenRoom(selectedRoom.id)} className="btn btn-secondary btn-sm">
                      بازگشایی
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>پیامی وجود ندارد</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_from_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                        msg.is_from_admin
                          ? 'bg-primary-600 text-white rounded-tr-none'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                      }`}>
                        {msg.attachment_url && (
                          <div className="mb-2">
                            {msg.attachment_type?.startsWith('image') ? (
                              <img src={msg.attachment_url} alt={msg.attachment_name || ''} className="rounded-lg max-h-40" />
                            ) : (
                              <a href={msg.attachment_url} target="_blank" rel="noopener" className="text-xs underline">فایل پیوست</a>
                            )}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        <p className={`text-[10px] mt-1.5 ${msg.is_from_admin ? 'text-primary-200' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          {msg.is_from_admin && msg.read_at && <span className="mr-1">✓✓</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedRoom.status === 'active' && (
                <div className="p-3 border-t border-gray-100 bg-white">
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="پیام خود را بنویسید..."
                    />
                    <button onClick={handleSend} disabled={sending || !newMessage.trim()} className="btn btn-primary">
                      {sending ? '...' : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center">
                <Headphones className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-600 text-gray-400 mb-1">گفتگو انتخاب نشده</p>
                <p className="text-sm text-gray-400">یک گفتگو را از لیست انتخاب کنید</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

