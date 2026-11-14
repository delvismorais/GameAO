ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE freefire_ids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_active_product_variants ON product_variants;
CREATE POLICY public_read_active_product_variants ON product_variants FOR SELECT TO anon, authenticated USING (is_active = 1);
DROP POLICY IF EXISTS public_read_freefire_ids ON freefire_ids;
DROP POLICY IF EXISTS public_write_freefire_ids ON freefire_ids;
