-- Product reviews & ratings
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  is_approved boolean NOT NULL DEFAULT false,
  helpful_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_review_per_user_product UNIQUE (product_id, user_id)
);
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_approved_reviews_or_own" ON product_reviews FOR SELECT
  TO authenticated USING (is_approved OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "insert_own_review" ON product_reviews FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_review" ON product_reviews FOR UPDATE
  TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_update_reviews" ON product_reviews FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "admin_delete_reviews" ON product_reviews FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Product Q&A
CREATE TABLE IF NOT EXISTS product_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  answered_by uuid REFERENCES profiles(id),
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);
ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_questions_public" ON product_questions FOR SELECT
  TO authenticated USING (is_approved OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "insert_own_question" ON product_questions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_admin_answer" ON product_questions FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Product gallery images
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_images_public" ON product_images FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_manage_images" ON product_images FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Product downloadable files (catalog, datasheet, manual)
CREATE TABLE IF NOT EXISTS product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('catalog', 'datasheet', 'manual', 'other')),
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_files_public" ON product_files FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_manage_files" ON product_files FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Add specs_color column to products for color filtering
ALTER TABLE products ADD COLUMN IF NOT EXISTS color text;

-- User wallet
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_wallet" ON wallets FOR SELECT
  TO authenticated USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "admin_update_wallet" ON wallets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit','withdraw','purchase','refund','reward')),
  description text,
  order_id uuid REFERENCES orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_tx" ON wallet_transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM wallets WHERE id = wallet_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Loyalty points / customer club
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;

-- FAQ
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'عمومی',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_faqs_public" ON faqs FOR SELECT
  TO authenticated USING (is_active);
CREATE POLICY "admin_manage_faqs" ON faqs FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Flash sales
CREATE TABLE IF NOT EXISTS flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_flash_public" ON flash_sales FOR SELECT
  TO authenticated USING (is_active
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "admin_manage_flash" ON flash_sales FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Flash sale items (products with extra discount)
CREATE TABLE IF NOT EXISTS flash_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_sale_id uuid NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_price bigint NOT NULL,
  quantity_limit integer,
  sold_count integer NOT NULL DEFAULT 0,
  CONSTRAINT unique_flash_item UNIQUE (flash_sale_id, product_id)
);
ALTER TABLE flash_sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_flash_items_public" ON flash_sale_items FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_manage_flash_items" ON flash_sale_items FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews (product_id) WHERE is_approved;
CREATE INDEX IF NOT EXISTS idx_questions_product ON product_questions (product_id) WHERE is_approved;
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_files_product ON product_files (product_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON flash_sales (is_active, starts_at, ends_at);

-- Helper function: update product rating from reviews
CREATE OR REPLACE FUNCTION update_product_rating(p_product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET rating = COALESCE(
    (SELECT AVG(rating)::numeric FROM product_reviews WHERE product_id = p_product_id AND is_approved),
    0
  )
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalc rating on review insert/update/delete
CREATE OR REPLACE FUNCTION trg_update_product_rating()
RETURNS trigger AS $$
BEGIN
  PERFORM update_product_rating(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.product_id
      ELSE NEW.product_id
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON product_reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION trg_update_product_rating();
