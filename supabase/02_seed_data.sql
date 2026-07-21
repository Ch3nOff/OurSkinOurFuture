-- ============================================================
-- 02_seed_data.sql — Sephora-focused seed data
-- Run after 01_schema.sql
-- ============================================================

-- ---------- Concerns (matches our app's 8 concerns) ----------

insert into public.skin_concerns (slug, label, description, severity_label, severity_min, severity_max) values
  ('acne-inflammation',      'Acne & Inflammation',      'Active breakouts, bumps, or inflammation',                     'High',   61, 100),
  ('fine-lines-wrinkles',    'Fine Lines & Wrinkles',    'Fine lines or loss of firmness',                               'High',   61, 100),
  ('redness',                'Redness',                  'Irritation, sensitivity, or flushing',                         'High',   61, 100),
  ('dark-circles',           'Dark Circles',             'Dark circles or under-eye dullness',                           'Moderate',31, 60),
  ('pores',                  'Pores',                    'Visible pore size or congestion',                              'Moderate',31, 60),
  ('skin-texture',           'Skin Texture',             'Rough or uneven skin surface',                                 'Moderate',31, 60),
  ('hyperpigmentation',      'Spots & Hyperpigmentation','Dark spots, age spots, or pigmentation',                      'Moderate',31, 60),
  ('moisture',               'Moisture',                 'Hydration level — dryness vs. balanced',                      'Low',    0,  30)
on conflict (slug) do nothing;

-- ---------- Ingredients ----------

insert into public.ingredients (slug, label, description, example_products) values
  ('salicylic-acid',       'Salicylic Acid (BHA)',         'Oil-soluble exfoliant that clears pores and reduces breakouts.',       'Paula''s Choice 2% BHA, COSRX BHA'),
  ('niacinamide',          'Niacinamide',                  'Vitamin B3 that calms redness, refines pores, and brightens.',         'The Ordinary Niacinamide 10% + Zinc 1%, Glow Recipe'),
  ('azelaic-acid',         'Azelaic Acid',                 'Dual-action: treats acne and fades dark spots gently.',               'The Ordinary Azelaic Acid 10%, Paula''s Choice'),
  ('retinol',              'Retinol',                      'Gold-standard for fine lines, texture, and cell turnover.',           'Olay Regenerist, Neutrogena Rapid Wrinkle Repair'),
  ('peptide-complex',      'Peptide Complex',              'Supports firmness and elasticity without irritation.',                'The Ordinary Buffet, Olay Regenerist'),
  ('vitamin-c',            'Vitamin C (L-Ascorbic Acid)',  'Brightens dark spots and defends against environmental damage.',       'SkinCeuticals C E Ferulic, Drunk Elephant'),
  ('bakuchiol',            'Bakuchiol',                    'Gentle retinol alternative — good for sensitive skin.',              'Herbivore Botanicals, Olehenriksen'),
  ('centella-asiatica',    'Centella Asiatica (Cica)',     'Soothes redness, repairs barrier, calms inflammation.',             'La Roche-Posay Cicaplast, COSRX Snail Mucin'),
  ('hyaluronic-acid',      'Hyaluronic Acid',              'Hydration hero — draws moisture into the skin.',                    'The Ordinary HA, Vichy Minéral 89'),
  ('squalane',             'Squalane',                     'Lightweight moisturizer that mimics skin''s natural oils.',          'Biossance Squalane, The Ordinary'),
  ('benzoyl-peroxide',     'Benzoyl Peroxide',             'Antibacterial — kills acne-causing bacteria.',                      'La Roche-Posay Effaclar, CeraVe'),
  ('tea-tree-oil',         'Tea Tree Oil',                 'Natural antibacterial and anti-inflammatory.',                      'The Body Shop Tea Tree, Bioderma'),
  ('aha-glycolic-acid',    'AHA / Glycolic Acid',          'Surface exfoliant for texture and radiance.',                       'Paula''s Choice 8% AHA, Pixi Glow Tonic'),
  ('ceramides',            'Ceramides',                    'Barrier-repair lipids — locks in moisture.',                       'CeraVe Moisturizing Cream, Dr. Jart+'),
  ('zinc-oxide-spf',       'Zinc Oxide (SPF)',             'Mineral sunscreen — protects against spots and aging.',             'La Roche-Posay Anthelios, Supergoop')
on conflict (slug) do nothing;

-- ---------- Concern-Ingredient links ----------

insert into public.concern_ingredients (concern_id, ingredient_id, rank, evidence_note)
select c.id, i.id, rn, e.note
from (values
  ('acne-inflammation',    'salicylic-acid',       1, 'Oil-soluble BHA clears clogged pores and reduces inflammatory acne.'),
  ('acne-inflammation',    'niacinamide',           2, 'Calms redness and regulates sebum production.'),
  ('acne-inflammation',    'azelaic-acid',          3, 'Gentle anti-inflammatory; safe for sensitive acne-prone skin.'),
  ('acne-inflammation',    'benzoyl-peroxide',      4, 'Kills P. acnes bacteria — use low % to avoid dryness.'),
  ('acne-inflammation',    'tea-tree-oil',          5, 'Natural alternative to benzoyl for mild breakouts.'),
  ('fine-lines-wrinkles',  'retinol',               1, 'Clinically proven to boost collagen and smooth fine lines.'),
  ('fine-lines-wrinkles',  'peptide-complex',       2, 'Signals collagen production without retinol irritation.'),
  ('fine-lines-wrinkles',  'vitamin-c',             3, 'Antioxidant that brightens and defends against photoaging.'),
  ('fine-lines-wrinkles',  'bakuchiol',             4, 'Retinol-like results with less sensitivity — good for daily use.'),
  ('redness',              'niacinamide',            1, 'Strengthens barrier and reduces visible redness.'),
  ('redness',              'centella-asiatica',      2, 'Cica soothes irritation and speeds barrier repair.'),
  ('redness',              'azelaic-acid',           3, 'Reduces rosacea-associated redness and bumps.'),
  ('dark-circles',         'vitamin-c',              1, 'Brightens under-eye pigmentation over 4–8 weeks.'),
  ('dark-circles',         'niacinamide',            2, 'Improves microcirculation and lightens dark circles.'),
  ('dark-circles',         'peptide-complex',        3, 'Firms thin under-eye skin to reduce shadow appearance.'),
  ('pores',                'salicylic-acid',         1, 'Dissolves sebum inside pores for a smoother look.'),
  ('pores',                'niacinamide',            2, 'Regulates oil and visibly tightens pore appearance.'),
  ('pores',                'retinol',                3, 'Increases cell turnover so pores stay clear.'),
  ('skin-texture',          'aha-glycolic-acid',      1, 'Sloughs dead cells for smoother surface texture.'),
  ('skin-texture',          'retinol',                2, 'Promotes cell renewal and collagen for refined texture.'),
  ('skin-texture',          'peptide-complex',        3, 'Supports firm, even skin surface over time.'),
  ('hyperpigmentation',    'vitamin-c',              1, 'Inhibits melanin production — fades dark spots.'),
  ('hyperpigmentation',    'azelaic-acid',           2, 'Blocks abnormal pigment production safely.'),
  ('hyperpigmentation',    'retinol',                3, 'Speeds turnover so pigmented cells shed faster.'),
  ('moisture',             'hyaluronic-acid',        1, 'Draws and holds moisture — plumps dry skin.'),
  ('moisture',             'squalane',               2, 'Mimics natural sebum — lightweight, non-greasy hydration.'),
  ('moisture',             'ceramides',              3, 'Repairs barrier so moisture stays locked in.')
) as e(slug, islug, rn, note)
join public.skin_concerns c on c.slug = e.slug
join public.ingredients i on i.slug = e.islug
on conflict (concern_id, ingredient_id) do nothing;

-- ---------- Brands (Sephora-focused) ----------

insert into public.brands (slug, name, website) values
  ('cerave',           'CeraVe',           'https://www.cerave.com'),
  ('la-roche-posay',   'La Roche-Posay',   'https://www.laroche-posay.us'),
  ('the-ordinary',     'The Ordinary',     'https://www.theordinary.com'),
  ('paulas-choice',    'Paula''s Choice',  'https://www.paulaschoice.com'),
  ('cosrx',            'COSRX',            'https://www.cosrx.com'),
  ('olay',             'Olay',             'https://www.olay.com'),
  ('skinceuticals',    'SkinCeuticals',    'https://www.skinceuticals.com'),
  ('neutrogena',       'Neutrogena',       'https://www.neutrogena.com'),
  ('glow-recipe',      'Glow Recipe',      'https://www.glowrecipe.com'),
  ('drunk-elephant',   'Drunk Elephant',   'https://www.drunkelephant.com'),
  ('supergoop',        'Supergoop',        'https://www.supergoop.com'),
  ('biossance',        'Biossance',        'https://www.biossance.com')
on conflict (slug) do nothing;

-- ---------- Products ----------

insert into public.products (slug, name, brand_id, category, subtype, url, country, is_active)
select p.* from (values
  ('cerave-hydrating-cleanser',         'Hydrating Facial Cleanser',          'cerave',           'cleanser',         'daily',             'https://www.sephora.com/product/hydrating-facial-cleanser-P439009',  'US', true),
  ('cerave-moisturizing-cream',         'Moisturizing Cream',                 'cerave',           'moisturizer',      'daily',             'https://www.sephora.com/product/moisturizing-cream-P123456',         'US', true),
  ('cerave-vitamin-c-serum',            'Skin Renewing Vitamin C Serum',      'cerave',           'serum',            'brightening',       'https://www.sephora.com/product/skin-renewing-vitamin-c-serum',     'US', true),
  ('lrposay-cleanser',                  'Effaclar Purifying Foaming Gel',     'la-roche-posay',   'cleanser',         'daily',             'https://www.sephora.com/product/effaclar-purifying-foaming-gel',    'US', true),
  ('lrposay-cicaplast',                 'Cicaplast Baume B5+',               'la-roche-posay',   'treatment',        'barrier-repair',    'https://www.sephora.com/product/cicaplast-baume-b5-plus',           'US', true),
  ('lrposay-anthelios',                 'Anthelios UVMune 400',              'la-roche-posay',   'sunscreen',        'daily',             'https://www.sephora.com/product/anthelios-uvmune-400',             'US', true),
  ('ordinary-niacinamide',              'Niacinamide 10% + Zinc 1%',         'the-ordinary',     'serum',            'daily',             'https://www.sephora.com/product/niacinamide-10-zinc-1',             'US', true),
  ('ordinary-aha-30',                   'AHA 30% + BHA 2% Peeling Solution', 'the-ordinary',     'exfoliant',        'weekly',            'https://www.sephora.com/product/aha-30-bha-2-peeling-solution',     'US', true),
  ('ordinary-ha',                       'Hyaluronic Acid 2% + B5',          'the-ordinary',     'serum',            'hydrating',         'https://www.sephora.com/product/hyaluronic-acid-2-b5',             'US', true),
  ('ordinary-azelaic',                  'Azelaic Acid Suspension 10%',       'the-ordinary',     'serum',            'brightening',       'https://www.sephora.com/product/azelaic-acid-suspension-10',       'US', true),
  ('ordinary-bakuchiol',                'Bakuchiol',                         'the-ordinary',     'serum',            'anti-aging',        'https://www.sephora.com/product/bakuchiol',                        'US', true),
  ('paulas-choice-2pct-bha',            '2% BHA Liquid Exfoliant',           'paulas-choice',    'exfoliant',        'daily',             'https://www.sephora.com/product/2-bha-liquid-exfoliant',           'US', true),
  ('paulas-choice-8pct-aha',            '8% AHA Gel Exfoliant',              'paulas-choice',    'exfoliant',        'weekly',            'https://www.sephora.com/product/8-aha-gel-exfoliant',              'US', true),
  ('paulas-choice-c15',                 'C15 Super Booster',                 'paulas-choice',    'serum',            'brightening',       'https://www.sephora.com/product/c15-super-booster',               'US', true),
  ('cosrx-snail',                       'Snail Mucin 96%',                   'cosrx',            'serum',            'hydrating',         'https://www.sephora.com/product/snail-mucin-96',                   'US', true),
  ('cosrx-bha',                         'BHA Blackhead Power Liquid',        'cosrx',            'exfoliant',        'daily',             'https://www.sephora.com/product/bha-blackhead-power-liquid',       'US', true),
  ('olay-regenerist-retinol',           'Regenerist Retinol 24 Night',       'olay',             'treatment',        'anti-aging',        'https://www.sephora.com/product/regenerist-retinol-24-night',      'US', true),
  ('neutrogena-rapid-wrinkle',          'Rapid Wrinkle Repair Retinol',      'neutrogena',       'serum',            'anti-aging',        'https://www.sephora.com/product/rapid-wrinkle-repair-retinol',    'US', true),
  ('supergoop-unseen',                  'Unseen Sunscreen SPF 40',           'supergoop',        'sunscreen',        'daily',             'https://www.sephora.com/product/unseen-sunscreen-spf-40',          'US', true),
  ('biossance-squalane',                '100% Squalane Oil',                 'biossance',        'oil',              'hydrating',         'https://www.sephora.com/product/100-squalane-oil',                 'US', true)
) as p(slug, name, brand_slug, category, subtype, url, country, is_active)
join public.brands b on b.slug = p.brand_slug
on conflict (slug) do nothing;

-- ---------- Product-Ingredient links ----------

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
select p.id, i.id, c.conc, rn
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

-- ---------- Product Availability (Sephora US by default) ----------

insert into public.product_availability (product_id, country_code, in_stock, price, currency, url)
select p.id, 'US', true, v.price, 'USD', v.url
from (values
  ('cerave-hydrating-cleanser',       14.99),
  ('cerave-moisturizing-cream',       16.99),
  ('cerave-vitamin-c-serum',          21.99),
  ('lrposay-cleanser',                14.99),
  ('lrposay-cicaplast',               13.99),
  ('lrposay-anthelios',               36.00),
  ('ordinary-niacinamide',             6.80),
  ('ordinary-aha-30',                  9.60),
  ('ordinary-ha',                      7.20),
  ('ordinary-azelaic',                 9.90),
  ('ordinary-bakuchiol',              10.00),
  ('paulas-choice-2pct-bha',          32.00),
  ('paulas-choice-8pct-aha',          29.00),
  ('paulas-choice-c15',               44.00),
  ('cosrx-snail',                     16.00),
  ('cosrx-bha',                       17.00),
  ('olay-regenerist-retinol',         28.99),
  ('neutrogena-rapid-wrinkle',        21.99),
  ('supergoop-unseen',                22.00),
  ('biossance-squalane',               24.00)
) as v(slug, price)
join public.products p on p.slug = v.slug
on conflict (product_id, country_code) do nothing;
