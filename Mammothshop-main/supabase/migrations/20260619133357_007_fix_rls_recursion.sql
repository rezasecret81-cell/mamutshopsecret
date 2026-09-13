-- Fix: Use SECURITY DEFINER function to avoid RLS recursion on profiles
-- The admin_read_all_profiles policy queries profiles inside profiles RLS → recursion
-- Solution: use is_admin() function (already SECURITY DEFINER) instead of subquery

-- Drop the recursive policies
DROP POLICY IF EXISTS admin_read_all_profiles ON profiles;
DROP POLICY IF EXISTS admin_update_all_profiles ON profiles;

-- Recreate using is_admin() function (SECURITY DEFINER, bypasses RLS)
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (is_admin());

CREATE POLICY "admin_update_all_profiles" ON profiles FOR UPDATE
  TO authenticated USING (is_admin())
  WITH CHECK (is_admin());

-- Also fix admin policies on orders that use subquery to profiles
DROP POLICY IF EXISTS admin_read_all_orders ON orders;
DROP POLICY IF EXISTS admin_update_all_orders ON orders;

CREATE POLICY "admin_read_all_orders" ON orders FOR SELECT
  TO authenticated USING (is_admin());
CREATE POLICY "admin_update_all_orders" ON orders FOR UPDATE
  TO authenticated USING (is_admin())
  WITH CHECK (is_admin());

-- Fix admin policies on tickets
DROP POLICY IF EXISTS admin_read_all_tickets ON tickets;
CREATE POLICY "admin_read_all_tickets" ON tickets FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR is_admin()
  );

-- Fix admin policy on ticket_replies
DROP POLICY IF EXISTS admin_read_all_ticket_replies ON ticket_replies;
CREATE POLICY "admin_read_all_ticket_replies" ON ticket_replies FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM ticket_replies tr
      JOIN tickets t ON t.id = tr.ticket_id
      WHERE tr.id = ticket_replies.id AND (
        t.user_id = auth.uid() OR is_admin()
      )
    )
  );

-- Fix admin policies on product_reviews, product_questions
DROP POLICY IF EXISTS admin_update_reviews ON product_reviews;
DROP POLICY IF EXISTS admin_delete_reviews ON product_reviews;
CREATE POLICY "admin_update_reviews" ON product_reviews FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_reviews" ON product_reviews FOR DELETE
  TO authenticated USING (is_admin());

-- Fix product_questions admin answer
DROP POLICY IF EXISTS update_admin_answer ON product_questions;
CREATE POLICY "admin_answer_question" ON product_questions FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- Fix wallets admin
DROP POLICY IF EXISTS admin_update_wallet ON wallets;
CREATE POLICY "admin_update_wallet" ON wallets FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Fix wallet_transactions admin read
DROP POLICY IF EXISTS select_own_tx ON wallet_transactions;
CREATE POLICY "read_own_tx" ON wallet_transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM wallets WHERE id = wallet_id AND user_id = auth.uid())
    OR is_admin()
  );

-- Fix flash_sales admin
DROP POLICY IF EXISTS admin_manage_flash ON flash_sales;
CREATE POLICY "admin_insert_flash" ON flash_sales FOR INSERT
  TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_flash" ON flash_sales FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_flash" ON flash_sales FOR DELETE
  TO authenticated USING (is_admin());

-- Fix flash_sale_items admin
DROP POLICY IF EXISTS admin_manage_flash_items ON flash_sale_items;
CREATE POLICY "admin_insert_flash_items" ON flash_sale_items FOR INSERT
  TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_flash_items" ON flash_sale_items FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_flash_items" ON flash_sale_items FOR DELETE
  TO authenticated USING (is_admin());

-- Fix faqs admin (was FOR ALL, split into proper policies)
DROP POLICY IF EXISTS admin_manage_faqs ON faqs;
CREATE POLICY "admin_insert_faq" ON faqs FOR INSERT
  TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_faq" ON faqs FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_faq" ON faqs FOR DELETE
  TO authenticated USING (is_admin());

-- Fix product_images admin (were FOR ALL)
DROP POLICY IF EXISTS admin_insert_images ON product_images;
DROP POLICY IF EXISTS admin_update_images ON product_images;
DROP POLICY IF EXISTS admin_delete_images ON product_images;
CREATE POLICY "admin_insert_image" ON product_images FOR INSERT
  TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_image" ON product_images FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_image" ON product_images FOR DELETE
  TO authenticated USING (is_admin());

-- Fix product_files admin (were FOR ALL)
DROP POLICY IF EXISTS admin_insert_files ON product_files;
DROP POLICY IF EXISTS admin_update_files ON product_files;
DROP POLICY IF EXISTS admin_delete_files ON product_files;
CREATE POLICY "admin_insert_file" ON product_files FOR INSERT
  TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_file" ON product_files FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_file" ON product_files FOR DELETE
  TO authenticated USING (is_admin());
