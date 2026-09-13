-- Site settings table: stores all configurable site-wide settings as key-value pairs
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (public info like site name, phone, etc.)
CREATE POLICY "read_settings_public" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

-- Only admins can modify settings
CREATE POLICY "admin_insert_settings" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_settings" ON site_settings FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_settings" ON site_settings FOR DELETE
  TO authenticated USING (is_admin());

-- Seed default settings
INSERT INTO site_settings (key, value) VALUES
  ('site_info', '{"site_name":"ماموت شاپ","site_url":"https://mammoth-shop.ir","site_email":"support@mammoth-shop.ir","site_phone":"۰۲۱-۹۱۰۱۰۱۰۱","site_address":"تهران، خیابان ولیعصر، برج ماموت، طبقه ۸","site_tagline":"فروشگاه آنلاین لوازم دیجیتال","site_description":"ماموت شاپ - خرید آنلاین موبایل، لپ تاپ، لوازم خانگی و گیمینگ با بهترین قیمت، ضمانت اصالت کالا و ارسال سریع به سراسر کشور"}'),
  ('social_links', '{"instagram":"","telegram":"","whatsapp":"","twitter":"","facebook":"","youtube":"","linkedin":"","aparat":""}'),
  ('shipping', '{"free_shipping_threshold":5000000,"shipping_cost":150000}'),
  ('payment', '{"gateway":"zarinpal","merchant_id":"","callback_url":"","sandbox":true}'),
  ('appearance', '{"primary_color":"#1566e1","show_bestsellers":true,"show_flash_sale":true,"show_discounted":true,"hero_title":"ماموت شاپ","hero_subtitle":"فروشگاه آنلاین لوازم دیجیتال"}'),
  ('notifications', '{"order_notifications":true,"stock_alerts":true,"review_moderation":true,"sms_notifications":false}')
ON CONFLICT (key) DO NOTHING;

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  authority TEXT,
  ref_id TEXT,
  amount BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','redirected')),
  gateway TEXT NOT NULL DEFAULT 'zarinpal',
  tracking_code TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_payments" ON payment_transactions FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "insert_own_payments" ON payment_transactions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY "admin_update_payments" ON payment_transactions FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_payments" ON payment_transactions FOR DELETE
  TO authenticated USING (is_admin());

-- Add updated_at trigger for payment_transactions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
