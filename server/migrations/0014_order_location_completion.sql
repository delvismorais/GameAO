-- Completa os dados de localização usados no checkout e nas faturas.
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS billing_country VARCHAR(120);
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(32);

UPDATE shop_orders
SET billing_country = COALESCE(NULLIF(billing_country, ''), 'Angola')
WHERE billing_country IS NULL OR billing_country = '';
