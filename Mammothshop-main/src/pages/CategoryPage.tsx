import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Seo } from '@/components/Seo';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import type { Category, Product } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { toPersianDigits } from '@/lib/format';

export function CategoryPage({ slug }: { slug: string }) {
  const { toast } = useToast();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const hasDataRef = useRef(false);

  useEffect(() => {
    const isFirstLoad = !hasDataRef.current;
    if (isFirstLoad) setLoading(true);
    Promise.all([api.getCategories(), api.getProducts({ categorySlug: slug, limit: 50 })])
      .then(([cats, prods]) => {
        const cat = cats.find((c) => c.slug === slug) ?? null;
        setCategory(cat);
        setProducts(prods);
        hasDataRef.current = true;
      })
      .catch((err) => {
        if (isFirstLoad) toast(err.message, 'error');
      })
      .finally(() => {
        if (isFirstLoad) setLoading(false);
      });
  }, [slug, toast]);

  return (
    <>
      <Seo title={category?.name ?? 'دسته‌بندی'} description={category?.description ?? undefined} />
      <div className="bg-gradient-to-l from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-800 mb-2">{category?.name ?? 'دسته‌بندی'}</h1>
          {category?.description && <p className="text-primary-100">{category.description}</p>}
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-gray-500 mb-6">{toPersianDigits(products.length)} محصول</p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">محصولی در این دسته‌بندی یافت نشد</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
