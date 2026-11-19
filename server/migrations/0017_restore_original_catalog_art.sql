-- Restore only catalog artwork still pointing at the exact generated image; preserve later admin edits.
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/100-diamantes-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/100-diamantes-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_card_url END
WHERE slug = '100-diamantes-free-fire' AND (image_url = '/assets/catalog/100-diamantes-free-fire.jpg' OR image_card_url = '/assets/catalog/100-diamantes-free-fire.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/310-diamantes-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/310-diamantes-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_card_url END
WHERE slug = '310-diamantes-free-fire' AND (image_url = '/assets/catalog/310-diamantes-free-fire.jpg' OR image_card_url = '/assets/catalog/310-diamantes-free-fire.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/520-diamantes-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/520-diamantes-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_card_url END
WHERE slug = '520-diamantes-free-fire' AND (image_url = '/assets/catalog/520-diamantes-free-fire.jpg' OR image_card_url = '/assets/catalog/520-diamantes-free-fire.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/1060-diamantes-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/1060-diamantes-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_card_url END
WHERE slug = '1060-diamantes-free-fire' AND (image_url = '/assets/catalog/1060-diamantes-free-fire.jpg' OR image_card_url = '/assets/catalog/1060-diamantes-free-fire.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/2180-diamantes-no-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/2180-diamantes-no-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_card_url END
WHERE slug = '2180-diamantes-no-free-fire' AND (image_url = '/assets/catalog/2180-diamantes-no-free-fire.jpg' OR image_card_url = '/assets/catalog/2180-diamantes-no-free-fire.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/5600-diamantes-no-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/5600-diamantes-no-free-fire.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_card_url END
WHERE slug = '5600-diamantes-no-free-fire' AND (image_url = '/assets/catalog/5600-diamantes-no-free-fire.jpg' OR image_card_url = '/assets/catalog/5600-diamantes-no-free-fire.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/promocao-de-200-dimas.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/promocao-de-200-dimas.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_card_url END
WHERE slug = 'promocao-de-200-dimas' AND (image_url = '/assets/catalog/promocao-de-200-dimas.jpg' OR image_card_url = '/assets/catalog/promocao-de-200-dimas.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/assinatura-semanal-ff.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/assinatura-semanal-ff.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_card_url END
WHERE slug = 'assinatura-semanal-ff' AND (image_url = '/assets/catalog/assinatura-semanal-ff.jpg' OR image_card_url = '/assets/catalog/assinatura-semanal-ff.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/assinatura-mensal-ff.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/assinatura-mensal-ff.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_card_url END
WHERE slug = 'assinatura-mensal-ff' AND (image_url = '/assets/catalog/assinatura-mensal-ff.jpg' OR image_card_url = '/assets/catalog/assinatura-mensal-ff.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/assinatura-economica-ff.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/assinatura-economica-ff.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_card_url END
WHERE slug = 'assinatura-economica-ff' AND (image_url = '/assets/catalog/assinatura-economica-ff.jpg' OR image_card_url = '/assets/catalog/assinatura-economica-ff.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/armas-evolutivas-por-3-dias.jpg' THEN '/assets/catalog/freefire-weapons.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/armas-evolutivas-por-3-dias.jpg' THEN '/assets/catalog/freefire-weapons.jpg' ELSE image_card_url END
WHERE slug = 'armas-evolutivas-por-3-dias' AND (image_url = '/assets/catalog/armas-evolutivas-por-3-dias.jpg' OR image_card_url = '/assets/catalog/armas-evolutivas-por-3-dias.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/armas-evolutivas-7-dias.jpg' THEN '/assets/catalog/freefire-weapons.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/armas-evolutivas-7-dias.jpg' THEN '/assets/catalog/freefire-weapons.jpg' ELSE image_card_url END
WHERE slug = 'armas-evolutivas-7-dias' AND (image_url = '/assets/catalog/armas-evolutivas-7-dias.jpg' OR image_card_url = '/assets/catalog/armas-evolutivas-7-dias.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/armas-evolutivas-por-30-dias.jpg' THEN '/assets/catalog/freefire-weapons.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/armas-evolutivas-por-30-dias.jpg' THEN '/assets/catalog/freefire-weapons.jpg' ELSE image_card_url END
WHERE slug = 'armas-evolutivas-por-30-dias' AND (image_url = '/assets/catalog/armas-evolutivas-por-30-dias.jpg' OR image_card_url = '/assets/catalog/armas-evolutivas-por-30-dias.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/passe-booyah.jpg' THEN '/assets/catalog/freefire-pass-codes.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/passe-booyah.jpg' THEN '/assets/catalog/freefire-pass-codes.jpg' ELSE image_card_url END
WHERE slug = 'passe-booyah' AND (image_url = '/assets/catalog/passe-booyah.jpg' OR image_card_url = '/assets/catalog/passe-booyah.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/codiguin-snicker.jpg' THEN '/assets/catalog/freefire-pass-codes.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/codiguin-snicker.jpg' THEN '/assets/catalog/freefire-pass-codes.jpg' ELSE image_card_url END
WHERE slug = 'codiguin-snicker' AND (image_url = '/assets/catalog/codiguin-snicker.jpg' OR image_card_url = '/assets/catalog/codiguin-snicker.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/psvita.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/psvita.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_card_url END
WHERE slug = 'psvita' AND (image_url = '/assets/catalog/psvita.jpg' OR image_card_url = '/assets/catalog/psvita.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/desbloqueio-psvita.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/desbloqueio-psvita.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_card_url END
WHERE slug = 'desbloqueio-psvita' AND (image_url = '/assets/catalog/desbloqueio-psvita.jpg' OR image_card_url = '/assets/catalog/desbloqueio-psvita.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/jogos-xbox.jpg' THEN '/assets/catalog/freefire-weapons.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/jogos-xbox.jpg' THEN '/assets/catalog/freefire-weapons.jpg' ELSE image_card_url END
WHERE slug = 'jogos-xbox' AND (image_url = '/assets/catalog/jogos-xbox.jpg' OR image_card_url = '/assets/catalog/jogos-xbox.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/fc-26-ps4-ps5.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/fc-26-ps4-ps5.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_card_url END
WHERE slug = 'fc-26-ps4-ps5' AND (image_url = '/assets/catalog/fc-26-ps4-ps5.jpg' OR image_card_url = '/assets/catalog/fc-26-ps4-ps5.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/call-of-duty-modern-warfare.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/call-of-duty-modern-warfare.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_card_url END
WHERE slug = 'call-of-duty-modern-warfare' AND (image_url = '/assets/catalog/call-of-duty-modern-warfare.jpg' OR image_card_url = '/assets/catalog/call-of-duty-modern-warfare.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/god-of-war-ps4-ps5.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/god-of-war-ps4-ps5.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_card_url END
WHERE slug = 'god-of-war-ps4-ps5' AND (image_url = '/assets/catalog/god-of-war-ps4-ps5.jpg' OR image_card_url = '/assets/catalog/god-of-war-ps4-ps5.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/jogos-digital-ps4ps5.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/jogos-digital-ps4ps5.jpg' THEN '/assets/catalog/freefire-catalog.jpg' ELSE image_card_url END
WHERE slug = 'jogos-digital-ps4ps5' AND (image_url = '/assets/catalog/jogos-digital-ps4ps5.jpg' OR image_card_url = '/assets/catalog/jogos-digital-ps4ps5.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/canva-pro-30-dias.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/canva-pro-30-dias.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_card_url END
WHERE slug = 'canva-pro-30-dias' AND (image_url = '/assets/catalog/canva-pro-30-dias.jpg' OR image_card_url = '/assets/catalog/canva-pro-30-dias.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/robux.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/robux.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_card_url END
WHERE slug = 'robux' AND (image_url = '/assets/catalog/robux.jpg' OR image_card_url = '/assets/catalog/robux.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/robux-gif-card.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/robux-gif-card.jpg' THEN '/assets/catalog/freefire-diamonds.jpg' ELSE image_card_url END
WHERE slug = 'robux-gif-card' AND (image_url = '/assets/catalog/robux-gif-card.jpg' OR image_card_url = '/assets/catalog/robux-gif-card.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/luvinha-gamer.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/luvinha-gamer.jpg' THEN '/assets/catalog/freefire-subscriptions.jpg' ELSE image_card_url END
WHERE slug = 'luvinha-gamer' AND (image_url = '/assets/catalog/luvinha-gamer.jpg' OR image_card_url = '/assets/catalog/luvinha-gamer.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/products/forza-horizon-5.jpg' THEN '/assets/products/game-1.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/products/forza-horizon-5.jpg' THEN '/assets/products/game-1-card.jpg' ELSE image_card_url END
WHERE slug = 'forza-horizon-5' AND (image_url = '/assets/products/forza-horizon-5.jpg' OR image_card_url = '/assets/products/forza-horizon-5.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/products/call-of-duty-black-ops.jpg' THEN '/assets/products/game-2.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/products/call-of-duty-black-ops.jpg' THEN '/assets/products/game-2-card.jpg' ELSE image_card_url END
WHERE slug = 'call-of-duty-black-ops' AND (image_url = '/assets/products/call-of-duty-black-ops.jpg' OR image_card_url = '/assets/products/call-of-duty-black-ops.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/products/final-fantasy-vii-remake.jpg' THEN '/assets/products/game-11.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/products/final-fantasy-vii-remake.jpg' THEN '/assets/products/game-11-card.jpg' ELSE image_card_url END
WHERE slug = 'final-fantasy-vii-remake' AND (image_url = '/assets/products/final-fantasy-vii-remake.jpg' OR image_card_url = '/assets/products/final-fantasy-vii-remake.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/products/motocross-2020.jpg' THEN '/assets/products/game-12.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/products/motocross-2020.jpg' THEN '/assets/products/game-12-card.jpg' ELSE image_card_url END
WHERE slug = 'motocross-2020' AND (image_url = '/assets/products/motocross-2020.jpg' OR image_card_url = '/assets/products/motocross-2020.jpg');
UPDATE catalog_products
SET image_url = CASE WHEN image_url = '/assets/catalog/contas-free-fire-blue-lock.jpg' THEN '/assets/catalog/freefire-accounts.jpg' ELSE image_url END,
    image_card_url = CASE WHEN image_card_url = '/assets/catalog/contas-free-fire-blue-lock.jpg' THEN '/assets/catalog/freefire-accounts.jpg' ELSE image_card_url END
WHERE slug = 'contas-free-fire-blue-lock' AND (image_url = '/assets/catalog/contas-free-fire-blue-lock.jpg' OR image_card_url = '/assets/catalog/contas-free-fire-blue-lock.jpg');
