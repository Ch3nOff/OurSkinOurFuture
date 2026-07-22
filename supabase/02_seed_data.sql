-- ============================================================
-- 02_seed_data.sql — Sephora-focused seed data
-- Run after 01_schema.sql
-- Matches confirmed-live schema with UUIDs, relevance_score, is_headline_ingredient
-- ============================================================

-- ---------- Skin concerns ----------

insert into public.skin_concerns (slug, display_name, description, source_api_key, display_order) values
  ('redness',             'Redness',                   'Irritation, sensitivity, or flushing',     'redness_score',  1),
  ('hyperpigmentation',   'Spots & Hyperpigmentation',  'Dark spots, age spots, or pigmentation',   'spot_score',     2),
  ('fine-lines-wrinkles', 'Fine Lines & Wrinkles',      'Fine lines or loss of firmness',           'wrinkle_score',  3),
  ('skin-texture',        'Skin Texture',               'Rough or uneven skin surface',             'texture_score',  4)
on conflict (slug) do nothing;

-- ---------- Ingredients ----------

insert into public.ingredients (slug, display_name, inci_name, aliases, description, caution_note, pregnancy_safe) values
  ('salicylic-acid',    'Salicylic Acid (BHA)',        'Salicylic Acid',              array['BHA'],                  'Oil-soluble exfoliant that clears pores and reduces breakouts.',        'Can be drying; start 2-3x per week.', false),
  ('niacinamide',       'Niacinamide',                 'Niacinamide',                 array['Vitamin B3'],           'Calms redness, refines pores, and brightens.',                          null, true),
  ('azelaic-acid',      'Azelaic Acid',                'Azelaic Acid',                array[]::text[],               'Dual-action: treats acne and fades dark spots gently.',                 null, true),
  ('retinol',           'Retinol',                     'Retinol',                     array[]::text[],               'Gold-standard for fine lines, texture, and cell turnover.',             'Increases sun sensitivity; use at night with daily SPF.', false),
  ('peptide-complex',   'Peptide Complex',             'Palmitoyl Tripeptide-5',      array[]::text[],               'Supports firmness and elasticity without irritation.',                  null, true),
  ('vitamin-c',         'Vitamin C (L-Ascorbic Acid)', 'Ascorbic Acid',               array['L-Ascorbic Acid'],      'Brightens dark spots and defends against environmental damage.',       null, true),
  ('bakuchiol',         'Bakuchiol',                   'Bakuchiol',                   array[]::text[],               'Gentle retinol alternative — good for sensitive skin.',                 null, true),
  ('centella-asiatica', 'Centella Asiatica (Cica)',    'Centella Asiatica Extract',   array['Cica'],                 'Soothes redness, repairs barrier, calms inflammation.',                 null, true),
  ('hyaluronic-acid',   'Hyaluronic Acid',             'Sodium Hyaluronate',          array['HA'],                   'Hydration hero — draws moisture into the skin.',                        null, true),
  ('squalane',          'Squalane',                    'Squalane',                    array[]::text[],               'Lightweight moisturizer that mimics skin''s natural oils.',             null, true),
  ('benzoyl-peroxide',  'Benzoyl Peroxide',            'Benzoyl Peroxide',            array[]::text[],               'Antibacterial — kills acne-causing bacteria.',                          null, false),
  ('zinc-oxide-spf',    'Zinc Oxide (SPF)',            'Zinc Oxide',                  array['Mineral Sunscreen'],    'Mineral sunscreen — protects against spots and aging.',                 null, true),
  ('tea-tree-oil',      'Tea Tree Oil',                'Melaleuca Alternifolia Leaf Oil', array[]::text[],           'Natural antibacterial and anti-inflammatory.',                          null, true),
  ('aha-glycolic-acid', 'AHA / Glycolic Acid',         'Glycolic Acid',               array['AHA'],                  'Surface exfoliant for texture and radiance.',                           'Increases sun sensitivity; always follow with SPF.', false),
  ('ceramides',         'Ceramides',                   'Ceramide NP',                 array[]::text[],               'Barrier-repair lipids — locks in moisture.',                            null, true)
on conflict (slug) do nothing;

-- ---------- Concern <-> Ingredient links ----------

