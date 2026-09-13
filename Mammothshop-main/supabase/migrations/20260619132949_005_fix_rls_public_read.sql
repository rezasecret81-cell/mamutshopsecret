-- Drop ALL conflicting policies on product_images and rebuild clean
DROP POLICY IF EXISTS admin_manage_images ON product_images;
DROP POLICY IF EXISTS admin_write_product_images ON product_images;
DROP POLICY IF EXISTS read_product_images ON product_images;
DROP POLICY IF EXISTS select_images_public ON product_images;

-- Product images: public read, admin write
CREATE POLICY "read_product_images_public" ON product_images FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "admin_insert_images" ON product_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "admin_update_images" ON product_images FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "admin_delete_images" ON product_images FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Drop ALL conflicting policies on product_files and rebuild clean
DROP POLICY IF EXISTS admin_manage_files ON product_files;
DROP POLICY IF EXISTS select_files_public ON product_files;

-- Product files: public read (anon + authenticated), admin write
CREATE POLICY "read_product_files_public" ON product_files FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "admin_insert_files" ON product_files FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "admin_update_files" ON product_files FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "admin_delete_files" ON product_files FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Fix flash_sale_items: add anon read
DROP POLICY IF EXISTS select_flash_items_public ON flash_sale_items;
CREATE POLICY "read_flash_items_public" ON flash_sale_items FOR SELECT
  TO anon, authenticated USING (true);

-- Fix flash_sales: add anon read
DROP POLICY IF EXISTS select_flash_public ON flash_sales;
CREATE POLICY "read_flash_public" ON flash_sales FOR SELECT
  TO anon, authenticated USING (is_active
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Fix faqs: add anon read
DROP POLICY IF EXISTS select_faqs_public ON faqs;
CREATE POLICY "read_faqs_public" ON faqs FOR SELECT
  TO anon, authenticated USING (is_active);

-- Fix product_reviews: allow anon to read approved reviews
DROP POLICY IF EXISTS select_approved_reviews_or_own ON product_reviews;
CREATE POLICY "read_reviews_public" ON product_reviews FOR SELECT
  TO anon, authenticated USING (is_approved OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Fix product_questions: allow anon to read approved questions
DROP POLICY IF EXISTS select_questions_public ON product_questions;
CREATE POLICY "read_questions_public" ON product_questions FOR SELECT
  TO anon, authenticated USING (is_approved OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
