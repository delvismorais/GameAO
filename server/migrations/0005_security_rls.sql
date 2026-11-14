-- GameAO security baseline
-- The application backend uses the database owner connection and remains responsible
-- for authentication and authorization. Public Supabase roles receive only the
-- minimum read access needed for catalog/content discovery.

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_active_categories ON catalog_categories;
CREATE POLICY public_read_active_categories
  ON catalog_categories FOR SELECT TO anon, authenticated
  USING (is_active = 1);

DROP POLICY IF EXISTS public_read_active_products ON catalog_products;
CREATE POLICY public_read_active_products
  ON catalog_products FOR SELECT TO anon, authenticated
  USING (is_active = 1);

DROP POLICY IF EXISTS public_read_product_categories ON catalog_product_categories;
CREATE POLICY public_read_product_categories
  ON catalog_product_categories FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM catalog_products p
    WHERE p.id = product_id AND p.is_active = 1
  ));

DROP POLICY IF EXISTS public_read_published_posts ON content_posts;
CREATE POLICY public_read_published_posts
  ON content_posts FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS public_read_active_banners ON site_banners;
CREATE POLICY public_read_active_banners
  ON site_banners FOR SELECT TO anon, authenticated
  USING (
    is_active = 1
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

-- Deliberately no public policies for users, sessions, settings, orders,
-- order items/history, payments, audit logs, invoices, notifications,
-- payment methods or payment proofs. This prevents Supabase public roles from
-- reading credentials, receiving data, customer records or financial evidence.
