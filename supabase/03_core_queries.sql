-- ============================================================
-- 03_core_queries.sql — Recommendation logic + RPC
-- Run after 01_schema.sql and 02_seed_data.sql
-- ============================================================

-- ---------- Reusable RPC: get_recommendations ----------
-- Call from frontend:
--   const { data } = await supabase.rpc('get_recommendations', {
--     p_concern_slugs: ['redness','hyperpigmentation'],
--     p_country_code: 'US'
--   });

create or replace function public.get_recommendations(
  p_concern_slugs text[],
  p_country_code text default 'US'
)
returns table (
  concern_slug text,
  concern_label text,
  ingredient_slug text,
  ingredient_label text,
  product_slug text,
  product_name text,
  brand_name text,
  product_url text,
  price numeric,
  currency text,
  in_stock boolean,
  tier text,
  match_score numeric
)
language sql
stable
as $$
  with target_concerns as (
    select id, slug, label
    from public.skin_concerns
    where slug = any(p_concern_slugs)
  ),
  ranked_ingredients as (
    select
      tc.slug as concern_slug,
      tc.label as concern_label,
      i.slug as ingredient_slug,
      i.label as ingredient_label,
      ci.rank as ingredient_rank,
      row_number() over (partition by tc.id order by ci.rank) as rn
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
      ti.concern_label,
      ti.ingredient_slug,
      ti.ingredient_label,
      ti.ingredient_rank,
      p.slug as product_slug,
      p.name as product_name,
      b.name as brand_name,
      p.url as product_url,
      pa.price,
      pa.currency,
      pa.in_stock,
      case
        when ti.ingredient_rank = 1 then 'hero'
        when ti.ingredient_rank = 2 then 'supporting'
        else 'supplemental'
      end as tier,
      -- match_score = ingredient rank weight + stock bonus
      (4 - ti.ingredient_rank) * 10
        + (case when pa.in_stock then 5 else -100 end) as match_score
    from top_ingredients ti
    join public.product_ingredients pi on pi.ingredient_id = (
      select id from public.ingredients where slug = ti.ingredient_slug
    )
    join public.products p on p.id = pi.product_id and p.is_active = true
    join public.brands b on b.id = p.brand_id
    left join public.product_availability pa
      on pa.product_id = p.id and pa.country_code = p_country_code
    where pi.rank <= 2
  )
  select *
  from product_matches
  where match_score > 0
  order by concern_slug, tier, match_score desc;
$$;

-- ---------- Convenience: top products per concern for a country ----------

create or replace function public.get_top_products_per_concern(
  p_concern_slugs text[],
  p_country_code text default 'US',
  p_limit int default 4
)
returns table (
  concern_slug text,
  concern_label text,
  product_slug text,
  product_name text,
  brand_name text,
  product_url text,
  price numeric,
  in_stock boolean,
  tier text
)
language sql
stable
as $$
  with concern_data as (
    select id, slug, label
    from public.skin_concerns
    where slug = any(p_concern_slugs)
  ),
  ingredient_rank as (
    select
      tc.slug as concern_slug,
      tc.label as concern_label,
      i.slug as ingredient_slug,
      ci.rank as ing_rank
    from concern_data tc
    join public.concern_ingredients ci on ci.concern_id = tc.id
    join public.ingredients i on i.id = ci.ingredient_id
  ),
  ranked as (
    select
      ir.concern_slug,
      ir.concern_label,
      p.slug as product_slug,
      p.name as product_name,
      b.name as brand_name,
      p.url as product_url,
      pa.price,
      pa.in_stock,
      case
        when ir.ing_rank = 1 then 'hero'
        when ir.ing_rank = 2 then 'supporting'
        else 'supplemental'
      end as tier,
      row_number() over (
        partition by ir.concern_slug, ir.ing_rank
        order by pa.in_stock desc, pa.price asc nulls last
      ) as rn
    from ingredient_rank ir
    join public.product_ingredients pi
      on pi.ingredient_id = (select id from public.ingredients where slug = ir.ingredient_slug)
    join public.products p on p.id = pi.product_id and p.is_active = true
    join public.brands b on b.id = p.brand_id
    left join public.product_availability pa
      on pa.product_id = p.id and pa.country_code = p_country_code
    where pi.rank <= 2
  )
  select concern_slug, concern_label, product_slug, product_name,
         brand_name, product_url, price, in_stock, tier
  from ranked
  where rn <= p_limit
  order by concern_slug, tier, in_stock desc, price asc;
$$;

-- ---------- Grant execute to anon + authenticated ----------

grant execute on function public.get_recommendations(text[], text) to anon, authenticated;
grant execute on function public.get_top_products_per_concern(text[], text, int) to anon, authenticated;
