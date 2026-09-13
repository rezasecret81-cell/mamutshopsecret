import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Seo } from '@/components/Seo';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import type { Brand, Category, Product } from '@/lib/types';
import { useRouter } from '@/lib/router-context';
import { useToast } from '@/components/Toast';
import { formatPrice, toPersianDigits } from '@/lib/format';
import { SlidersHorizontal, X, Search, Check, Frown } from 'lucide-react';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'bestseller';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'جدیدترین',
  'price-asc': 'ارزان‌ترین',
  'price-desc': 'گران‌ترین',
  rating: 'محبوب‌ترین',
  bestseller: 'پرفروش‌ترین',
};

const PAGE_SIZE = 12;

export function ShopPage() {
  const { navigate, query } = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const hasDataRef = useRef(false);

  const initialSearch = query.search || '';
  const initialSort = (query.sort as SortOption) || 'newest';
  const initialBrandSlug = query.brand || '';

  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Sync from URL query changes (e.g. when navigating from header search)
  useEffect(() => {
    setSearch(query.search || '');
    setSort((query.sort as SortOption) || 'newest');
  }, [query.search, query.sort]);

  // Preselect a brand from URL (?brand=slug)
  useEffect(() => {
    if (!initialBrandSlug) return;
    api.getBrands().then((brands) => {
      const found = brands.find((b) => b.slug === initialBrandSlug);
      if (found) setSelectedBrands([found.id]);
    });
  }, [initialBrandSlug]);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getBrands()]).then(([c, b]) => {
      setCategories(c);
      setBrands(b);
    });
  }, []);

  // Build filters whenever any filter changes
  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
    [search, sort, minPrice, maxPrice]
  );

  useEffect(() => {
    const isFirstLoad = !hasDataRef.current;
    if (isFirstLoad) setLoading(true);
    setPage(1);
    api
      .getProducts(queryParams)
      .then((data) => {
        setProducts(data);
        const uniqueColors = Array.from(new Set(data.map((p) => p.color).filter(Boolean))) as string[];
        setColors(uniqueColors);
        hasDataRef.current = true;
      })
      .catch((err) => {
        if (isFirstLoad) toast(err.message, 'error');
      })
      .finally(() => {
        if (isFirstLoad) setLoading(false);
      });
  }, [queryParams, toast]);

  // Apply category and brand filters client-side (multi-select)
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category_id ?? '')) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand_id ?? '')) return false;
      if (selectedColors.length > 0 && (!p.color || !selectedColors.includes(p.color))) return false;
      if (onlyInStock && p.stock === 0) return false;
      if (onlyDiscounted && !p.discount_price) return false;
      return true;
    });
  }, [products, selectedCategories, selectedBrands, onlyInStock, onlyDiscounted]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    setPage(1);
  };
  const toggleBrand = (id: string) => {
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setOnlyInStock(false);
    setOnlyDiscounted(false);
    navigate('/shop');
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedColors.length > 0 ||
    minPrice ||
    maxPrice ||
    search ||
    onlyInStock ||
    onlyDiscounted;

  return (
    <>
      <Seo title="فروشگاه" description="خرید آنلاین انواع محصولات دیجیتال با بهترین قیمت" canonicalPath="/shop" />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-700 text-gray-900 mb-3">فروشگاه</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = search.trim();
              navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
            }}
            className="relative max-w-2xl"
          >
            <input
              className="input pr-10"
              placeholder="جستجوی محصول..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-4">
              <FilterPanel
                categories={categories}
                brands={brands}
                colors={colors}
                selectedCategories={selectedCategories}
                selectedBrands={selectedBrands}
                selectedColors={selectedColors}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onlyInStock={onlyInStock}
                onlyDiscounted={onlyDiscounted}
                onToggleOnlyInStock={() => setOnlyInStock(!onlyInStock)}
                onToggleOnlyDiscounted={() => setOnlyDiscounted(!onlyDiscounted)}
                onToggleCategory={toggleCategory}
                onToggleBrand={toggleBrand}
                onToggleColor={(c) => setSelectedColors((prev) => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                onMinPrice={setMinPrice}
                onMaxPrice={setMaxPrice}
                onClear={clearFilters}
              />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterOpen(true)}
                  className="btn btn-secondary btn-sm lg:hidden"
                >
                  <SlidersHorizontal className="w-4 h-4" /> فیلترها
                </button>
                <span className="text-sm text-gray-500">
                  {loading ? 'در حال بارگذاری...' : `${toPersianDigits(filtered.length)} محصول یافت شد`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:inline">مرتب‌سازی:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as SortOption);
                    navigate(`/shop?sort=${e.target.value}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
                  }}
                  className="input py-1.5 text-sm w-auto"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
                    <option key={k} value={k}>{SORT_LABELS[k]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {search && (
                  <FilterChip label={`جستجو: ${search}`} onRemove={() => { setSearch(''); navigate('/shop'); }} />
                )}
                {selectedCategories.map((id) => {
                  const c = categories.find((x) => x.id === id);
                  return c ? <FilterChip key={id} label={c.name} onRemove={() => toggleCategory(id)} /> : null;
                })}
                {selectedBrands.map((id) => {
                  const b = brands.find((x) => x.id === id);
                  return b ? <FilterChip key={id} label={b.name} onRemove={() => toggleBrand(id)} /> : null;
                })}
                {(minPrice || maxPrice) && (
                  <FilterChip
                    label={`قیمت: ${minPrice ? formatPrice(Number(minPrice)) : '۰'} - ${maxPrice ? formatPrice(Number(maxPrice)) : 'نامحدود'}`}
                    onRemove={() => { setMinPrice(''); setMaxPrice(''); }}
                  />
                )}
                <button onClick={clearFilters} className="text-xs text-error-600 hover:underline">حذف همه</button>
              </div>
            )}

            {/* Products grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : paged.length === 0 ? (
              <div className="card p-12 text-center flex flex-col items-center gap-3">
                <Frown className="w-12 h-12 text-gray-300" />
                <h3 className="text-lg font-600">محصولی یافت نشد</h3>
                <p className="text-sm text-gray-500">فیلترها را تغییر دهید یا کلمه دیگری جستجو کنید</p>
                <button onClick={clearFilters} className="btn btn-primary mt-2">نمایش همه محصولات</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {paged.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-8">
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto animate-slide-down">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-700">فیلترها</h3>
              <button onClick={() => setFilterOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel
                categories={categories}
                brands={brands}
                colors={colors}
                selectedCategories={selectedCategories}
                selectedBrands={selectedBrands}
                selectedColors={selectedColors}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onlyInStock={onlyInStock}
                onlyDiscounted={onlyDiscounted}
                onToggleOnlyInStock={() => setOnlyInStock(!onlyInStock)}
                onToggleOnlyDiscounted={() => setOnlyDiscounted(!onlyDiscounted)}
                onToggleCategory={toggleCategory}
                onToggleBrand={toggleBrand}
                onToggleColor={(c) => setSelectedColors((prev) => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                onMinPrice={setMinPrice}
                onMaxPrice={setMaxPrice}
                onClear={clearFilters}
              />
              <button onClick={() => setFilterOpen(false)} className="btn btn-primary w-full mt-6">
                مشاهده {toPersianDigits(filtered.length)} محصول
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-xs font-500">
      {label}
      <button onClick={onRemove} className="hover:text-primary-900">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function FilterPanel({
  categories,
  brands,
  colors,
  selectedCategories,
  selectedBrands,
  selectedColors,
  minPrice,
  maxPrice,
  onlyInStock,
  onlyDiscounted,
  onToggleOnlyInStock,
  onToggleOnlyDiscounted,
  onToggleCategory,
  onToggleBrand,
  onToggleColor,
  onMinPrice,
  onMaxPrice,
  onClear,
}: {
  categories: Category[];
  brands: Brand[];
  colors: string[];
  selectedCategories: string[];
  selectedBrands: string[];
  selectedColors: string[];
  minPrice: string;
  maxPrice: string;
  onlyInStock: boolean;
  onlyDiscounted: boolean;
  onToggleOnlyInStock: () => void;
  onToggleOnlyDiscounted: () => void;
  onToggleCategory: (id: string) => void;
  onToggleBrand: (id: string) => void;
  onToggleColor: (color: string) => void;
  onMinPrice: (v: string) => void;
  onMaxPrice: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-5">
      {(selectedCategories.length > 0 || selectedBrands.length > 0 || minPrice || maxPrice) && (
        <button onClick={onClear} className="text-xs text-error-600 hover:underline">حذف فیلترها</button>
      )}

      <FilterGroup title="دسته‌بندی">
        {categories.map((cat) => (
          <label key={cat.id} className="flex items-center gap-2 cursor-pointer py-1 group">
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              selectedCategories.includes(cat.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300 group-hover:border-primary-400'
            }`}>
              {selectedCategories.includes(cat.id) && <Check className="w-3 h-3 text-white" />}
            </span>
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat.id)}
              onChange={() => onToggleCategory(cat.id)}
              className="sr-only"
            />
            <span className="text-sm text-gray-700 group-hover:text-primary-700 transition-colors">{cat.name}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="برند">
        {brands.map((brand) => (
          <label key={brand.id} className="flex items-center gap-2 cursor-pointer py-1 group">
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              selectedBrands.includes(brand.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300 group-hover:border-primary-400'
            }`}>
              {selectedBrands.includes(brand.id) && <Check className="w-3 h-3 text-white" />}
            </span>
            <input type="checkbox" checked={selectedBrands.includes(brand.id)} onChange={() => onToggleBrand(brand.id)} className="sr-only" />
            <span className="text-sm text-gray-700 group-hover:text-primary-700 transition-colors">{brand.name}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="محدوده قیمت (تومان)">
        <div className="space-y-2">
          <input
            type="number"
            placeholder="حداقل قیمت"
            value={minPrice}
            onChange={(e) => onMinPrice(e.target.value)}
            className="input py-2 text-sm"
          />
          <input
            type="number"
            placeholder="حداکثر قیمت"
            value={maxPrice}
            onChange={(e) => onMaxPrice(e.target.value)}
            className="input py-2 text-sm"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="فقط نمایش">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer py-1 group">
            <input type="checkbox" checked={onlyInStock} onChange={onToggleOnlyInStock} className="rounded text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700 group-hover:text-primary-700 transition-colors">فقط کالاهای موجود</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer py-1 group">
            <input type="checkbox" checked={onlyDiscounted} onChange={onToggleOnlyDiscounted} className="rounded text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700 group-hover:text-primary-700 transition-colors">فقط کالاهای تخفیف‌خورده</span>
          </label>
        </div>
      </FilterGroup>

      {colors.length > 0 && (
        <FilterGroup title="رنگ">
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => onToggleColor(color)}
                className={`px-3 py-1.5 rounded-full text-xs font-500 transition-colors ${
                  selectedColors.includes(color)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h4 className="text-sm font-700 text-gray-800 mb-3">{title}</h4>
      <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar">{children}</div>
    </div>
  );
}
