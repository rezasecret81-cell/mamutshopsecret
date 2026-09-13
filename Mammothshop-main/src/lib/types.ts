export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_url?: string | null;
  og_image?: string | null;
  meta_robots?: string | null;
  focus_keyword?: string | null;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_url?: string | null;
  og_image?: string | null;
  meta_robots?: string | null;
  focus_keyword?: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specifications: Record<string, string>;
  price: number;
  discount_price: number | null;
  stock: number;
  low_stock_threshold: number;
  category_id: string | null;
  brand_id: string | null;
  image_url: string | null;
  color: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
  rating: number;
  created_at: string;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  shipping_class: string | null;
  package_type: string | null;
  model_number: string | null;
  sku: string | null;
  country_of_origin: string | null;
  warranty: string | null;
  view_count: number;
  review_count: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_url?: string | null;
  og_image?: string | null;
  meta_robots?: string | null;
  focus_keyword?: string | null;
  meta_description?: string | null;
  secondary_keywords?: string[] | null;
  long_tail_keywords?: string[] | null;
  seo_description?: string | null;
  faq?: { question: string; answer: string }[] | null;
  seo_score?: number | null;
  seo_slug?: string | null;
  schema_markup?: Record<string, unknown> | null;
  ai_seo_status?: 'none' | 'processing' | 'optimized' | 'failed' | null;
  last_ai_optimization?: string | null;
  ai_seo_version?: number | null;
  schema_data?: Record<string, unknown> | null;
  internal_link_suggestions?: { name: string; slug: string; reason: string }[] | null;
  category?: Category;
  brand?: Brand;
  images?: ProductImage[];
  files?: ProductFile[];
  flash_sale?: FlashSaleItem;
};

export type ProductImage = {
  id: string;
  image_url: string;
  alt: string | null;
  sort_order: number;
};

export type ProductFile = {
  id: string;
  url: string;
  name: string;
  file_type: 'catalog' | 'datasheet' | 'manual' | 'other';
  sort_order: number;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
};

export type ProductQuestion = {
  id: string;
  product_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  answered_by: string | null;
  is_approved: boolean;
  created_at: string;
  answered_at: string | null;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
};

export type WalletTransaction = {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'deposit' | 'withdraw' | 'purchase' | 'refund' | 'reward';
  description: string | null;
  order_id: string | null;
  created_at: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
};

export type FlashSale = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

export type FlashSaleItem = {
  id: string;
  flash_sale_id: string;
  product_id: string;
  sale_price: number;
  quantity_limit: number | null;
  sold_count: number;
};

export type Coupon = {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  loyalty_points: number;
  created_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  title: string | null;
  recipient: string | null;
  phone: string | null;
  province: string | null;
  city: string | null;
  postal_code: string | null;
  address: string | null;
  is_default: boolean;
};

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ShippingStatus = 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'returned';

export type Order = {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_status: ShippingStatus;
  payment_method: string;
  total_amount: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  shipping_address: Record<string, unknown>;
  coupon_code: string | null;
  tracking_code: string | null;
  shipping_company: string | null;
  notes: string | null;
  notes_admin: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  image_url: string | null;
};

export type OrderTimeline = {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  updated_at: string;
};

export type TicketReply = {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type ChatRoom = {
  id: string;
  user_id: string;
  status: 'active' | 'closed' | 'pending';
  subject: string | null;
  created_at: string;
  updated_at: string;
  unread_admin: number;
  unread_user: number;
  last_message: string | null;
  last_message_at: string | null;
  profiles?: { full_name: string } | null;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string | null;
  message: string;
  is_from_admin: boolean;
  created_at: string;
  read_at: string | null;
  delivered_at: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
};

export type ChatTyping = {
  room_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  author_id: string | null;
  category: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  canonical_url: string | null;
  og_image: string | null;
  meta_robots: string | null;
  focus_keyword: string | null;
  reading_time: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogFaq = {
  id: string;
  post_id: string;
  question: string;
  answer: string;
  display_order: number;
};

export type SeoRedirect = {
  id: string;
  from_path: string;
  to_path: string;
  redirect_type: number;
  is_active: boolean;
  created_at: string;
};
