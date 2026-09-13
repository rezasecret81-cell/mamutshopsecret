-- Add SEO fields to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_robots TEXT DEFAULT 'index, follow';
ALTER TABLE products ADD COLUMN IF NOT EXISTS focus_keyword TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS schema_data JSONB;

-- Add SEO fields to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_robots TEXT DEFAULT 'index, follow';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS focus_keyword TEXT;

-- Add SEO fields to brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS meta_robots TEXT DEFAULT 'index, follow';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS focus_keyword TEXT;

-- Create blog table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id),
  category TEXT,
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  canonical_url TEXT,
  og_image TEXT,
  meta_robots TEXT DEFAULT 'index, follow',
  focus_keyword TEXT,
  reading_time INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create blog faqs table
CREATE TABLE IF NOT EXISTS blog_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Create redirects table
CREATE TABLE IF NOT EXISTS seo_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT UNIQUE NOT NULL,
  to_path TEXT NOT NULL,
  redirect_type INTEGER DEFAULT 301,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_redirects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
CREATE POLICY "public_read_blog" ON blog_posts FOR SELECT TO anon, authenticated USING (published_at IS NOT NULL);
CREATE POLICY "admins_manage_blog" ON blog_posts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for blog_faqs
CREATE POLICY "public_read_faqs" ON blog_faqs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins_manage_faqs" ON blog_faqs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for seo_redirects
CREATE POLICY "admins_manage_redirects" ON seo_redirects FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_redirects_from ON seo_redirects(from_path);