insert into public.concern_ingredients (concern_id, ingredient_id, relevance_score, evidence_note)
select c.id, i.id, v.score, v.note
from (values
  ('redness', 'azelaic-acid',       90, 'Directly reduces inflammatory redness'),
  ('redness', 'centella-asiatica',  85, 'Well-tolerated soothing agent for frequent use'),
  ('redness', 'niacinamide',        65, 'Supporting ingredient; also improves barrier function'),

  ('hyperpigmentation', 'vitamin-c',      88, 'Brightens overall tone, best paired with SPF'),
  ('hyperpigmentation', 'azelaic-acid',   80, 'Dual-benefit: also helps redness'),
  ('hyperpigmentation', 'niacinamide',    70, 'Evens tone while improving texture'),

  ('fine-lines-wrinkles', 'retinol',         95, 'Most clinically validated ingredient for fine lines'),
  ('fine-lines-wrinkles', 'bakuchiol',       72, 'Best entry point for retinol-sensitive skin'),
  ('fine-lines-wrinkles', 'peptide-complex', 78, 'Good layering option alongside retinol'),
  ('fine-lines-wrinkles', 'vitamin-c',       60, 'Antioxidant support, complements retinol'),

  ('skin-texture', 'aha-glycolic-acid', 90, 'Most effective surface-exfoliation ingredient'),
  ('skin-texture', 'retinol',           82, 'Improves texture via increased cell turnover'),
  ('skin-texture', 'ceramides',         60, 'Maintains a smooth barrier alongside actives')
) as v(concern_slug, ingredient_slug, score, note)
join public.skin_concerns c on c.slug = v.concern_slug
join public.ingredients i on i.slug = v.ingredient_slug
on conflict (concern_id, ingredient_id) do nothing;

-- ---------- Brands ----------

insert into public.brands (slug, name, country_of_origin, price_tier, is_cruelty_free, is_vegan_friendly, website_url) values
  ('cerave',         'CeraVe',           'United States',  'drugstore', true,  false, 'https://www.cerave.com'),
  ('la-roche-posay', 'La Roche-Posay',   'France',         'mid',       false, false, 'https://www.laroche-posay.us'),
  ('the-ordinary',   'The Ordinary',     'Canada',         'drugstore', true,  true,  'https://theordinary.com'),
  ('paulas-choice',  'Paula''s Choice',  'United States',  'mid',       true,  true,  'https://paulaschoice.com'),
  ('cosrx',          'COSRX',            'South Korea',    'drugstore', true,  false, 'https://cosrx.com'),
  ('olay',           'Olay',             'United States',  'drugstore', false, false, 'https://olay.com'),
  ('skinceuticals',  'SkinCeuticals',    'United States',  'luxury',    false, false, 'https://skinceuticals.com'),
  ('neutrogena',     'Neutrogena',       'United States',  'drugstore', false, false, 'https://www.neutrogena.com'),
  ('supergoop',      'Supergoop',        'United States',  'mid',       true,  true,  'https://www.supergoop.com'),
  ('biossance',      'Biossance',        'United States',  'mid',       true,  true,  'https://www.biossance.com')
on conflict (slug) do nothing;

