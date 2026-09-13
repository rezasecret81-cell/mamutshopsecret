-- Allow admins to read all profiles
CREATE POLICY "admin_read_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to update any profile (for granting/revoking admin)
CREATE POLICY "admin_update_all_profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to read all orders (for admin panel)
CREATE POLICY "admin_read_all_orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to update any order status
CREATE POLICY "admin_update_all_orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to read all tickets
CREATE POLICY "admin_read_all_tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to read all ticket replies
CREATE POLICY "admin_read_all_ticket_replies"
  ON ticket_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ticket_replies tr
      JOIN tickets t ON t.id = tr.ticket_id
      WHERE tr.id = ticket_replies.id AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
        )
      )
    )
  );
