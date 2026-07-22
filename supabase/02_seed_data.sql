-- ============================================================
-- 02_seed_data.sql — Sephora-focused seed data
-- Run after 01_schema.sql
-- ============================================================

-- ---------- Concerns ----------

insert into public.skin_concerns (slug, display_name, description, source_api_key, display_order) values
  ('redness',                'Redness',                  'Irritation, sensitivity, or flushing',                         'redness_score', 1),
  ('hyperpigmentation',      'Spots & Hyperpigmentation','Dark spots, age spots, or pigmentation',                      'spot_score',    2),
  ('fine-lines-wrinkles',    'Fine Lines & Wrinkles',    'Fine lines or loss of firmness',                               'wrinkle_score', 3),
  ('skin-texture',           'Skin Texture',             'Rough or uneven skin surface',                                 'texture_score', 4)
on conflict (slug) do nothing;

-- ---------- Ingredients ----------

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe) values
  ('salicylic-acid',       'Salicylic Acid (BHA)',         'Salicylic Acid', array['BHA'],        'Oil-soluble exfoliant that clears pores and reduces breakouts.',       'Paula''s Choice 2% BHA, COSRX BHA', 'Can be drying; start 2-3x per week.', false),
  ('niacinamide',          'Niacinamide',                  'Niacinamide',    array['Vitamin B3'], 'Calms redness, refines pores, and brightens.',                       'The Ordinary Niacinamide 10% + Zinc 1%',                        null, true),
  ('azelaic-acid',         'Azelaic Acid',                 'Azelaic Acid',   array[],             'Dual-action: treats acne and fades dark spots gently.',             'The Ordinary Azelaic Acid 10%',                               null, true),
  ('retinol',              'Retinol',                      'Retinol',        array[],             'Gold-standard for fine lines, texture, and cell turnover.',         'Olay Regenerist, Neutrogena Rapid Wrinkle Repair',            null, false),
  ('peptide-complex',      'Peptide Complex',              'Palmitoyl Tripeptide-5', array[],    'Supports firmness and elasticity without irritation.',            'The Ordinary Buffet',                                          null, true),
  ('vitamin-c',            'Vitamin C (L-Ascorbic Acid)',  'Ascorbic Acid',  array['L-Ascorbic Acid'], 'Brightens dark spots and defends against environmental damage.',   'SkinCeuticals C E Ferulic, Drunk Elephant',                   null, true),
  ('bakuchiol',            'Bakuchiol',                    'Bakuchiol',      array[],             'Gentle retinol alternative — good for sensitive skin.',             'Herbivore Botanicals, Olehenriksen',                          null, true),
  ('centella-asiatica',    'Centella Asiatica (Cica)',     'Centella Asiatica Extract', array['Cica'], 'Soothes redness, repairs barrier, calms inflammation.',        'La Roche-Posay Cicaplast, COSRX Snail Mucin',                 null, true),
  ('hyaluronic-acid',      'Hyaluronic Acid',              'Sodium Hyaluronate', array['HA'],   'Hydration hero — draws moisture into the skin.',                   'The Ordinary HA, Vichy Minéral 89',                           null, true),
  ('squalane',             'Squalane',                     'Squalane',       array[],             'Lightweight moisturizer that mimics skin''s natural oils.',         'Biossance Squalane, The Ordinary',                            null, true),
  ('benzoyl-peroxide',     'Benzoyl Peroxide',             'Benzoyl Peroxide', array[],           'Antibacterial — kills acne-causing bacteria.',                     'La Roche-Posay Effaclar, CeraVe',                             null, false),
  ('zinc-oxide-spf',       'Zinc Oxide (SPF)',             'Zinc Oxide',     array['Mineral Sunscreen'], 'Mineral sunscreen — protects against spots and aging.',            'La Roche-Posay Anthelios, Supergoop Unseen',                 null, true),
  ('tea-tree-oil',         'Tea Tree Oil',                 'Melaleuca Alternifolia Leaf Oil', array[], 'Natural antibacterial and anti-inflammatory.',                  'The Body Shop Tea Tree, Bioderma',                              null, true),
  ('aha-glycolic-acid',    'AHA / Glycolic Acid',          'Glycolic Acid',  array['AHA'],         'Surface exfoliant for texture and radiance.',                      'Paula''s Choice 8% AHA, Pixi Glow Tonic',                   null, false),
  ('ceramides',            'Ceramides',                    'Ceramide NP',    array[],             'Barrier-repair lipids — locks in moisture.',                       'CeraVe Moisturizing Cream, Dr. Jart+'',                      null, true)
on conflict (slug) do nothing;

-- ---------- Concern-Ingredient links ----------

insert into public.concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, v.rn, v.note
from (values
  ('redness',                'niacinamide',         1, 'Strengthens barrier and reduces visible redness.'),
  ('redness',                'centella-asiatica',   2, 'Cica soothes irritation and speeds barrier repair.'),
  ('redness',                'azelaic-acid',        3, 'Reduces rosacea-associated redness and bumps.'),
  ('hyperpigmentation',      'vitamin-c',           1, 'Inhibits melanin production — fades dark spots.'),
  ('hyperpigmentation',      'azelaic-acid',        2, 'Blocks abnormal pigment production safely.'),
  ('hyperpigmentation',      'retinol',             3, 'Speeds turnover so pigmented cells shed faster.'),
  ('fine-lines-wrinkles',    'retinol',             1, 'Clinically proven to boost collagen and smooth fine lines.'),
  ('fine-lines-wrinkles',    'peptide-complex',     2, 'Signals collagen production without retinol irritation.'),
  ('fine-lines-wrinkles',    'vitamin-c',           3, 'Antioxidant that brightens and defends against photoaging.'),
  ('fine-lines-wrinkles',    'bakuchiol',           4, 'Retinol-like results with less sensitivity — good for daily use.'),
  ('skin-texture',           'aha-glycolic-acid',   1, 'Sloughs dead cells for smoother surface texture.'),
  ('skin-texture',           'retinol',             2, 'Promotes cell renewal and collagen for refined texture.'),
  ('skin-texture',           'peptide-complex',     3, 'Supports firm, even skin surface over time.')
) as v(slug, islug, rn, note)
join public.skin_concerns c on c.slug = v.slug
join public.ingredients i on i.slug = v.islug
on conflict (concern_id, ingredient_id) do nothing;

-- ---------- Brands ----------

insert into public.brands (slug, name, website) values
  ('cerave',           'CeraVe',           'https://www.cerave.com'),
  ('la-roche-posay',   'La Roche-Posay',   'https://www.laroche-posay.us'),
  ('the-ordinary',     'The Ordinary',     'https://www.theordinary.com'),
  ('paulas-choice',    'Paula''s Choice',  'https://www.paulaschoice.com'),
  ('cosrx',            'COSRX',            'https://www.cosrx.com'),
  ('olay',             'Olay',             'https://www.olay.com'),
  ('skinceuticals',    'SkinCeuticals',    'https://www.skinceuticals.com'),
  ('neutrogena',       'Neutrogena',       'https://www.neutrogena.com'),
  ('supergoop',        'Supergoop',        'https://www.supergoop.com'),
  ('biossance',        'Biossance',        'https://www.biossance.com')
on conflict (slug) do nothing;

-- ---------- Products ----------

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
select p.* from (values
  ('cerave-hydrating-cleanser',         'Hydrating Facial Cleanser',          'cerave',   'cleanser',    'Gentle daily cleanser with ceramides.', 'good',    true),
  ('cerave-moisturizing-cream',         'Moisturizing Cream',                 'cerave',   'moisturizer', 'Ceramide-rich barrier repair cream.',   'good',    true),
  ('cerave-vitamin-c-serum',            'Skin Renewing Vitamin C Serum',      'cerave',   'serum',       'Brightening vitamin C serum.',           'good',    true),
  ('lrposay-cleanser',                  'Effaclar Purifying Foaming Gel',     'la-roche-posay', 'cleanser', 'Salicylic acid cleanser for blemish-prone skin.', 'good', true),
  ('lrposay-cicaplast',                 'Cicaplast Baume B5+',               'la-roche-posay', 'treatment', 'Multi-purpose repairing balm.',         'better',  true),
  ('lrposay-anthelios',                 'Anthelios UVMune 400',              'la-roche-posay', 'sunscreen', 'High-protection mineral sunscreen.',     'better',  true),
  ('ordinary-niacinamide',              'Niacinamide 10% + Zinc 1%',         'the-ordinary', 'serum', 'Multi-tasking serum for redness and pores.', 'good', true),
  ('ordinary-aha-30',                   'AHA 30% + BHA 2% Peeling Solution', 'the-ordinary', 'exfoliant', 'Weekly resurfacing treatment.',          'good',    true),
  ('ordinary-ha',                       'Hyaluronic Acid 2% + B5',          'the-ordinary', 'serum', 'Hydration serum for dry and dehydrated skin.', 'good', true),
  ('ordinary-azelaic',                  'Azelaic Acid Suspension 10%',       'the-ordinary', 'serum', 'Brightening and calming treatment.',      'good',    true),
  ('ordinary-bakuchiol',                'Bakuchiol',                         'the-ordinary', 'serum', 'Gentle anti-aging retinol alternative.',  'good',    true),
  ('paulas-choice-2pct-bha',            '2% BHA Liquid Exfoliant',           'paulas-choice','exfoliant', 'Cult-favorite BHA for pores and breakouts.', 'better', true),
  ('paulas-choice-8pct-aha',            '8% AHA Gel Exfoliant',              'paulas-choice','exfoliant', 'Weekly surface exfoliant for texture.',   'better',  true),
  ('paulas-choice-c15',                 'C15 Super Booster',                 'paulas-choice','serum', 'Potent 15% vitamin C brightener.',        'better',  true),
  ('cosrx-snail',                       'Snail Mucin 96%',                   'cosrx',  'serum', 'Hydrating and repairing snail mucin.',    'good',    true),
  ('cosrx-bha',                         'BHA Blackhead Power Liquid',        'cosrx',  'exfoliant', 'Daily BHA exfoliant for blackheads.',    'good',    true),
  ('olay-regenerist-retinol',           'Regenerist Retinol 24 Night',       'olay',   'treatment', 'Overnight retinol treatment for lines.',  'better',  true),
  ('neutrogena-rapid-wrinkle',          'Rapid Wrinkle Repair Retinol',      'neutrogena', 'serum', 'Fast-absorbing retinol serum.',           'better',  true),
  ('supergoop-unseen',                  'Unseen Sunscreen SPF 40',           'supergoop', 'sunscreen', 'Invisible mineral SPF.',                  'better',  true),
  ('biossance-squalane',                '100% Squalane Oil',                 'biossance', 'oil', 'Lightweight moisture-mimicking oil.',     'good',    true)
) as p(slug, name, brand_slug, product_type, description, tier, is_active)
join public.brands b on b.slug = p.brand_slug
on conflict (slug) do nothing;

-- ---------- Product-Ingredient links ----------

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, x.conc, x.rn
from (values
  ('cerave-hydrating-cleanser',    'ceramides',         null,   1),
  ('cerave-moisturizing-cream',    'ceramides',         null,   1),
  ('cerave-moisturizing-cream',    'hyaluronic-acid',   null,   2),
  ('cerave-vitamin-c-serum',       'vitamin-c',         10,     1),
  ('lrposay-cleanser',             'salicylic-acid',     null,   1),
  ('lrposay-cicaplast',            'centella-asiatica', null,   1),
  ('lrposay-anthelios',            'zinc-oxide-spf',    null,   1),
  ('ordinary-niacinamide',         'niacinamide',       10,     1),
  ('ordinary-niacinamide',         'zinc-oxide-spf',    1,      2),
  ('ordinary-aha-30',              'aha-glycolic-acid', 30,     1),
  ('ordinary-ha',                  'hyaluronic-acid',   2,      1),
  ('ordinary-azelaic',             'azelaic-acid',      10,     1),
  ('ordinary-bakuchiol',           'bakuchiol',          null,   1),
  ('paulas-choice-2pct-bha',       'salicylic-acid',    2,      1),
  ('paulas-choice-8pct-aha',       'aha-glycolic-acid', 8,      1),
  ('paulas-choice-c15',            'vitamin-c',         15,     1),
  ('cosrx-snail',                  'centella-asiatica', null,   1),
  ('cosrx-bha',                    'salicylic-acid',    2,      1),
  ('olay-regenerist-retinol',      'retinol',            null,   1),
  ('neutrogena-rapid-wrinkle',     'retinol',            null,   1),
  ('supergoop-unseen',             'zinc-oxide-spf',    null,   1),
  ('biossance-squalane',           'squalane',           null,   1)
) as x(prod, islug, conc, rn)
join public.products p on p.slug = x.prod
join public.ingredients i on i.slug = x.islug
on conflict (product_id, ingredient_id) do nothing;

-- ---------- Product Availability ----------

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
select p.id, 'US', v.retailer, v.url, v.cents, 'USD', true, true
from (values
  ('cerave-hydrating-cleanser',   'sephora', 'https://www.sephora.com/product/hydrating-facial-cleanser-P439009',    1499),
  ('cerave-moisturizing-cream',   'sephora', 'https://www.sephora.com/product/moisturizing-cream-P123456',           1699),
  ('cerave-vitamin-c-serum',      'sephora', 'https://www.sephora.com/product/skin-renewing-vitamin-c-serum',       2199),
  ('lrposay-cleanser',            'sephora', 'https://www.sephora.com/product/effaclar-purifying-foaming-gel',      1499),
  ('lrposay-cicaplast',           'sephora', 'https://www.sephora.com/product/cicaplast-baume-b5-plus',            1399),
  ('lrposay-anthelios',           'sephora', 'https://www.sephora.com/product/anthelios-uvmune-400',               3600),
  ('ordinary-niacinamide',        'sephora', 'https://www.sephora.com/product/niacinamide-10-zinc-1',                680),
  ('ordinary-aha-30',             'sephora', 'https://www.sephora.com/product/aha-30-bha-2-peeling-solution',        960),
  ('ordinary-ha',                 'sephora', 'https://www.sephora.com/product/hyaluronic-acid-2-b5',                720),
  ('ordinary-azelaic',            'sephora', 'https://www.sephora.com/product/azelaic-acid-suspension-10',          990),
  ('ordinary-bakuchiol',          'sephora', 'https://www.sephora.com/product/bakuchiol',                           1000),
  ('paulas-choice-2pct-bha',      'sephora', 'https://www.sephora.com/product/2-bha-liquid-exfoliant',             3200),
  ('paulas-choice-8pct-aha',      'sephora', 'https://www.sephora.com/product/8-aha-gel-exfoliant',                2900),
  ('paulas-choice-c15',           'sephora', 'https://www.sephora.com/product/c15-super-booster',                  4400),
  ('cosrx-snail',                 'sephora', 'https://www.sephora.com/product/snail-mucin-96',                      1600),
  ('cosrx-bha',                   'sephora', 'https://www.sephora.com/product/bha-blackhead-power-liquid',         1700),
  ('olay-regenerist-retinol',     'sephora', 'https://www.sephora.com/product/regenerist-retinol-24-night',        2899),
  ('neutrogena-rapid-wrinkle',    'sephora', 'https://www.sephora.com/product/rapid-wrinkle-repair-retinol',      2199),
  ('supergoop-unseen',            'sephora', 'https://www.sephora.com/product/unseen-sunscreen-spf-40',           2200),
  ('biossance-squalane',          'sephora', 'https://www.sephora.com/product/100-squalane-oil',                   2400)
) as v(slug, retailer, url, cents)
join public.products p on p.slug = v.slug
on conflict (product_id, country_code, retailer) do nothing;
