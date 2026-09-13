/*
# AI SEO System

1. New Columns on `products`
- meta_description text — dedicated meta description for AI-generated content
- focus_keyword text — primary focus keyword
- secondary_keywords text[] — secondary + long-tail keywords
- seo_description text — AI-optimized product description (HTML)
- faq jsonb — array of {question, answer}
- seo_score integer — 0-100 score
- seo_slug text — AI-suggested URL slug
- schema_markup jsonb — custom schema overrides
- ai_seo_status text — 'none' | 'processing' | 'optimized' | 'failed'
- last_ai_optimization timestamptz
- ai_seo_version integer — version counter

2. New Table: `product_seo_history`
- id uuid PK
- product_id uuid FK -> products(id) ON DELETE CASCADE
- seo_data jsonb — snapshot of all SEO fields at that version
- created_at timestamptz
- created_by uuid — admin user id (nullable)

3. Security
- RLS enabled on product_seo_history
- Only authenticated admins can read/insert
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='meta_description') THEN
    ALTER TABLE products ADD COLUMN meta_description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='focus_keyword') THEN
    ALTER TABLE products ADD COLUMN focus_keyword text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='secondary_keywords') THEN
    ALTER TABLE products ADD COLUMN secondary_keywords text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='seo_description') THEN
    ALTER TABLE products ADD COLUMN seo_description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='faq') THEN
    ALTER TABLE products ADD COLUMN faq jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='seo_score') THEN
    ALTER TABLE products ADD COLUMN seo_score integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='seo_slug') THEN
    ALTER TABLE products ADD COLUMN seo_slug text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='schema_markup') THEN
    ALTER TABLE products ADD COLUMN schema_markup jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_seo_status') THEN
    ALTER TABLE products ADD COLUMN ai_seo_status text DEFAULT 'none';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_ai_optimization') THEN
    ALTER TABLE products ADD COLUMN last_ai_optimization timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_seo_version') THEN
    ALTER TABLE products ADD COLUMN ai_seo_version integer DEFAULT 0;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS product_seo_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seo_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE product_seo_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_seo_history" ON product_seo_history;
CREATE POLICY "admin_read_seo_history" ON product_seo_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_insert_seo_history" ON product_seo_history;
CREATE POLICY "admin_insert_seo_history" ON product_seo_history
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE INDEX IF NOT EXISTS idx_product_seo_history_product_id ON product_seo_history(product_id);
CREATE INDEX IF NOT EXISTS idx_products_ai_seo_status ON products(ai_seo_status);
