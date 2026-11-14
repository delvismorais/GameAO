ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_media_public ON media_library;
CREATE POLICY public_read_media_public ON media_library FOR SELECT TO anon, authenticated USING (visibility = 'public');
