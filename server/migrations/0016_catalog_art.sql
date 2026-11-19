-- 0016_catalog_art.sql
-- Substitui as artes genéricas repetidas por arte própria de cada produto.
-- As condições garantem idempotência: nunca sobrepõem uma imagem alterada no admin.

UPDATE catalog_products
SET image_url = '/assets/catalog/100-diamantes-free-fire.jpg', image_card_url = '/assets/catalog/100-diamantes-free-fire.jpg'
WHERE slug = '100-diamantes-free-fire'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/310-diamantes-free-fire.jpg', image_card_url = '/assets/catalog/310-diamantes-free-fire.jpg'
WHERE slug = '310-diamantes-free-fire'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/520-diamantes-free-fire.jpg', image_card_url = '/assets/catalog/520-diamantes-free-fire.jpg'
WHERE slug = '520-diamantes-free-fire'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/1060-diamantes-free-fire.jpg', image_card_url = '/assets/catalog/1060-diamantes-free-fire.jpg'
WHERE slug = '1060-diamantes-free-fire'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/2180-diamantes-no-free-fire.jpg', image_card_url = '/assets/catalog/2180-diamantes-no-free-fire.jpg'
WHERE slug = '2180-diamantes-no-free-fire'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/5600-diamantes-no-free-fire.jpg', image_card_url = '/assets/catalog/5600-diamantes-no-free-fire.jpg'
WHERE slug = '5600-diamantes-no-free-fire'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/promocao-de-200-dimas.jpg', image_card_url = '/assets/catalog/promocao-de-200-dimas.jpg'
WHERE slug = 'promocao-de-200-dimas'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/assinatura-semanal-ff.jpg', image_card_url = '/assets/catalog/assinatura-semanal-ff.jpg'
WHERE slug = 'assinatura-semanal-ff'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/assinatura-mensal-ff.jpg', image_card_url = '/assets/catalog/assinatura-mensal-ff.jpg'
WHERE slug = 'assinatura-mensal-ff'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/assinatura-economica-ff.jpg', image_card_url = '/assets/catalog/assinatura-economica-ff.jpg'
WHERE slug = 'assinatura-economica-ff'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/armas-evolutivas-por-3-dias.jpg', image_card_url = '/assets/catalog/armas-evolutivas-por-3-dias.jpg'
WHERE slug = 'armas-evolutivas-por-3-dias'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/armas-evolutivas-7-dias.jpg', image_card_url = '/assets/catalog/armas-evolutivas-7-dias.jpg'
WHERE slug = 'armas-evolutivas-7-dias'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/armas-evolutivas-por-30-dias.jpg', image_card_url = '/assets/catalog/armas-evolutivas-por-30-dias.jpg'
WHERE slug = 'armas-evolutivas-por-30-dias'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/passe-booyah.jpg', image_card_url = '/assets/catalog/passe-booyah.jpg'
WHERE slug = 'passe-booyah'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/codiguin-snicker.jpg', image_card_url = '/assets/catalog/codiguin-snicker.jpg'
WHERE slug = 'codiguin-snicker'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/psvita.jpg', image_card_url = '/assets/catalog/psvita.jpg'
WHERE slug = 'psvita'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/desbloqueio-psvita.jpg', image_card_url = '/assets/catalog/desbloqueio-psvita.jpg'
WHERE slug = 'desbloqueio-psvita'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/jogos-xbox.jpg', image_card_url = '/assets/catalog/jogos-xbox.jpg'
WHERE slug = 'jogos-xbox'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/fc-26-ps4-ps5.jpg', image_card_url = '/assets/catalog/fc-26-ps4-ps5.jpg'
WHERE slug = 'fc-26-ps4-ps5'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/call-of-duty-modern-warfare.jpg', image_card_url = '/assets/catalog/call-of-duty-modern-warfare.jpg'
WHERE slug = 'call-of-duty-modern-warfare'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/god-of-war-ps4-ps5.jpg', image_card_url = '/assets/catalog/god-of-war-ps4-ps5.jpg'
WHERE slug = 'god-of-war-ps4-ps5'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/jogos-digital-ps4ps5.jpg', image_card_url = '/assets/catalog/jogos-digital-ps4ps5.jpg'
WHERE slug = 'jogos-digital-ps4ps5'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/canva-pro-30-dias.jpg', image_card_url = '/assets/catalog/canva-pro-30-dias.jpg'
WHERE slug = 'canva-pro-30-dias'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/robux.jpg', image_card_url = '/assets/catalog/robux.jpg'
WHERE slug = 'robux'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/robux-gif-card.jpg', image_card_url = '/assets/catalog/robux-gif-card.jpg'
WHERE slug = 'robux-gif-card'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/catalog/luvinha-gamer.jpg', image_card_url = '/assets/catalog/luvinha-gamer.jpg'
WHERE slug = 'luvinha-gamer'
  AND (image_url LIKE '/assets/catalog/freefire-%' OR image_url IS NULL OR image_url = '');

UPDATE catalog_products
SET image_url = '/assets/products/forza-horizon-5.jpg', image_card_url = '/assets/products/forza-horizon-5.jpg'
WHERE slug = 'forza-horizon-5'
  AND image_url = '/assets/products/game-1.jpg';

UPDATE catalog_products
SET image_url = '/assets/products/call-of-duty-black-ops.jpg', image_card_url = '/assets/products/call-of-duty-black-ops.jpg'
WHERE slug = 'call-of-duty-black-ops'
  AND image_url = '/assets/products/game-2.jpg';

UPDATE catalog_products
SET image_url = '/assets/products/final-fantasy-vii-remake.jpg', image_card_url = '/assets/products/final-fantasy-vii-remake.jpg'
WHERE slug = 'final-fantasy-vii-remake'
  AND image_url = '/assets/products/game-11.jpg';

UPDATE catalog_products
SET image_url = '/assets/products/motocross-2020.jpg', image_card_url = '/assets/products/motocross-2020.jpg'
WHERE slug = 'motocross-2020'
  AND image_url = '/assets/products/game-12.jpg';
