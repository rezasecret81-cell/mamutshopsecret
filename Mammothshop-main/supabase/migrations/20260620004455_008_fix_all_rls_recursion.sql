-- Fix remaining RLS recursion: replace all subqueries to profiles with is_admin() function

-- Fix flash_sales read policy
DROP POLICY IF EXISTS read_flash_public ON flash_sales;
CREATE POLICY "read_flash_public" ON flash_sales FOR SELECT
  TO anon, authenticated USING (
    is_active OR is_admin()
  );

-- Fix product_questions read policy
DROP POLICY IF EXISTS read_questions_public ON product_questions;
CREATE POLICY "read_questions_public" ON product_questions FOR SELECT
  TO anon, authenticated USING (
    is_approved OR user_id = auth.uid() OR is_admin()
  );

-- Fix product_reviews read policy
DROP POLICY IF EXISTS read_reviews_public ON product_reviews;
CREATE POLICY "read_reviews_public" ON product_reviews FOR SELECT
  TO anon, authenticated USING (
    is_approved OR user_id = auth.uid() OR is_admin()
  );

-- Fix wallets read policy
DROP POLICY IF EXISTS select_own_wallet ON wallets;
CREATE POLICY "read_own_wallet" ON wallets FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR is_admin()
  );

-- Fix wallet_transactions read policy (was using subquery to wallets which subqueries profiles)
DROP POLICY IF EXISTS read_own_tx ON wallet_transactions;
CREATE POLICY "read_own_tx" ON wallet_transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM wallets WHERE id = wallet_id AND user_id = auth.uid())
    OR is_admin()
  );

-- Verify: check if any policies still have subquery to profiles (excluding profiles table itself)
-- This should return 0 rows after this migration
