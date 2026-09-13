import { supabase } from './supabase';
import type {
  Address,
  Brand,
  Category,
  Coupon,
  Faq,
  FlashSale,
  FlashSaleItem,
  Order,
  OrderItem,
  Product,
  ProductFile,
  ProductImage,
  ProductQuestion,
  Profile,
  Review,
  Ticket,
  TicketReply,
  Wallet,
  WalletTransaction,
} from './types';

async function safeRequest<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('داده‌ای یافت نشد');
  return data;
}

// --- sessionStorage cache (survives tab backgrounding/reload) ---
const CACHE_PREFIX = 'api_cache:';
const DEFAULT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

type CacheEntry<T> = { data: T; expiresAt: number };

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T, ttlMs = DEFAULT_CACHE_TTL): void {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — skip caching
  }
}

function invalidateCache(key: string): void {
  try {
    sessionStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // ignore
  }
}

function invalidatePattern(pattern: string): void {
  try {
    const regex = new RegExp(pattern);
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX) && regex.test(k.slice(CACHE_PREFIX.length))) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

// Stale-while-revalidate: return cached data instantly, refresh in background if stale
async function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_CACHE_TTL
): Promise<T> {
  const cached = readCache<T>(key);
  if (cached !== null) {
    // Return cached data immediately; refresh in background if expired
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (Date.now() > entry.expiresAt) {
        fetcher().then((fresh) => writeCache(key, fresh, ttlMs)).catch(() => {});
      }
    }
    return cached;
  }
  const fresh = await fetcher();
  writeCache(key, fresh, ttlMs);
  return fresh;
}