-- ---------- Products ----------

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
select v.slug, v.name, b.id, v.product_type, v.description, v.tier, true
from (values
  ('cerave-hydrating-cleanser',  'Hydrating Facial Cleanser',           'cerave',         'cleanser',    'Gentle daily cleanser with ceramides.', 'good'),
  ('cerave-moisturizing-cream',  'Moisturizing Cream',                  'cerave',         'moisturizer', 'Ceramide-rich barrier repair cream.',   'good'),
  ('cerave-vitamin-c-serum',     'Skin Renewing Vitamin C Serum',       'cerave',         'serum',       'Brightening vitamin C serum.',          'good'),
  ('lrposay-cleanser',           'Effaclar Purifying Foaming Gel',      'la-roche-posay', 'cleanser',    'Salicylic acid cleanser for blemish-prone skin.', 'good'),
  ('lrposay-cicaplast',          'Cicaplast Baume B5+',                 'la-roche-posay', 'treatment',   'Multi-purpose repairing balm.',         'better'),
  ('lrposay-anthelios',          'Anthelios UVMune 400',                'la-roche-posay', 'sunscreen',   'High-protection mineral sunscreen.',    'better'),
  ('ordinary-niacinamide',       'Niacinamide 10% + Zinc 1%',           'the-ordinary',   'serum',       'Multi-tasking serum for redness and pores.', 'good'),
  ('ordinary-aha-30',            'AHA 30% + BHA 2% Peeling Solution',   'the-ordinary',   'exfoliant',   'Weekly resurfacing treatment.',         'good'),
  ('ordinary-ha',                'Hyaluronic Acid 2% + B5',             'the-ordinary',   'serum',       'Hydration serum for dry and dehydrated skin.', 'good'),
  ('ordinary-azelaic',           'Azelaic Acid Suspension 10%',         'the-ordinary',   'serum',       'Brightening and calming treatment.',    'good'),
  ('ordinary-bakuchiol',         'Bakuchiol',                            'the-ordinary',   'serum',       'Gentle anti-aging retinol alternative.', 'good'),
  ('paulas-choice-2pct-bha',     '2% BHA Liquid Exfoliant',             'paulas-choice',  'exfoliant',   'Cult-favorite BHA for pores and breakouts.', 'better'),
  ('paulas-choice-8pct-aha',     '8% AHA Gel Exfoliant',                'paulas-choice',  'exfoliant',   'Weekly surface exfoliant for texture.', 'better'),
  ('paulas-choice-c15',          'C15 Super Booster',                   'paulas-choice',  'serum',       'Potent 15% vitamin C brightener.',      'better'),
  ('cosrx-snail',                'Snail Mucin 96%',                     'cosrx',          'serum',       'Hydrating and repairing snail mucin.',  'good'),
  ('cosrx-bha',                  'BHA Blackhead Power Liquid',          'cosrx',          'exfoliant',   'Daily BHA exfoliant for blackheads.',   'good'),
  ('olay-regenerist-retinol',    'Regenerist Retinol 24 Night',         'olay',           'treatment',   'Overnight retinol treatment for lines.', 'better'),
  ('neutrogena-rapid-wrinkle',   'Rapid Wrinkle Repair Retinol',        'neutrogena',     'serum',       'Fast-absorbing retinol serum.',         'better'),
  ('supergoop-unseen',           'Unseen Sunscreen SPF 40',             'supergoop',      'sunscreen',   'Invisible mineral SPF.',                'better'),
  ('biossance-squalane',         '100% Squalane Oil',                   'biossance',      'oil',         'Lightweight moisture-mimicking oil.',   'good'),
  ('skinceuticals-ce-ferulic',   'C E Ferulic',                          'skinceuticals',  'serum',       'Clinical gold-standard stabilized Vitamin C serum.', 'best'),
  ('skinceuticals-phyto',        'Phyto Corrective Gel',                'skinceuticals',  'treatment',   'Dermatologist-grade calming gel.',      'best'),
  ('skinceuticals-glycolic-10',  'Glycolic 10 Renew Overnight',         'skinceuticals',  'treatment',   'Clinical-strength overnight glycolic treatment.', 'best')
) as v(slug, name, brand_slug, product_type, description, tier)
join public.brands b on b.slug = v.brand_slug
on conflict (slug) do nothing;

-- ---------- Product <-> Ingredient links ----------

insert into public.product_ingredients (product_id, ingredient_id, is_headline_ingredient)
select p.id, i.id, true
from (values
  ('cerave-hydrating-cleanser',  'ceramides'),
  ('cerave-moisturizing-cream',  'ceramides'),
  ('cerave-moisturizing-cream',  'hyaluronic-acid'),
  ('cerave-vitamin-c-serum',     'vitamin-c'),
  ('lrposay-cleanser',           'salicylic-acid'),
  ('lrposay-cicaplast',          'centella-asiatica'),
  ('lrposay-anthelios',          'zinc-oxide-spf'),
  ('ordinary-niacinamide',       'niacinamide'),
  ('ordinary-aha-30',            'aha-glycolic-acid'),
  ('ordinary-ha',                'hyaluronic-acid'),
  ('ordinary-azelaic',           'azelaic-acid'),
  ('ordinary-bakuchiol',         'bakuchiol'),
  ('paulas-choice-2pct-bha',     'salicylic-acid'),
  ('paulas-choice-8pct-aha',     'aha-glycolic-acid'),
  ('paulas-choice-c15',          'vitamin-c'),
  ('cosrx-snail',                'centella-asiatica'),
  ('cosrx-bha',                  'salicylic-acid'),
  ('olay-regenerist-retinol',    'retinol'),
  ('neutrogena-rapid-wrinkle',   'retinol'),
  ('supergoop-unseen',           'zinc-oxide-spf'),
  ('biossance-squalane',         'squalane'),
  ('skinceuticals-ce-ferulic',   'vitamin-c'),
  ('skinceuticals-phyto',        'centella-asiatica'),
  ('skinceuticals-glycolic-10',  'aha-glycolic-acid')
) as v(product_slug, ingredient_slug)
join public.products p on p.slug = v.product_slug
join public.ingredients i on i.slug = v.ingredient_slug
on conflict (product_id, ingredient_id) do nothing;

