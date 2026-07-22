-- ============================================================
-- 02b_additional_concerns.sql — additional concerns + products
-- Run after 02_seed_data.sql
-- Uses individual SELECT FROM WHERE statements to avoid parser issues.
-- ============================================================

-- ---------- Additional concerns ----------

insert into skin_concerns (slug, display_name, description, source_api_key, display_order) values
    ('acne-inflammation', 'Acne & Inflammation', 'Active breakouts, bumps, or inflammation', 'acne_score', 5),
    ('pores', 'Pores', 'Visible pore size or congestion', 'pore_score', 6),
    ('dark-circles', 'Dark Circles', 'Dark circles or under-eye dullness', 'dark_circle_score', 7),
    ('moisture', 'Moisture', 'Hydration level — dryness vs. balanced', 'moisture_score', 8)
on conflict (slug) do nothing;

-- ---------- Additional ingredients ----------

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

-- ---------- Concern-ingredient links ----------

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 1, 'Oil-soluble BHA clears clogged pores and reduces inflammatory acne.'
from skin_concerns c, ingredients i
where c.slug = 'acne-inflammation' and i.slug = 'salicylic-acid'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 2, 'Calms redness and regulates sebum production.'
from skin_concerns c, ingredients i
where c.slug = 'acne-inflammation' and i.slug = 'niacinamide'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 3, 'Gentle anti-inflammatory; good for sensitive acne-prone skin.'
from skin_concerns c, ingredients i
where c.slug = 'acne-inflammation' and i.slug = 'centella-asiatica'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 4, 'Zinc has mild anti-inflammatory properties; SPF prevents post-acne marks.'
from skin_concerns c, ingredients i
where c.slug = 'acne-inflammation' and i.slug = 'zinc-oxide-spf'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 1, 'Dissolves sebum inside pores for a smoother look.'
from skin_concerns c, ingredients i
where c.slug = 'pores' and i.slug = 'salicylic-acid'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 2, 'Regulates oil and visibly tightens pore appearance.'
from skin_concerns c, ingredients i
where c.slug = 'pores' and i.slug = 'niacinamide'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 3, 'Increases cell turnover so pores stay clear.'
from skin_concerns c, ingredients i
where c.slug = 'pores' and i.slug = 'retinol'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 4, 'Hydration keeps skin supple; dry skin makes pores look larger.'
from skin_concerns c, ingredients i
where c.slug = 'pores' and i.slug = 'hyaluronic-acid'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 1, 'Brightens under-eye pigmentation over 4-8 weeks.'
from skin_concerns c, ingredients i
where c.slug = 'dark-circles' and i.slug = 'vitamin-c'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 2, 'Improves microcirculation and lightens dark circles.'
from skin_concerns c, ingredients i
where c.slug = 'dark-circles' and i.slug = 'niacinamide'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 3, 'Firms thin under-eye skin to reduce shadow appearance.'
from skin_concerns c, ingredients i
where c.slug = 'dark-circles' and i.slug = 'peptide-complex'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 4, 'Plumps under-eye area to reduce hollow shadow.'
from skin_concerns c, ingredients i
where c.slug = 'dark-circles' and i.slug = 'hyaluronic-acid'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 1, 'Draws and holds moisture — plumps dry skin.'
from skin_concerns c, ingredients i
where c.slug = 'moisture' and i.slug = 'hyaluronic-acid'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 2, 'Mimics natural sebum — lightweight, non-greasy hydration.'
from skin_concerns c, ingredients i
where c.slug = 'moisture' and i.slug = 'squalane'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 3, 'Repairs barrier so moisture stays locked in.'
from skin_concerns c, ingredients i
where c.slug = 'moisture' and i.slug = 'ceramides'
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, 4, 'Protects from moisture loss caused by UV damage.'
from skin_concerns c, ingredients i
where c.slug = 'moisture' and i.slug = 'zinc-oxide-spf'
on conflict (concern_id, ingredient_id) do nothing;

-- ---------- Products for new concerns ----------

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

-- ---------- Product-ingredient links ----------

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, 10, 1
from products p, ingredients i
where p.slug = 'ordinary-niacinamide-10' and i.slug = 'niacinamide'
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, 1, 2
from products p, ingredients i
where p.slug = 'ordinary-niacinamide-10' and i.slug = 'zinc-oxide-spf'
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, 2, 1
from products p, ingredients i
where p.slug = 'ordinary-ha' and i.slug = 'hyaluronic-acid'
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, 2, 1
from products p, ingredients i
where p.slug = 'ordinary-bha' and i.slug = 'salicylic-acid'
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, 2, 1
from products p, ingredients i
where p.slug = 'pc-2pct-bha' and i.slug = 'salicylic-acid'
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, 100, 1
from products p, ingredients i
where p.slug = 'ordinary-squalane' and i.slug = 'squalane'
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, null, 1
from products p, ingredients i
where p.slug = 'cerave-moisturizer' and i.slug = 'ceramides'
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, null, 1
from products p, ingredients i
where p.slug = 'supergoop-unseen' and i.slug = 'zinc-oxide-spf'
on conflict (product_id, ingredient_id) do nothing;

-- ---------- Availability for new products ----------

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 680, 'USD', true, true
from products p where p.slug = 'ordinary-niacinamide-10'
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 720, 'USD', true, true
from products p where p.slug = 'ordinary-ha'
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 580, 'USD', true, true
from products p where p.slug = 'ordinary-bha'
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 3200, 'USD', true, true
from products p where p.slug = 'pc-2pct-bha'
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 800, 'USD', true, true
from products p where p.slug = 'ordinary-squalane'
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 1600, 'USD', true, true
from products p where p.slug = 'cerave-moisturizer'
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 2200, 'USD', true, true
from products p where p.slug = 'supergoop-unseen'
on conflict (product_id, country_code, retailer) do nothing;
