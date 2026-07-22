-- ============================================================
-- 02_seed_data.sql — Sephora-focused seed data
-- Run after 01_schema.sql
-- One INSERT per row to avoid multi-row VALUES parser issues.
-- ============================================================

-- ---------- Concerns ----------

insert into public.skin_concerns (slug, display_name, description, source_api_key, display_order)
values ('redness', 'Redness', 'Irritation, sensitivity, or flushing', 'redness_score', 1)
on conflict (slug) do nothing;

insert into public.skin_concerns (slug, display_name, description, source_api_key, display_order)
values ('hyperpigmentation', 'Spots & Hyperpigmentation', 'Dark spots, age spots, or pigmentation', 'spot_score', 2)
on conflict (slug) do nothing;

insert into public.skin_concerns (slug, display_name, description, source_api_key, display_order)
values ('fine-lines-wrinkles', 'Fine Lines & Wrinkles', 'Fine lines or loss of firmness', 'wrinkle_score', 3)
on conflict (slug) do nothing;

insert into public.skin_concerns (slug, display_name, description, source_api_key, display_order)
values ('skin-texture', 'Skin Texture', 'Rough or uneven skin surface', 'texture_score', 4)
on conflict (slug) do nothing;

-- ---------- Ingredients ----------

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('salicylic-acid', 'Salicylic Acid (BHA)', 'Salicylic Acid', ARRAY['BHA'], 'Oil-soluble exfoliant that clears pores and reduces breakouts.', 'Paula''s Choice 2% BHA, COSRX BHA', 'Can be drying; start 2-3x per week.', false)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('niacinamide', 'Niacinamide', 'Niacinamide', ARRAY['Vitamin B3'], 'Calms redness, refines pores, and brightens.', 'The Ordinary Niacinamide 10% + Zinc 1%', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('azelaic-acid', 'Azelaic Acid', 'Azelaic Acid', ARRAY[], 'Dual-action: treats acne and fades dark spots gently.', 'The Ordinary Azelaic Acid 10%', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('retinol', 'Retinol', 'Retinol', ARRAY[], 'Gold-standard for fine lines, texture, and cell turnover.', 'Olay Regenerist, Neutrogena Rapid Wrinkle Repair', null, false)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('peptide-complex', 'Peptide Complex', 'Palmitoyl Tripeptide-5', ARRAY[], 'Supports firmness and elasticity without irritation.', 'The Ordinary Buffet', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('vitamin-c', 'Vitamin C (L-Ascorbic Acid)', 'Ascorbic Acid', ARRAY['L-Ascorbic Acid'], 'Brightens dark spots and defends against environmental damage.', 'SkinCeuticals C E Ferulic, Drunk Elephant', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('bakuchiol', 'Bakuchiol', 'Bakuchiol', ARRAY[], 'Gentle retinol alternative — good for sensitive skin.', 'Herbivore Botanicals, Olehenriksen', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('centella-asiatica', 'Centella Asiatica (Cica)', 'Centella Asiatica Extract', ARRAY['Cica'], 'Soothes redness, repairs barrier, calms inflammation.', 'La Roche-Posay Cicaplast, COSRX Snail Mucin', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('hyaluronic-acid', 'Hyaluronic Acid', 'Sodium Hyaluronate', ARRAY['HA'], 'Hydration hero — draws moisture into the skin.', 'The Ordinary HA, Vichy Mineral 89', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('squalane', 'Squalane', 'Squalane', ARRAY[], 'Lightweight moisturizer that mimics skin''s natural oils.', 'Biossance Squalane, The Ordinary', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('benzoyl-peroxide', 'Benzoyl Peroxide', 'Benzoyl Peroxide', ARRAY[], 'Antibacterial — kills acne-causing bacteria.', 'La Roche-Posay Effaclar, CeraVe', null, false)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('zinc-oxide-spf', 'Zinc Oxide (SPF)', 'Zinc Oxide', ARRAY['Mineral Sunscreen'], 'Mineral sunscreen — protects against spots and aging.', 'La Roche-Posay Anthelios, Supergoop Unseen', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('tea-tree-oil', 'Tea Tree Oil', 'Melaleuca Alternifolia Leaf Oil', ARRAY[], 'Natural antibacterial and anti-inflammatory.', 'The Body Shop Tea Tree, Bioderma', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('aha-glycolic-acid', 'AHA / Glycolic Acid', 'Glycolic Acid', ARRAY['AHA'], 'Surface exfoliant for texture and radiance.', 'Paula''s Choice 8% AHA, Pixi Glow Tonic', null, false)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('ceramides', 'Ceramides', 'Ceramide NP', ARRAY[], 'Barrier-repair lipids — locks in moisture.', 'CeraVe Moisturizing Cream, Dr. Jart+', null, true)
on conflict (slug) do nothing;

-- ---------- Concern-Ingredient links ----------

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (1, 1, 1)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (1, 2, 2)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (1, 3, 3)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (2, 4, 1)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (2, 3, 2)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (2, 5, 3)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (3, 5, 1)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (3, 6, 2)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (3, 4, 3)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (3, 7, 4)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (4, 8, 1)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (4, 5, 2)
on conflict (concern_id, ingredient_id) do nothing;

insert into public.concern_ingredients (concern_id, ingredient_id, rank)
values (4, 6, 3)
on conflict (concern_id, ingredient_id) do nothing;

-- ---------- Brands ----------

insert into public.brands (slug, name, website)
values ('cerave', 'CeraVe', 'https://www.cerave.com')
on conflict (slug) do nothing;

insert into public.brands (slug, name, website)
values ('la-roche-posay', 'La Roche-Posay', 'https://www.laroche-posay.us')
on conflict (slug) do nothing;

insert into public.brands (slug, name, website)
values ('the-ordinary', 'The Ordinary', 'https://www.theordinary.com')
on conflict (slug) do nothing;

insert into public.brands (slug, name, website)
values ('paulas-choice', 'Paula''s Choice', 'https://www.paulaschoice.com')
on conflict (slug) do nothing;

insert into public.brands (slug, name, website)
values ('cosrx', 'COSRX', 'https://www.cosrx.com')
on conflict (slug) do nothing;

insert into public.brands (slug, name, website)
values ('olay', 'Olay', 'https://www.olay.com')
on conflict (slug) do nothing;

insert into public.brands (slug, name, website)
values ('skinceuticals', 'SkinCeuticals', 'https://www.skinceuticals.com')
on conflict (slug) do nothing;

insert into public.brands (slug, name, website)
values ('neutrogena', 'Neutrogena', 'https://www.neutrogena.com')
on conflict (slug) do nothing;

insert into public.brands (slug, name, website)
values ('supergoop', 'Supergoop', 'https://www.supergoop.com')
on conflict (slug) do nothing;

insert into public.brands (slug, name, website)
values ('biossance', 'Biossance', 'https://www.biossance.com')
on conflict (slug) do nothing;

-- ---------- Products ----------

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('cerave-hydrating-cleanser', 'Hydrating Facial Cleanser', 1, 'cleanser', 'Gentle daily cleanser with ceramides.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('cerave-moisturizing-cream', 'Moisturizing Cream', 1, 'moisturizer', 'Ceramide-rich barrier repair cream.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('cerave-vitamin-c-serum', 'Skin Renewing Vitamin C Serum', 1, 'serum', 'Brightening vitamin C serum.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('lrposay-cleanser', 'Effaclar Purifying Foaming Gel', 2, 'cleanser', 'Salicylic acid cleanser for blemish-prone skin.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('lrposay-cicaplast', 'Cicaplast Baume B5+', 2, 'treatment', 'Multi-purpose repairing balm.', 'better', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('lrposay-anthelios', 'Anthelios UVMune 400', 2, 'sunscreen', 'High-protection mineral sunscreen.', 'better', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('ordinary-niacinamide', 'Niacinamide 10% + Zinc 1%', 3, 'serum', 'Multi-tasking serum for redness and pores.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('ordinary-aha-30', 'AHA 30% + BHA 2% Peeling Solution', 3, 'exfoliant', 'Weekly resurfacing treatment.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('ordinary-ha', 'Hyaluronic Acid 2% + B5', 3, 'serum', 'Hydration serum for dry and dehydrated skin.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('ordinary-azelaic', 'Azelaic Acid Suspension 10%', 3, 'serum', 'Brightening and calming treatment.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('ordinary-bakuchiol', 'Bakuchiol', 3, 'serum', 'Gentle anti-aging retinol alternative.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('paulas-choice-2pct-bha', '2% BHA Liquid Exfoliant', 4, 'exfoliant', 'Cult-favorite BHA for pores and breakouts.', 'better', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('paulas-choice-8pct-aha', '8% AHA Gel Exfoliant', 4, 'exfoliant', 'Weekly surface exfoliant for texture.', 'better', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('paulas-choice-c15', 'C15 Super Booster', 4, 'serum', 'Potent 15% vitamin C brightener.', 'better', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('cosrx-snail', 'Snail Mucin 96%', 5, 'serum', 'Hydrating and repairing snail mucin.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('cosrx-bha', 'BHA Blackhead Power Liquid', 5, 'exfoliant', 'Daily BHA exfoliant for blackheads.', 'good', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('olay-regenerist-retinol', 'Regenerist Retinol 24 Night', 6, 'treatment', 'Overnight retinol treatment for lines.', 'better', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('neutrogena-rapid-wrinkle', 'Rapid Wrinkle Repair Retinol', 8, 'serum', 'Fast-absorbing retinol serum.', 'better', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('supergoop-unseen', 'Unseen Sunscreen SPF 40', 10, 'sunscreen', 'Invisible mineral SPF.', 'better', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
values ('biossance-squalane', '100% Squalane Oil', 12, 'oil', 'Lightweight moisture-mimicking oil.', 'good', true)
on conflict (slug) do nothing;

-- ---------- Product-Ingredient links ----------

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (1, 11, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (2, 11, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (2, 10, null, 2)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (3, 4, 10, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (4, 1, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (5, 8, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (6, 15, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (7, 2, 10, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (7, 15, 1, 2)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (8, 14, 30, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (9, 10, 2, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (10, 3, 10, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (11, 7, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (12, 1, 2, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (13, 14, 8, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (14, 4, 15, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (15, 8, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (16, 1, 2, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (17, 5, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (18, 5, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (19, 15, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (20, 9, null, 1)
on conflict (product_id, ingredient_id) do nothing;

-- ---------- Product Availability ----------

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (1, 'US', 'sephora', 'https://www.sephora.com/product/hydrating-facial-cleanser-P439009', 1499, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (2, 'US', 'sephora', 'https://www.sephora.com/product/moisturizing-cream-P123456', 1699, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (3, 'US', 'sephora', 'https://www.sephora.com/product/skin-renewing-vitamin-c-serum', 2199, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (4, 'US', 'sephora', 'https://www.sephora.com/product/effaclar-purifying-foaming-gel', 1499, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (5, 'US', 'sephora', 'https://www.sephora.com/product/cicaplast-baume-b5-plus', 1399, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (6, 'US', 'sephora', 'https://www.sephora.com/product/anthelios-uvmune-400', 3600, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (7, 'US', 'sephora', 'https://www.sephora.com/product/niacinamide-10-zinc-1', 680, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (8, 'US', 'sephora', 'https://www.sephora.com/product/aha-30-bha-2-peeling-solution', 960, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (9, 'US', 'sephora', 'https://www.sephora.com/product/hyaluronic-acid-2-b5', 720, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (10, 'US', 'sephora', 'https://www.sephora.com/product/azelaic-acid-suspension-10', 990, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (11, 'US', 'sephora', 'https://www.sephora.com/product/bakuchiol', 1000, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (12, 'US', 'sephora', 'https://www.sephora.com/product/2-bha-liquid-exfoliant', 3200, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (13, 'US', 'sephora', 'https://www.sephora.com/product/8-aha-gel-exfoliant', 2900, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (14, 'US', 'sephora', 'https://www.sephora.com/product/c15-super-booster', 4400, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (15, 'US', 'sephora', 'https://www.sephora.com/product/snail-mucin-96', 1600, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (16, 'US', 'sephora', 'https://www.sephora.com/product/bha-blackhead-power-liquid', 1700, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (17, 'US', 'sephora', 'https://www.sephora.com/product/regenerist-retinol-24-night', 2899, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (18, 'US', 'sephora', 'https://www.sephora.com/product/rapid-wrinkle-repair-retinol', 2199, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (19, 'US', 'sephora', 'https://www.sephora.com/product/unseen-sunscreen-spf-40', 2200, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into public.product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (20, 'US', 'sephora', 'https://www.sephora.com/product/100-squalane-oil', 2400, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;