-- ---------- Product Availability ----------

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, v.country_code, v.retailer, v.url, v.price_cents, v.currency, true, true
from (values
  ('cerave-hydrating-cleanser',  'US', 'sephora', 'https://www.sephora.com/product/hydrating-facial-cleanser-P439009', 1499, 'USD'),
  ('cerave-moisturizing-cream',  'US', 'sephora', 'https://www.sephora.com/product/moisturizing-cream-P123456',        1699, 'USD'),
  ('cerave-vitamin-c-serum',     'US', 'sephora', 'https://www.sephora.com/product/skin-renewing-vitamin-c-serum',    2199, 'USD'),
  ('lrposay-cleanser',           'US', 'sephora', 'https://www.sephora.com/product/effaclar-purifying-foaming-gel',   1499, 'USD'),
  ('lrposay-cicaplast',          'US', 'sephora', 'https://www.sephora.com/product/cicaplast-baume-b5-plus',          1399, 'USD'),
  ('lrposay-anthelios',          'US', 'sephora', 'https://www.sephora.com/product/anthelios-uvmune-400',             3600, 'USD'),
  ('ordinary-niacinamide',       'US', 'sephora', 'https://www.sephora.com/product/niacinamide-10-zinc-1',             680, 'USD'),
  ('ordinary-aha-30',            'US', 'sephora', 'https://www.sephora.com/product/aha-30-bha-2-peeling-solution',     960, 'USD'),
  ('ordinary-ha',                'US', 'sephora', 'https://www.sephora.com/product/hyaluronic-acid-2-b5',              720, 'USD'),
  ('ordinary-azelaic',           'US', 'sephora', 'https://www.sephora.com/product/azelaic-acid-suspension-10',        990, 'USD'),
  ('ordinary-bakuchiol',         'US', 'sephora', 'https://www.sephora.com/product/bakuchiol',                       1000, 'USD'),
  ('paulas-choice-2pct-bha',     'US', 'sephora', 'https://www.sephora.com/product/2-bha-liquid-exfoliant',          3200, 'USD'),
  ('paulas-choice-8pct-aha',     'US', 'sephora', 'https://www.sephora.com/product/8-aha-gel-exfoliant',             2900, 'USD'),
  ('paulas-choice-c15',          'US', 'sephora', 'https://www.sephora.com/product/c15-super-booster',               4400, 'USD'),
  ('cosrx-snail',                'US', 'sephora', 'https://www.sephora.com/product/snail-mucin-96',                  1600, 'USD'),
  ('cosrx-bha',                  'US', 'sephora', 'https://www.sephora.com/product/bha-blackhead-power-liquid',      1700, 'USD'),
  ('olay-regenerist-retinol',    'US', 'sephora', 'https://www.sephora.com/product/regenerist-retinol-24-night',     2899, 'USD'),
  ('neutrogena-rapid-wrinkle',   'US', 'sephora', 'https://www.sephora.com/product/rapid-wrinkle-repair-retinol',    2199, 'USD'),
  ('supergoop-unseen',           'US', 'sephora', 'https://www.sephora.com/product/unseen-sunscreens-spf-40',        2200, 'USD'),
  ('biossance-squalane',         'US', 'sephora', 'https://www.sephora.com/product/100-squalane-oil',                2400, 'USD'),
  ('skinceuticals-ce-ferulic',   'US', 'sephora', 'https://www.sephora.com/product/c-e-ferulic',                    16900, 'USD'),
  ('skinceuticals-phyto',        'US', 'sephora', 'https://www.sephora.com/product/phyto-corrective-gel',            6400, 'USD'),
  ('skinceuticals-glycolic-10',  'US', 'sephora', 'https://www.sephora.com/product/glycolic-10-renew-overnight',     9600, 'USD')
) as v(product_slug, country_code, retailer, url, price_cents, currency)
join public.products p on p.slug = v.product_slug
on conflict (product_id, country_code, retailer) do nothing;
