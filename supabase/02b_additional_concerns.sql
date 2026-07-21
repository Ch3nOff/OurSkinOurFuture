-- ============================================================
-- ADDITIONAL CONCERNS — run this after 02_seed_data.sql
-- This adds the remaining 4 concerns your app can detect:
--   acne, pores, dark-circles, moisture
-- ============================================================

-- Additional concerns
insert into skin_concerns (slug, display_name, description, source_api_key, display_order) values
    ('acne-inflammation', 'Acne & Inflammation', 'Active breakouts, bumps, or inflammation', 'acne_score', 5),
    ('pores', 'Pores', 'Visible pore size or congestion', 'pore_score', 6),
    ('dark-circles', 'Dark Circles', 'Dark circles or under-eye dullness', 'dark_circle_score', 7),
    ('moisture', 'Moisture', 'Hydration level — dryness vs. balanced', 'moisture_score', 8)
on conflict (slug) do nothing;

-- Additional ingredients for these concerns
insert into ingredients (slug, display_name, inci_name, aliases, description, caution_note, pregnancy_safe) values
    ('salicylic-acid', 'Salicylic Acid (BHA)', 'Salicylic Acid', array['BHA'],
        'Oil-soluble exfoliant that clears pores and reduces breakouts.',
        'Can be drying; start with 2-3x per week.', false),
    ('zinc-oxide-spf', 'Zinc Oxide (SPF)', 'Zinc Oxide', array['Mineral Sunscreen'],
        'Mineral sunscreen — protects against spots and aging.',
        'Reapply every 2 hours in direct sun.', true),
    ('hyaluronic-acid', 'Hyaluronic Acid', 'Sodium Hyaluronate', array['HA'],
        'Hydration hero — draws moisture into the skin.',
        'Apply to damp skin for best results; may feel sticky in humid climates.', true)
on conflict (slug) do nothing;

-- Concern-ingredient links for new concerns
insert into concern_ingredients (concern_id, ingredient_id, relevance_score, evidence_note)
select c.id, i.id, v.score, v.note
from (values
    ('acne-inflammation', 'salicylic-acid', 92, 'Oil-soluble BHA clears clogged pores and reduces inflammatory acne.'),
    ('acne-inflammation', 'niacinamide', 85, 'Calms redness and regulates sebum production.'),
    ('acne-inflammation', 'centella-asiatica', 70, 'Gentle anti-inflammatory; good for sensitive acne-prone skin.'),
    ('acne-inflammation', 'zinc-oxide-spf', 60, 'Zinc has mild anti-inflammatory properties; SPF prevents post-acne marks.'),
    ('pores', 'salicylic-acid', 90, 'Dissolves sebum inside pores for a smoother look.'),
    ('pores', 'niacinamide', 85, 'Regulates oil and visibly tightens pore appearance.'),
    ('pores', 'retinol', 75, 'Increases cell turnover so pores stay clear.'),
    ('pores', 'hyaluronic-acid', 60, 'Hydration keeps skin supple; dry skin makes pores look larger.'),
    ('dark-circles', 'vitamin-c', 90, 'Brightens under-eye pigmentation over 4-8 weeks.'),
    ('dark-circles', 'niacinamide', 85, 'Improves microcirculation and lightens dark circles.'),
    ('dark-circles', 'peptide-complex', 75, 'Firms thin under-eye skin to reduce shadow appearance.'),
    ('dark-circles', 'hyaluronic-acid', 60, 'Plumps under-eye area to reduce hollow shadow.'),
    ('moisture', 'hyaluronic-acid', 95, 'Draws and holds moisture — plumps dry skin.'),
    ('moisture', 'squalane', 90, 'Mimics natural sebum — lightweight, non-greasy hydration.'),
    ('moisture', 'ceramide', 85, 'Repairs barrier so moisture stays locked in.'),
    ('moisture', 'zinc-oxide-spf', 70, 'Protects from moisture loss caused by UV damage.')
) as v(concern_slug, ingredient_slug, score, note)
join skin_concerns c on c.slug = v.concern_slug
join ingredients i on i.slug = v.ingredient_slug
on conflict (concern_id, ingredient_id) do nothing;

-- Additional products for new concerns
insert into products (brand_id, slug, name, product_type, description, tier, price_usd_cents, is_active) values
    ((select id from brands where slug = 'the-ordinary'),   'ordinary-niacinamide-10',  'Niacinamide 10% + Zinc 1%',             'serum',       'Multi-tasking serum for redness, pores, and tone.', 'good', 680, true),
    ((select id from brands where slug = 'the-ordinary'),   'ordinary-ha',              'Hyaluronic Acid 2% + B5',               'serum',       'Hydration serum for dry skin and under-eye plumping.', 'good', 720, true),
    ((select id from brands where slug = 'the-ordinary'),   'ordinary-bha',             'Salicylic Acid 2% Solution',             'exfoliant',   'BHA exfoliant for acne-prone skin and clogged pores.', 'good', 580, true),
    ((select id from brands where slug = 'paulas-choice'),  'pc-2pct-bha',              '2% BHA Liquid Exfoliant',                'exfoliant',   'Cult-favorite BHA for pores and breakouts.', 'better', 3200, true),
    ((select id from brands where slug = 'the-ordinary'),   'ordinary-squalane',        '100% Squalane Oil',                      'oil',         'Lightweight moisture mimic for dry skin.', 'good', 800, true),
    ((select id from brands where slug = 'cerave'),         'cerave-moisturizer',      'Moisturizing Cream',                     'moisturizer', 'Ceramide-based barrier repair for dry skin.', 'good', 1600, true),
    ((select id from brands where slug = 'supergoop'),      'supergoop-unseen',        'Unseen Sunscreen SPF 40',                'sunscreen',   'Invisible mineral SPF — protects against moisture loss and spots.', 'better', 2200, true)
on conflict (slug) do nothing;

-- Product-ingredient links for new products
insert into product_ingredients (product_id, ingredient_id, is_headline_ingredient)
select p.id, i.id, true
from (values
    ('ordinary-niacinamide-10', 'niacinamide'),
    ('ordinary-ha', 'hyaluronic-acid'),
    ('ordinary-bha', 'salicylic-acid'),
    ('pc-2pct-bha', 'salicylic-acid'),
    ('ordinary-squalane', 'squalane'),
    ('cerave-moisturizer', 'ceramide'),
    ('supergoop-unseen', 'zinc-oxide-spf')
) as v(product_slug, ingredient_slug)
join products p on p.slug = v.product_slug
join ingredients i on i.slug = v.ingredient_slug
on conflict (product_id, ingredient_id) do nothing;

-- Product availability for new products (US)
insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved)
select p.id, 'US', v.retailer, v.url, v.price_cents, v.currency, true
from (values
    ('ordinary-niacinamide-10', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 680, 'USD'),
    ('ordinary-ha', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 720, 'USD'),
    ('ordinary-bha', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 580, 'USD'),
    ('pc-2pct-bha', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 3200, 'USD'),
    ('ordinary-squalane', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 800, 'USD'),
    ('cerave-moisturizer', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 1600, 'USD'),
    ('supergoop-unseen', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 2200, 'USD')
) as v(product_slug, retailer, url, price_cents, currency)
join products p on p.slug = v.product_slug
on conflict (product_id, country_code, retailer) do nothing;
