-- Fix: add WITH CHECK to admin answer policy
DROP POLICY IF EXISTS update_admin_answer ON product_questions;
CREATE POLICY "update_admin_answer" ON product_questions FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Add admin insert policy for product_questions so admin can answer
-- (already covered by update, but let's also allow admin to insert answers)
