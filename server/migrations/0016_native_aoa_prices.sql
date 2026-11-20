-- GameAO: os campos históricos *_usd do catálogo passam a representar valores nativos em AOA/Kz.
-- Não há conversão de dados: o valor introduzido no painel é o valor cobrado.
COMMENT ON COLUMN catalog_products.base_price_usd IS 'Preço nativo em AOA/Kz; nome legado mantido para compatibilidade.';
COMMENT ON COLUMN catalog_products.sale_price_usd IS 'Preço promocional nativo em AOA/Kz; nome legado mantido para compatibilidade.';
COMMENT ON COLUMN product_variants.price_usd IS 'Preço nativo em AOA/Kz; nome legado mantido para compatibilidade.';
COMMENT ON COLUMN product_variants.original_price_usd IS 'Preço original nativo em AOA/Kz; nome legado mantido para compatibilidade.';
