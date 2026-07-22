-- ============================================================
-- 02b_additional_concerns.sql — additional concerns + products
-- Run after 02_seed_data.sql
-- One INSERT per row.
-- ============================================================

-- ---------- Additional concerns ----------

insert into skin_concerns (slug, display_name, description, source_api_key, display_order)
values ('acne-inflammation', 'Acne & Inflammation', 'Active breakouts, bumps, or inflammation', 'acne_score', 5)
on conflict (slug) do nothing;

insert into skin_concerns (slug, display_name, description, source_api_key, display_order)
values ('pores', 'Pores', 'Visible pore size or congestion', 'pore_score', 6)
on conflict (slug) do nothing;

insert into skin_concerns (slug, display_name, description, source_api_key, display_order)
values ('dark-circles', 'Dark Circles', 'Dark circles or under-eye dullness', 'dark_circle_score', 7)
on conflict (slug) do nothing;

insert into skin_concerns (slug, display_name, description, source_api_key, display_order)
values ('moisture', 'Moisture', 'Hydration level — dryness vs. balanced', 'moisture_score', 8)
on conflict (slug) do nothing;

-- ---------- Additional ingredients ----------

insert into ingredients (slug, display_name, inci_name, aliases, description, caution_note, pregnancy_safe)
values ('salicylic-acid', 'Salicylic Acid (BHA)', 'Salicylic Acid', ARRAY['BHA'], 'Oil-soluble exfoliant that clears pores and reduces breakouts.', 'Can be drying; start with 2-3x per week.', false)
on conflict (slug) do nothing;

insert into ingredients (slug, display_name, inci_name, aliases, description, caution_note, pregnancy_safe)
values ('zinc-oxide-spf', 'Zinc Oxide (SPF)', 'Zinc Oxide', ARRAY['Mineral Sunscreen'], 'Mineral sunscreen — protects against spots and aging.', 'Reapply every 2 hours in direct sun.', true)
on conflict (slug) do nothing;

insert into ingredients (slug, display_name, inci_name, aliases, description, caution_note, pregnancy_safe)
values ('hyaluronic-acid', 'Hyaluronic Acid', 'Sodium Hyaluronate', ARRAY['HA'], 'Hydration hero — draws moisture into the skin.', 'Apply to damp skin for best results; may feel sticky in humid climates.', true)
on conflict (slug) do nothing;

-- ---------- Concern-ingredient links ----------

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (5, 1, 1)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (5, 2, 2)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (5, 8, 3)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (5, 15, 4)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (6, 1, 1)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (6, 2, 2)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (6, 5, 3)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (6, 10, 4)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (7, 4, 1)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (7, 2, 2)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (7, 6, 3)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (7, 10, 4)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (8, 10, 1)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (8, 9, 2)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (8, 11, 3)
on conflict (concern_id, ingredient_id) do nothing;

insert into concern_ingredients (concern_id, ingredient_id, rank)
values (8, 15, 4)
on conflict (concern_id, ingredient_id) do nothing;

-- ---------- Products for new concerns ----------

insert into products (slug, name, brand_id, product_type, description, tier, is_active)
values ('ordinary-niacinamide-10', 'Niacinamide 10% + Zinc 1%', 3, 'serum', 'Multi-tasking serum for redness, pores, and tone.', 'good', true)
on conflict (slug) do nothing;

insert into products (slug, name, brand_id, product_type, description, tier, is_active)
values ('ordinary-ha', 'Hyaluronic Acid 2% + B5', 3, 'serum', 'Hydration serum for dry skin and under-eye plumping.', 'good', true)
on conflict (slug) do nothing;

insert into products (slug, name, brand_id, product_type, description, tier, is_active)
values ('ordinary-bha', 'Salicylic Acid 2% Solution', 3, 'exfoliant', 'BHA exfoliant for acne-prone skin and clogged pores.', 'good', true)
on conflict (slug) do nothing;

insert into products (slug, name, brand_id, product_type, description, tier, is_active)
values ('pc-2pct-bha', '2% BHA Liquid Exfoliant', 4, 'exfoliant', 'Cult-favorite BHA for pores and breakouts.', 'better', true)
on conflict (slug) do nothing;

insert into products (slug, name, brand_id, product_type, description, tier, is_active)
values ('ordinary-squalane', '100% Squalane Oil', 3, 'oil', 'Lightweight moisture mimic for dry skin.', 'good', true)
on conflict (slug) do nothing;

insert into products (slug, name, brand_id, product_type, description, tier, is_active)
values ('cerave-moisturizer', 'Moisturizing Cream', 1, 'moisturizer', 'Ceramide-based barrier repair for dry skin.', 'good', true)
on conflict (slug) do nothing;

insert into products (slug, name, brand_id, product_type, description, tier, is_active)
values ('supergoop-unseen', 'Unseen Sunscreen SPF 40', 10, 'sunscreen', 'Invisible mineral SPF.', 'better', true)
on conflict (slug) do nothing;

-- ---------- Product-ingredient links ----------

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (21, 2, 10, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (21, 15, 1, 2)
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (22, 10, 2, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (23, 1, 2, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (24, 1, 2, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (25, 9, 100, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (26, 11, null, 1)
on conflict (product_id, ingredient_id) do nothing;

insert into product_ingredients (product_id, ingredient_id, concentration_pct, rank)
values (27, 15, null, 1)
on conflict (product_id, ingredient_id) do nothing;

-- ---------- Availability ----------

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (21, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 680, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (22, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 720, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (23, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 580, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (24, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 3200, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (25, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 800, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (26, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 1600, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;

insert into product_availability (product_id, country_code, retailer, purchase_url, price_local_cents, local_currency, is_regulatory_approved, in_stock)
values (27, 'US', 'amazon', 'https://www.amazon.com/dp/PLACEHOLDER', 2200, 'USD', true, true)
on conflict (product_id, country_code, retailer) do nothing;
