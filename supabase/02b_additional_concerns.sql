-- ============================================================
-- 02b_additional_concerns.sql — additional concerns + products
-- Run after 02_seed_data.sql
-- Matches 01_schema.sql columns.
-- ============================================================

-- Additional concerns
insert into skin_concerns (slug, display_name, description, source_api_key, display_order) values
    ('acne-inflammation', 'Acne & Inflammation', 'Active breakouts, bumps, or inflammation', 'acne_score', 5),
    ('pores', 'Pores', 'Visible pore size or congestion', 'pore_score', 6),
    ('dark-circles', 'Dark Circles', 'Dark circles or under-eye dullness', 'dark_circle_score', 7),
    ('moisture', 'Moisture', 'Hydration level — dryness vs. balanced', 'moisture_score', 8)
on conflict (slug) do nothing;

-- Additional ingredients
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

-- Concern-ingredient links
insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, v.rn, v.note
from (values
    ('acne-inflammation', 'salicylic-acid', 1, 'Oil-soluble BHA clears clogged pores and reduces inflammatory acne.'),
    ('acne-inflammation', 'niacinamide',     2, 'Calms redness and regulates sebum production.'),
    ('acne-inflammation', 'centella-asiatica', 3, 'Gentle anti-inflammatory; good for sensitive acne-prone skin.'),
    ('acne-inflammation', 'zinc-oxide-spf',  4, 'Zinc has mild anti-inflammatory properties; SPF prevents post-acne marks.'),
    ('pores',             'salicylic-acid', 1, 'Dissolves sebum inside pores for a smoother look.'),
    ('pores',             'niacinamide',     2, 'Regulates oil and visibly tightens pore appearance.'),
    ('pores',             'retinol',         3, 'Increases cell turnover so pores stay clear.'),
    ('pores',             'hyaluronic-acid', 4, 'Hydration keeps skin supple; dry skin makes pores look larger.'),
    ('dark-circles',      'vitamin-c',       1, 'Brightens under-eye pigmentation over 4-8 weeks.'),
    ('dark-circles',      'niacinamide',     2, 'Improves microcirculation and lightens dark circles.'),
    ('dark-circles',      'peptide-complex', 3, 'Firms thin under-eye skin to reduce shadow appearance.'),
    ('dark-circles',      'hyaluronic-acid', 4, 'Plumps under-eye area to reduce hollow shadow.'),
    ('moisture',          'hyaluronic-acid', 1, 'Draws and holds moisture — plumps dry skin.'),
    ('moisture',          'squalane',        2, 'Mimics natural sebum — lightweight, non-greasy hydration.'),
    ('moisture',          'ceramides',       3, 'Repairs barrier so moisture stays locked in.'),
    ('moisture',          'zinc-oxide-spf',  4, 'Protects from moisture loss caused by UV damage.')
) as v(concern_slug, ingredient_slug, rn, note)
join skin_concerns c on c.slug = v.concern_slug
join ingredients i on i.slug = v.ingredient_slug
on conflict (concern_id, ingredient_id) do nothing;

-- Products for new concerns
insert into products (slug, name, brand_id, product_type, description, tier, is_active)
select p.* from (values
  ('ordinary-niacinamide-10',  'Niacinamide 10% + Zinc 1%',             'the-ordinary',     'serum',       'Multi-tasking serum for redness, pores, and tone.', 'good', true),
  ('ordinary-ha',              'Hyaluronic Acid 2% + B5',               'the-ordinary',     'serum',       'Hydration serum for dry skin and under-eye plumping.', 'good', true),
  ('ordinary-bha',             'Salicylic Acid 2% Solution',             'the-ordinary',     'exfoliant',   'BHA exfoliant for acne-prone skin and clogged pores.', 'good', true),
  ('pc-2pct-bha',              '2% BHA Liquid Exfoliant',                'paulas-choice',    'exfoliant',   'Cult-favorite BHA for pores and breakouts.', 'better', true),
  ('ordinary-squalane',        '100% Squalane Oil',                      'the-ordinary',     'oil',         'Lightweight moisture mimic for dry skin.', 'good', true),
  ('cerave-moisturizer',       'Moisturizing Cream',                     'cerave',           'moisturizer', 'Ceramide-based barrier repair for dry skin.', 'good', true),
  ('supergoop-unseen',         'Unseen Sunscreen SPF 40',                'supergoop',        'sunscreen',   'Invisible mineral SPF — protects against moisture loss and spots.', 'better', true)
) as p(slug, name, brand_slug, product_type, description, tier, is_active)
join brands b on b.slug = p.brand_slug
on conflict (slug) do nothing;

-- Product-ingredient links
insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, x.conc, x.rn
from (values
    ('ordinary-niacinamide-10', 'niacinamide',       10, 1),
    ('ordinary-niacinamide-10', 'zinc-oxide-spf',    1,  2),
    ('ordinary-ha',             'hyaluronic-acid',   2,  1),
    ('ordinary-bha',            'salicylic-acid',    2,  1),
    ('pc-2pct-bha',             'salicylic-acid',    2,  1),
    ('ordinary-squalane',       'squalane',          100, 1),
    ('cerave-moisturizer',      'ceramides',          null, 1),
    ('supergoop-unseen',        'zinc-oxide-spf',    null, 1)
) as x(prod, islug, conc, rn)
join products p on p.slug = x.prod
join ingredients i on i.slug = x.islug
on conflict (product_id, ingredient_id) do nothing;

-- Availability for new products
insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, 'US', v.retailer, v.url, v.cents, 'USD', true, true
from (values
    ('ordinary-niacinamide-10', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 680),
    ('ordinary-ha',             'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 720),
    ('ordinary-bha',            'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 580),
    ('pc-2pct-bha',             'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 3200),
    ('ordinary-squalane',       'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 800),
    ('cerave-moisturizer',      'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 1600),
    ('supergoop-unseen',        'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 2200)
) as v(product_slug, retailer, url, cents)
join products p on p.slug = v.product_slug
on conflict (product_id, country_code, retailer) do nothing;