export const api = {
  async getCategories(): Promise<Category[]> {
    return swr('categories', () => safeRequest<Category[]>(
      supabase.from('categories').select('*').order('name')
    ));
  },

  async getBrands(): Promise<Brand[]> {
    return swr('brands', () => safeRequest<Brand[]>(
      supabase.from('brands').select('*').order('name')
    ));
  },

  async getProducts(filters: {
    categorySlug?: string;
    brandSlug?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'bestseller';
    featured?: boolean;
    bestseller?: boolean;
    limit?: number;
  } = {}): Promise<Product[]> {
    const cacheKey = 'products:' + JSON.stringify(filters);
    return swr(cacheKey, async () => {
      let query = supabase
        .from('products')
        .select('*, category:categories(*), brand:brands(*)');

      if (filters.featured) query = query.eq('is_featured', true);
      if (filters.bestseller) query = query.eq('is_bestseller', true);
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);

      switch (filters.sort) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'bestseller':
          query = query.order('is_bestseller', { ascending: false }).order('rating', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      let products = (data ?? []) as Product[];

      if (filters.categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.categorySlug)
          .maybeSingle();
        if (cat) products = products.filter((p) => p.category_id === cat.id);
      }
      if (filters.brandSlug) {
        const { data: brand } = await supabase
          .from('brands')
          .select('id')
          .eq('slug', filters.brandSlug)
          .maybeSingle();
        if (brand) products = products.filter((p) => p.brand_id === brand.id);
      }
      return products;
    });
  },

  async getProduct(slug: string): Promise<Product | null> {
    return swr(`product:${slug}`, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), brand:brands(*)')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const product = data as Product;
      try {
        const [images, files] = await Promise.all([
          supabase.from('product_images').select('*').eq('product_id', product.id).order('sort_order'),
          supabase.from('product_files').select('*').eq('product_id', product.id).order('sort_order'),
        ]);
        product.images = (images.data ?? []) as unknown as Product['images'];
        product.files = (files.data ?? []) as unknown as Product['files'];
      } catch {
        // ignore - images/files are optional
      }
      return product;
    });
  },

  async getRelatedProducts(product: Product, limit = 5): Promise<Product[]> {
    if (!product.category_id) return [];
    const cacheKey = `related:${product.id}:${limit}`;
    return swr(cacheKey, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), brand:brands(*)')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    });
  },

  async getReviews(productId: string): Promise<Review[]> {
    return swr(`reviews:${productId}`, async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('helpful_count', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Review[];
    });
  },

  async addReview(productId: string, userId: string, rating: number, title: string, body: string): Promise<Review> {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert({ product_id: productId, user_id: userId, rating, title, body })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Review;
  },

  async getQuestions(productId: string): Promise<ProductQuestion[]> {
    return swr(`questions:${productId}`, async () => {
      const { data, error } = await supabase
        .from('product_questions')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ProductQuestion[];
    });
  },

  async addQuestion(productId: string, userId: string, question: string): Promise<ProductQuestion> {
    const { data, error } = await supabase
      .from('product_questions')
      .insert({ product_id: productId, user_id: userId, question })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ProductQuestion;
  },

  async getProductImages(productId: string): Promise<ProductImage[]> {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');
    if (error) throw new Error(error.message);
    return (data ?? []) as ProductImage[];
  },

  async getProductFiles(productId: string): Promise<ProductFile[]> {
    const { data, error } = await supabase
      .from('product_files')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');
    if (error) throw new Error(error.message);
    return (data ?? []) as ProductFile[];
  },

  async getFaqs(): Promise<Faq[]> {
    return swr('faqs', async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw new Error(error.message);
      return (data ?? []) as Faq[];
    });
  },

  async getActiveFlashSale(): Promise<FlashSale | null> {
    return swr('flash_sale_active', async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as FlashSale | null;
    }, 60 * 1000);
  },

  async getFlashSaleItems(flashSaleId: string): Promise<FlashSaleItem[]> {
    const { data, error } = await supabase
      .from('flash_sale_items')
      .select('*')
      .eq('flash_sale_id', flashSaleId);
    if (error) throw new Error(error.message);
    return (data ?? []) as FlashSaleItem[];
  },

  async getFlashSaleProducts(): Promise<Product[]> {
    return swr('flash_sale_products', async () => {
      const flashSale = await this.getActiveFlashSale();
      if (!flashSale) return [];
      const items = await this.getFlashSaleItems(flashSale.id);
      if (items.length === 0) return [];
      const productIds = items.map((i) => i.product_id);
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), brand:brands(*)')
        .in('id', productIds);
      if (error) throw new Error(error.message);
      const products = (data ?? []) as Product[];
      return products.map((p) => {
        const flashItem = items.find((i) => i.product_id === p.id);
        if (flashItem) {
          return { ...p, flash_sale: flashItem };
        }
        return p;
      });
    }, 60 * 1000);
  },

  async getDiscountedProducts(limit = 8): Promise<Product[]> {
    return swr(`discounted:${limit}`, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), brand:brands(*)')
        .not('discount_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    });
  },

  async getWallet(userId: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Wallet | null;
  },

  async getWalletTransactions(walletId: string): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as WalletTransaction[];
  },

  async getAdminOrders(): Promise<Order[]> {
    return swr('admin_orders', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Order[];
    });
  },

  async getAdminProfiles(): Promise<Profile[]> {
    return swr('admin_profiles', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Profile[];
    });
  },

  async validateCoupon(code: string, total: number): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('کد تخفیف معتبر نیست');
    const coupon = data as Coupon;
    if (coupon.min_order && total < coupon.min_order) {
      throw new Error(`حداقل مبلغ سفارش برای این کد ${coupon.min_order.toLocaleString('fa-IR')} تومان است`);
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      throw new Error('سقف استفاده از این کد تکمیل شده است');
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      throw new Error('این کد تخفیف منقضی شده است');
    }
    return coupon;
  },

  async incrementCouponUsage(code: string) {
    const { data: existing } = await supabase
      .from('coupons')
      .select('used_count')
      .eq('code', code.toUpperCase())
      .maybeSingle();
    if (existing) {
      await supabase
        .from('coupons')
        .update({ used_count: (existing.used_count ?? 0) + 1 })
        .eq('code', code.toUpperCase());
    }
  },

  async createOrder(payload: {
    userId: string;
    orderNumber: string;
    total: number;
    discountAmount: number;
    shippingAddress: Record<string, unknown>;
    couponCode: string | null;
    notes: string | null;
    items: { product_id: string; product_name: string; quantity: number; unit_price: number; image_url: string | null }[];
  }): Promise<Order> {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: payload.userId,
        order_number: payload.orderNumber,
        status: 'pending',
        total_amount: payload.total,
        discount_amount: payload.discountAmount,
        shipping_address: payload.shippingAddress,
        coupon_code: payload.couponCode,
        notes: payload.notes,
      })
      .select()
      .single();
    if (orderError) throw new Error(orderError.message);

    const items = payload.items.map((item) => ({
      order_id: (order as Order).id,
      ...item,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(items);
    if (itemsError) throw new Error(itemsError.message);

    if (payload.couponCode) {
      await this.incrementCouponUsage(payload.couponCode);
    }
    return order as Order;
  },

  async getOrderDetails(orderNumber: string): Promise<{ order: Order; items: OrderItem[] } | null> {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', (order as Order).id);
    if (itemsError) throw new Error(itemsError.message);
    return { order: order as Order, items: (items ?? []) as OrderItem[] };
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    return swr(`user_orders:${userId}`, async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Order[];
    });
  },

  async cancelOrder(orderId: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);
    if (error) throw new Error(error.message);
  },

  async getAddresses(userId: string): Promise<Address[]> {
    return swr(`addresses:${userId}`, async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Address[];
    });
  },

  async saveAddress(address: Partial<Address> & { user_id: string }): Promise<Address> {
    const { data, error } = await supabase
      .from('addresses')
      .insert(address)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Address;
  },

  async updateAddress(id: string, address: Partial<Address>): Promise<Address> {
    const { data, error } = await supabase
      .from('addresses')
      .update(address)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Address;
  },

  async deleteAddress(id: string) {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Profile;
  },

  async createTicket(subject: string, priority: 'low' | 'normal' | 'high', userId: string): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .insert({ user_id: userId, subject, priority })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Ticket;
  },

  async getTickets(userId: string, isAdmin = false): Promise<Ticket[]> {
    const cacheKey = `tickets:${isAdmin ? 'admin' : userId}`;
    return swr(cacheKey, async () => {
      let query = supabase.from('tickets').select('*').order('updated_at', { ascending: false });
      if (!isAdmin) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as Ticket[];
    });
  },

  async getTicketReplies(ticketId: string): Promise<TicketReply[]> {
    const { data, error } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as TicketReply[];
  },

  async sendTicketReply(ticketId: string, userId: string, message: string, isStaff = false): Promise<TicketReply> {
    const { data, error } = await supabase
      .from('ticket_replies')
      .insert({ ticket_id: ticketId, user_id: userId, message, is_staff: isStaff })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabase
      .from('tickets')
      .update({ status: isStaff ? 'answered' : 'open', updated_at: new Date().toISOString() })
      .eq('id', ticketId);
    return data as TicketReply;
  },

  async getSettings(): Promise<Record<string, any>> {
    return swr('settings', async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw new Error(error.message);
      const out: Record<string, any> = {};
      for (const row of data ?? []) out[row.key] = row.value;
      return out;
    }, 10 * 60 * 1000);
  },

  async getSetting(key: string): Promise<any> {
    const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value ?? null;
  },

  async saveSetting(key: string, value: any): Promise<void> {
    const { error } = await supabase.from('site_settings').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) throw new Error(error.message);
    invalidateCache('settings');
  },

  async requestPayment(orderId: string, amount: number, userId: string, orderNumber: string): Promise<{ authority: string; gatewayUrl: string }> {
    const { data: settings } = await supabase.from('site_settings').select('value').eq('key', 'payment').maybeSingle();
    const cfg = settings?.value ?? { gateway: 'zarinpal', merchant_id: '', sandbox: true };
    const merchantId = cfg.merchant_id || '00000000-0000-0000-0000-000000000000';
    const sandbox = cfg.sandbox ?? true;
    const callbackUrl = `${window.location.origin}/payment/verify?order=${orderNumber}`;
    const { data: tx, error: txErr } = await supabase.from('payment_transactions').insert({
      order_id: orderId,
      user_id: userId,
      amount,
      status: 'pending',
      gateway: cfg.gateway || 'zarinpal',
    }).select().single();
    if (txErr) throw new Error(txErr.message);
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'request',
        merchantId,
        amount,
        callbackUrl,
        description: `سفارش ${orderNumber}`,
        txId: tx.id,
        sandbox,
      }),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || 'خطا در اتصال به درگاه پرداخت');
    await supabase.from('payment_transactions').update({ authority: json.authority, status: 'redirected' }).eq('id', tx.id);
    return { authority: json.authority, gatewayUrl: json.gatewayUrl };
  },

  async verifyPayment(authority: string, amount: number, txId: string, status: string): Promise<{ success: boolean; refId?: string; message: string }> {
    const { data: settings } = await supabase.from('site_settings').select('value').eq('key', 'payment').maybeSingle();
    const cfg = settings?.value ?? { gateway: 'zarinpal', merchant_id: '', sandbox: true };
    const merchantId = cfg.merchant_id || '00000000-0000-0000-0000-000000000000';
    const sandbox = cfg.sandbox ?? true;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'verify',
        merchantId,
        authority,
        amount,
        txId,
        status,
        sandbox,
      }),
    });
    const json = await res.json();
    if (!res.ok || json.error || !json.success) {
      await supabase.from('payment_transactions').update({ status: 'failed', raw_response: json }).eq('id', txId);
      return { success: false, message: json.error || json.message || 'پرداخت ناموفق بود' };
    }
    await supabase.from('payment_transactions').update({
      status: 'success',
      ref_id: json.refId,
      tracking_code: json.refId,
      raw_response: json,
    }).eq('id', txId);
    return { success: true, refId: json.refId, message: 'پرداخت با موفقیت انجام شد' };
  },

  async getPaymentTransactions(): Promise<any[]> {
    return swr('admin_payments', async () => {
      const { data, error } = await supabase.from('payment_transactions').select('*, order:orders(*)').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    });
  },

  async generateAiSeo(product: Product, relatedProducts: Product[]): Promise<{
    seo_title: string;
    meta_description: string;
    focus_keyword: string;
    secondary_keywords: string[];
    long_tail_keywords: string[];
    seo_description: string;
    faq: { question: string; answer: string }[];
    image_alt_texts: { url: string; alt: string }[];
    seo_slug: string;
    seo_score: number;
    internal_link_suggestions: { name: string; slug: string; reason: string }[];
  }> {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-seo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        product: {
          name: product.name,
          description: product.description,
          specifications: product.specifications,
          price: product.price,
          sku: product.sku,
          brand: product.brand,
          category: product.category,
          image_url: product.image_url,
          images: product.images,
          model_number: product.model_number,
          country_of_origin: product.country_of_origin,
          warranty: product.warranty,
        },
        relatedProducts: relatedProducts.map((p) => ({
          name: p.name,
          slug: p.slug,
          category: p.category,
        })),
      }),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || 'خطا در تولید سئو');
    return json;
  },

  async applySeoSuggestion(productId: string, suggestion: {
    seo_title?: string;
    meta_description?: string;
    focus_keyword?: string;
    secondary_keywords?: string[];
    long_tail_keywords?: string[];
    seo_description?: string;
    faq?: { question: string; answer: string }[];
    image_alt_texts?: { url: string; alt: string }[];
    seo_slug?: string;
    seo_score?: number;
    internal_link_suggestions?: { name: string; slug: string; reason: string }[];
  }): Promise<void> {
    // Fetch current ai_seo_version to increment
    const { data: current } = await supabase
      .from('products')
      .select('ai_seo_version')
      .eq('id', productId)
      .single();
    const nextVersion = (current?.ai_seo_version ?? 0) + 1;

    const { error } = await supabase.from('products').update({
      seo_title: suggestion.seo_title,
      meta_description: suggestion.meta_description,
      focus_keyword: suggestion.focus_keyword,
      secondary_keywords: suggestion.secondary_keywords,
      long_tail_keywords: suggestion.long_tail_keywords,
      seo_description: suggestion.seo_description,
      faq: suggestion.faq,
      seo_slug: suggestion.seo_slug,
      seo_score: suggestion.seo_score,
      internal_link_suggestions: suggestion.internal_link_suggestions,
      ai_seo_status: 'optimized',
      last_ai_optimization: new Date().toISOString(),
      ai_seo_version: nextVersion,
    }).eq('id', productId);
    if (error) throw new Error(error.message);

    // Apply image alt texts to product_images table
    if (suggestion.image_alt_texts && suggestion.image_alt_texts.length > 0) {
      const { data: prodData } = await supabase.from('products').select('image_url').eq('id', productId).single();
      const mainImageUrl = prodData?.image_url;
      for (const img of suggestion.image_alt_texts) {
        await supabase
          .from('product_images')
          .update({ alt: img.alt })
          .eq('product_id', productId)
          .eq('image_url', img.url);
      }
      // If the main product image has a suggested alt, store it on product_images too
      if (mainImageUrl) {
        const mainAlt = suggestion.image_alt_texts.find(i => i.url === mainImageUrl);
        if (mainAlt) {
          await supabase
            .from('product_images')
            .update({ alt: mainAlt.alt })
            .eq('product_id', productId)
            .eq('image_url', mainImageUrl);
        }
      }
    }

    invalidatePattern('product');
    invalidatePattern('products');
  },

  async saveSeoHistory(productId: string, seoData: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('product_seo_history').insert({
      product_id: productId,
      seo_data: seoData,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) throw new Error(error.message);
  },

  async getSeoHistory(productId: string): Promise<{ id: string; seo_data: Record<string, unknown>; created_at: string }[]> {
    const { data, error } = await supabase
      .from('product_seo_history')
      .select('id, seo_data, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as { id: string; seo_data: Record<string, unknown>; created_at: string }[];
  },

  async restoreSeoVersion(historyId: string, productId: string): Promise<void> {
    const { data, error: fetchErr } = await supabase
      .from('product_seo_history')
      .select('seo_data')
      .eq('id', historyId)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);
    const seoData = data?.seo_data as Record<string, unknown>;
    const { error: updateErr } = await supabase.from('products').update({
      seo_title: seoData.seo_title,
      meta_description: seoData.meta_description,
      focus_keyword: seoData.focus_keyword,
      secondary_keywords: seoData.secondary_keywords,
      long_tail_keywords: seoData.long_tail_keywords,
      seo_description: seoData.seo_description,
      faq: seoData.faq,
      seo_slug: seoData.seo_slug,
      seo_score: seoData.seo_score,
      internal_link_suggestions: seoData.internal_link_suggestions,
    }).eq('id', productId);
    if (updateErr) throw new Error(updateErr.message);
    invalidatePattern('product');
    invalidatePattern('products');
  },

  async getSeoDashboard(): Promise<{
    totalProducts: number;
    optimizedProducts: number;
    needingSeo: number;
    avgScore: number;
    missingMeta: number;
    missingDescription: number;
    missingAlt: number;
    missingSchema: number;
    lowScoreProducts: { id: string; name: string; slug: string; seo_score: number }[];
  }> {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, seo_title, seo_description, meta_description, seo_score, image_url, ai_seo_status');
    if (error) throw new Error(error.message);
    const products = (data ?? []) as any[];
    const total = products.length;
    const optimized = products.filter((p) => p.ai_seo_status === 'optimized').length;
    const needing = products.filter((p) => !p.seo_title || !p.seo_description).length;
    const scores = products.filter((p) => p.seo_score > 0).map((p) => p.seo_score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    const missingMeta = products.filter((p) => !p.meta_description).length;
    const missingDesc = products.filter((p) => !p.seo_description).length;
    const productIds = products.map((p) => p.id);
    let missingAlt = products.filter((p) => !p.image_url || p.image_url === '').length;
    if (productIds.length > 0) {
      const { data: imgData } = await supabase
        .from('product_images')
        .select('product_id, alt')
        .in('product_id', productIds);
      const imgRows = (imgData ?? []) as { product_id: string; alt: string | null }[];
      const productsWithImagesMissingAlt = new Set(
        imgRows.filter((r) => !r.alt || r.alt.trim() === '').map((r) => r.product_id)
      );
      missingAlt += productsWithImagesMissingAlt.size;
    }
    const missingSchema = products.filter((p) => !p.ai_seo_status || p.ai_seo_status === 'none').length;
    const lowScore = products
      .filter((p) => p.seo_score !== null && p.seo_score < 50)
      .sort((a, b) => (a.seo_score ?? 0) - (b.seo_score ?? 0))
      .slice(0, 10)
      .map((p) => ({ id: p.id, name: p.name, slug: p.slug, seo_score: p.seo_score ?? 0 }));
    return {
      totalProducts: total,
      optimizedProducts: optimized,
      needingSeo: needing,
      avgScore: avg,
      missingMeta,
      missingDescription: missingDesc,
      missingAlt,
      missingSchema,
      lowScoreProducts: lowScore,
    };
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (error) throw new Error(error.message);
  },

  async decreaseStock(orderId: string): Promise<void> {
    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (itemsError) throw new Error(itemsError.message);
    if (!items || items.length === 0) return;

    // Decrease stock for each product
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (productError) continue;
      if (!product) continue;

      const newStock = Math.max(0, product.stock - item.quantity);

      await supabase
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', item.product_id);
    }
  },
};
