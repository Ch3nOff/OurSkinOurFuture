-- ============================================================
-- 02b_additional_concerns.sql — additional concerns + products
-- Run after 02_seed_data.sql
-- Matches the schema in 01_schema.sql
-- ============================================================

-- Additional concerns
insert into skin_concerns (slug, label, description, source_api_key, display_order) values
    ('acne-inflammation', 'Acne & Inflammation', 'Active breakouts, bumps, or inflammation', 'acne_score', 5),
    ('pores', 'Pores', 'Visible pore size or congestion', 'pore_score', 6),
    ('dark-circles', 'Dark Circles', 'Dark circles or under-eye dullness', 'dark_circle_score', 7),
    ('moisture', 'Moisture', 'Hydration level — dryness vs. balanced', 'moisture_score', 8)
on conflict (slug) do nothing;

-- Additional ingredients for these concerns
insert into ingredients (slug, label, inci_name, aliases, description, caution_note, pregnancy_safe) values
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
insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, v.rank, v.note
from (values
    ('acne-inflammation', 'salicylic-acid', 1, 'Oil-soluble BHA clears clogged pores and reduces inflammatory acne.'),
    ('acne-inflammation', 'niacinamide', 2, 'Calms redness and regulates sebum production.'),
    ('acne-inflammation', 'centella-asiatica', 3, 'Gentle anti-inflammatory; good for sensitive acne-prone skin.'),
    ('acne-inflammation', 'zinc-oxide-spf', 4, 'Zinc has mild anti-inflammatory properties; SPF prevents post-acne marks.'),
    ('pores', 'salicylic-acid', 1, 'Dissolves sebum inside pores for a smoother look.'),
    ('pores', 'niacinamide', 2, 'Regulates oil and visibly tightens pore appearance.'),
    ('pores', 'retinol', 3, 'Increases cell turnover so pores stay clear.'),
    ('pores', 'hyaluronic-acid', 4, 'Hydration keeps skin supple; dry skin makes pores look larger.'),
    ('dark-circles', 'vitamin-c', 1, 'Brightens under-eye pigmentation over 4-8 weeks.'),
    ('dark-circles', 'niacinamide', 2, 'Improves microcirculation and lightens dark circles.'),
    ('dark-circles', 'peptide-complex', 3, 'Firms thin under-eye skin to reduce shadow appearance.'),
    ('dark-circles', 'hyaluronic-acid', 4, 'Plumps under-eye area to reduce hollow shadow.'),
    ('moisture', 'hyaluronic-acid', 1, 'Draws and holds moisture — plumps dry skin.'),
    ('moisture', 'squalane', 2, 'Mimics natural sebum — lightweight, non-greasy hydration.'),
    ('moisture', 'ceramides', 3, 'Repairs barrier so moisture stays locked in.'),
    ('moisture', 'zinc-oxide-spf', 4, 'Protects from moisture loss caused by UV damage.')
) as v(concern_slug, ingredient_slug, rank, note)
join skin_concerns c on c.slug = v.concern_slug
join ingredients i on i.slug = v.ingredient_slug
on conflict (concern_id, ingredient_id) do nothing;

-- Additional products for new concerns
insert into products (slug, name, brand_id, category, subtype, url, country, is_active)
select p.* from (values
  ('ordinary-niacinamide-10',  'Niacinamide 10% + Zinc 1%',             'the-ordinary',     'serum',  'daily',       'https://www.sephora.com/product/niacinamide-10-zinc-1',         'US', true),
  ('ordinary-ha',              'Hyaluronic Acid 2% + B5',               'the-ordinary',     'serum',  'hydrating',   'https://www.sephora.com/product/hyaluronic-acid-2-b5',         'US', true),
  ('ordinary-bha',             'Salicylic Acid 2% Solution',             'the-ordinary',     'exfoliant', 'daily',     'https://www.sephora.com/product/salicylic-acid-2-solution',    'US', true),
  ('pc-2pct-bha',              '2% BHA Liquid Exfoliant',                'paulas-choice',    'exfoliant', 'daily',     'https://www.sephora.com/product/2-bha-liquid-exfoliant',       'US', true),
  ('ordinary-squalane',        '100% Squalane Oil',                      'the-ordinary',     'oil',    'hydrating',   'https://www.sephora.com/product/100-squalane-oil',             'US', true),
  ('cerave-moisturizer',       'Moisturizing Cream',                     'cerave',           'moisturizer', 'daily',   'https://www.sephora.com/product/moisturizing-cream-P123456',  'US', true),
  ('supergoop-unseen',         'Unseen Sunscreen SPF 40',                'supergoop',        'sunscreen', 'daily',     'https://www.sephora.com/product/unseen-sunscreen-spf-40',      'US', true)
) as p(slug, name, brand_slug, category, subtype, url, country, is_active)
join brands b on b.slug = p.brand_slug
on conflict (slug) do nothing;

-- Product-ingredient links for new products
insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, c.conc, rn
from (values
    ('ordinary-niacinamide-10', 'niacinamide',       10,     1),
    ('ordinary-niacinamide-10', 'zinc-oxide-spf',    1,      2),
    ('ordinary-ha',             'hyaluronic-acid',   2,      1),
    ('ordinary-bha',            'salicylic-acid',    2,      1),
    ('pc-2pct-bha',             'salicylic-acid',    2,      1),
    ('ordinary-squalane',       'squalane',          100,    1),
    ('cerave-moisturizer',      'ceramides',          null,   1),
    ('supergoop-unseen',        'zinc-oxide-spf',    null,   1)
) as x(prod, islug, conc, rn)
join products p on p.slug = x.prod
join ingredients i on i.slug = x.islug
on conflict (product_id, ingredient_id) do nothing;

-- Product availability for new products (US)
insert into product_availability (product_id, country_code, in_stock, price, currency, url)
select p.id, 'US', true, v.price, 'USD', v.url
from (values
    ('ordinary-niacinamide-10',  6.80, 'https://www.sephora.com/product/niacinamide-10-zinc-1'),
    ('ordinary-ha',               7.20, 'https://www.sephora.com/product/hyaluronic-acid-2-b5'),
    ('ordinary-bha',              5.80, 'https://www.sephora.com/product/salicylic-acid-2-solution'),
    ('pc-2pct-bha',              32.00, 'https://www.sephora.com/product/2-bha-liquid-exfoliant'),
    ('ordinary-squalane',         8.00, 'https://www.sephora.com/product/100-squalane-oil'),
    ('cerave-moisturizer',       16.99, 'https://www.sephora.com/product/moisturizing-cream-P123456'),
    ('supergoop-unseen',         22.00, 'https://www.sephora.com/product/unseen-sunscreen-spf-40')
) as v(slug, price, url)
join products p on p.slug = v.slug
on conflict (product_id, country_code) do nothing;
