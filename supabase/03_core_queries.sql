-- ============================================================
-- 03_core_queries.sql — Recommendation logic + RPC
-- Run after 01_schema.sql and 02_seed_data.sql
-- Matches confirmed schema: UUIDs, relevance_score, is_headline_ingredient
-- ============================================================

-- Drop existing functions so we can change return types

drop function if exists public.get_recommendations(text[], text);
drop function if exists public.get_top_products_per_concern(text[], text, int);

-- ---------- RPC: get_recommendations ----------

create or replace function public.get_recommendations(
  p_concern_slugs text[],
  p_country_code text default 'US'
)
returns table (
  concern_slug text,
  concern_display_name text,
  ingredient_slug text,
  ingredient_label text,
  headline_ingredient text,
  product_slug text,
  product_name text,
  brand_name text,
  purchase_url text,
  price_local_cents int,
  local_currency text,
  in_stock boolean,
  tier text,
  match_score numeric
)
language sql
stable
as $$
  with target_concerns as (
    select id, slug, display_name as concern_display_name
    from public.skin_concerns
    where slug = any(p_concern_slugs)
  ),
  ranked_ingredients as (
    select
      tc.slug as concern_slug,
      tc.concern_display_name,
      i.slug as ingredient_slug,
      i.display_name as ingredient_label,
      i.display_name as headline_ingredient,
      ci.relevance_score as ingredient_rank,
      row_number() over (partition by tc.id order by ci.relevance_score desc) as rn
    from target_concerns tc
    join public.concern_ingredients ci on ci.concern_id = tc.id
    join public.ingredients i on i.id = ci.ingredient_id
  ),
  top_ingredients as (
    select * from ranked_ingredients where rn <= 3
  ),
  product_matches as (
    select
      ti.concern_slug,
      ti.concern_display_name,
      ti.ingredient_slug,
      ti.ingredient_label,
      ti.headline_ingredient,
      p.slug as product_slug,
      p.name as product_name,
      b.name as brand_name,
      pa.purchase_url,
      pa.price_local_cents,
      pa.local_currency,
      pa.in_stock,
      case
        when ti.ingredient_rank >= 80 then 'good'
        when ti.ingredient_rank >= 60 then 'better'
        else 'best'
      end as tier,
      ti.ingredient_rank
        + (case when pa.in_stock then 5 else -100 end) as match_score
    from top_ingredients ti
    join public.product_ingredients pi on pi.ingredient_id = (
      select id from public.ingredients where slug = ti.ingredient_slug
    )
    join public.products p on p.id = pi.product_id and p.is_active = true
    join public.brands b on b.id = p.brand_id
    left join public.product_availability pa
      on pa.product_id = p.id and pa.country_code = p_country_code
    where pi.is_headline_ingredient = true
  )
  select *
  from product_matches
  where match_score > 0
  order by concern_slug, tier, match_score desc;
$$;

-- ---------- RPC: get_top_products_per_concern ----------

create or replace function public.get_top_products_per_concern(
  p_concern_slugs text[],
  p_country_code text default 'US',
  p_limit int default 4
)
returns table (
  concern_slug text,
  concern_display_name text,
  product_slug text,
  product_name text,
  brand_name text,
  purchase_url text,
  price_local_cents int,
  in_stock boolean,
  tier text
)
language sql
stable
as $$
  with concern_data as (
    select id, slug, display_name as concern_display_name
    from public.skin_concerns
    where slug = any(p_concern_slugs)
  ),
  ingredient_rank as (
    select
      tc.slug as concern_slug,
      tc.concern_display_name,
      i.slug as ingredient_slug,
      ci.relevance_score as ing_rank
    from concern_data tc
    join public.concern_ingredients ci on ci.concern_id = tc.id
    join public.ingredients i on i.id = ci.ingredient_id
  ),
  ranked as (
    select
      ir.concern_slug,
      ir.concern_display_name,
      p.slug as product_slug,
      p.name as product_name,
      b.name as brand_name,
      pa.purchase_url,
      pa.price_local_cents,
      pa.in_stock,
      case
        when ir.ing_rank >= 80 then 'good'
        when ir.ing_rank >= 60 then 'better'
        else 'best'
      end as tier,
      row_number() over (
        partition by ir.concern_slug, ir.ing_rank
        order by pa.in_stock desc, pa.price_local_cents asc nulls last
      ) as rn
    from ingredient_rank ir
    join public.product_ingredients pi
      on pi.ingredient_id = (select id from public.ingredients where slug = ir.ingredient_slug)
    join public.products p on p.id = pi.product_id and p.is_active = true
    join public.brands b on b.id = p.brand_id
    left join public.product_availability pa
      on pa.product_id = p.id and pa.country_code = p_country_code
    where pi.is_headline_ingredient = true
  )
  select concern_slug, concern_display_name, product_slug, product_name,
         brand_name, purchase_url, price_local_cents, in_stock, tier
  from ranked
  where rn <= p_limit
  order by concern_slug, tier, in_stock desc, price_local_cents asc;
$$;

-- ---------- Grant execute ----------

grant execute on function public.get_recommendations(text[], text) to anon, authenticated;
grant execute on function public.get_top_products_per_concern(text[], text, int) to anon, authenticated;
