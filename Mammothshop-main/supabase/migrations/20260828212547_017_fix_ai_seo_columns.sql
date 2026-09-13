-- Add alt column to product_images for AI-generated alt text
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_images' AND column_name='alt') THEN
    ALTER TABLE product_images ADD COLUMN alt text;
  END IF;
END $$;

-- Add long_tail_keywords column to products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='long_tail_keywords') THEN
    ALTER TABLE products ADD COLUMN long_tail_keywords text[];
  END IF;
END $$;

-- Add internal_link_suggestions column to products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='internal_link_suggestions') THEN
    ALTER TABLE products ADD COLUMN internal_link_suggestions jsonb;
  END IF;
END $$;

-- Add is_active column to products (used by sitemap edge function)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_active') THEN
    ALTER TABLE products ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- RLS policies for product_images alt updates (admins only)
-- The existing product_images policies should already cover this,
-- but ensure admin can update
DROP POLICY IF EXISTS "admin_update_product_images" ON product_images;
CREATE POLICY "admin_update_product_images" ON product_images
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
