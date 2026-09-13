/*
# تابع افزایش تعداد استفاده کد تخفیف

1. توابع جدید
- `increment_coupon_usage(coupon_id uuid)`: استفاده از کد تخفیف
- `increment_coupon_usage` variant that accepts the coupon code text
*/

DROP FUNCTION IF EXISTS public.increment_coupon_usage(uuid);
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id uuid)
RETURNS void AS $$
  UPDATE coupons SET used_count = used_count + 1
  WHERE id = coupon_id;
$$ LANGUAGE sql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.increment_coupon_usage_text(text);
CREATE OR REPLACE FUNCTION public.increment_coupon_usage_text(code_text text)
RETURNS void AS $$
  UPDATE coupons SET used_count = used_count + 1
  WHERE code = code_text;
$$ LANGUAGE sql SECURITY DEFINER;
