-- Enhance brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add shipping fields to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS length DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_class TEXT DEFAULT 'standard';
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_number TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS country_of_origin TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create index for brand search
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);

-- Create indexes for product filtering
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_review_count ON products(review_count DESC);

-- Update trigger for brands updated_at
CREATE OR REPLACE FUNCTION update_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_brands_updated_at ON brands;
CREATE TRIGGER trigger_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_brands_updated_at();

-- Enhance chat system with more fields
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS unread_admin INTEGER DEFAULT 0;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS unread_user INTEGER DEFAULT 0;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Create chat typing indicators table
CREATE TABLE IF NOT EXISTS chat_typing (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- Enable RLS on chat_typing
ALTER TABLE chat_typing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_typing" ON chat_typing
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));