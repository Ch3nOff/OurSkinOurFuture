-- 02_seed_data.sql
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

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('salicylic-acid', 'Salicylic Acid (BHA)', 'Salicylic Acid', ARRAY['BHA'], 'Oil-soluble exfoliant', 'Paula''s Choice 2% BHA', 'Can be drying', false)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('niacinamide', 'Niacinamide', 'Niacinamide', ARRAY['Vitamin B3'], 'Calms redness', 'The Ordinary Niacinamide 10% + Zinc', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('azelaic-acid', 'Azelaic Acid', 'Azelaic Acid', ARRAY[], 'Dual-action', 'The Ordinary Azelaic Acid 10%', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('retinol', 'Retinol', 'Retinol', ARRAY[], 'Gold-standard for fine lines', 'Olay Regenerist', null, false)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('peptide-complex', 'Peptide Complex', 'Palmitoyl Tripeptide-5', ARRAY[], 'Supports firmness', 'The Ordinary Buffet', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('vitamin-c', 'Vitamin C (L-Ascorbic Acid)', 'Ascorbic Acid', ARRAY['L-Ascorbic Acid'], 'Brightens dark spots', 'SkinCeuticals C E Ferulic', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('bakuchiol', 'Bakuchiol', 'Bakuchiol', ARRAY[], 'Gentle retinol alternative', 'Herbivore Botanicals', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('centella-asiatica', 'Centella Asiatica (Cica)', 'Centella Asiatica Extract', ARRAY['Cica'], 'Soothes redness', 'La Roche-Posay Cicaplast', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('hyaluronic-acid', 'Hyaluronic Acid', 'Sodium Hyaluronate', ARRAY['HA'], 'Hydration hero', 'The Ordinary HA', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('squalane', 'Squalane', 'Squalane', ARRAY[], 'Mimics skin oils', 'Biossance Squalane', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('benzoyl-peroxide', 'Benzoyl Peroxide', 'Benzoyl Peroxide', ARRAY[], 'Antibacterial', 'La Roche-Posay Effaclar', null, false)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('zinc-oxide-spf', 'Zinc Oxide (SPF)', 'Zinc Oxide', ARRAY['Mineral Sunscreen'], 'Mineral sunscreen', 'La Roche-Posay Anthelios', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('tea-tree-oil', 'Tea Tree Oil', 'Melaleuca Alternifolia Leaf Oil', ARRAY[], 'Natural antibacterial', 'The Body Shop Tea Tree', null, true)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('aha-glycolic-acid', 'AHA / Glycolic Acid', 'Glycolic Acid', ARRAY['AHA'], 'Surface exfoliant', 'Paula''s Choice 8% AHA', null, false)
on conflict (slug) do nothing;

insert into public.ingredients (slug, display_name, inci_name, aliases, description, example_products, caution_note, pregnancy_safe)
values ('ceramides', 'Ceramides', 'Ceramide NP', ARRAY[], 'Barrier-repair lipids', 'CeraVe Moisturizing Cream', null, true)
on conflict (slug) do nothing;

-- NOTE: Concern-ingredient links removed because the SQL parser rejects string
-- literals in INSERT...SELECT/SELECT-FROM patterns in this editor.
-- Re-add them later once the core tables are working.

-- Brands
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

-- NOTE: Products, product_ingredients, and product_availability inserts removed
-- because the SQL parser rejects multi-row VALUES and/or string literals.
-- Replace the hardcoded IDs below with real IDs from your DB, then add them back.

-- Example replacement pattern if you want products:
-- insert into public.products (slug, name, brand_id, product_type, description, tier, is_active)
-- values ('cerave-hydrating-cleanser', 'Hydrating Facial Cleanser', 1, 'cleanser', 'Gentle', 'good', true)
-- on conflict (slug) do nothing;
