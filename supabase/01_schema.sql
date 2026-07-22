-- ============================================================
-- 01_schema.sql — Skin Analysis → Product Recommendation DB
-- Matches user's existing schema columns.
-- ============================================================

create table if not exists public.skin_concerns (
  id bigserial primary key,
  slug text not null unique,
  display_name text not null,
  description text,
  source_api_key text,
  display_order int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id bigserial primary key,
  slug text not null unique,
  display_name text not null,
  inci_name text,
  aliases text[],
  description text,
  caution_note text,
  pregnancy_safe boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists public.concern_ingredients (
  concern_id bigint not null references public.skin_concerns(id) on delete cascade,
  ingredient_id bigint not null references public.ingredients(id) on delete cascade,
  rank int not null default 0,
  evidence_note text,
  primary key (concern_id, ingredient_id)
);

create table if not exists public.brands (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  website text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  brand_id bigint not null references public.brands(id) on delete restrict,
  product_type text,
  description text,
  tier text check (tier in ('good','better','best')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_ingredients (
  product_id bigint not null references public.products(id) on delete cascade,
  ingredient_id bigint not null references public.ingredients(id) on delete cascade,
  concentration_pct numeric,
  rank int not null default 0,
  primary key (product_id, ingredient_id)
);

create table if not exists public.product_availability (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  country_code text not null,
  retailer text,
  purchase_url text,
  price_local_cents int,
  local_currency text default 'USD',
  is_regulatory_approved boolean not null default true,
  in_stock boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (product_id, country_code, retailer)
);

create index if not exists idx_concern_ingredients_concern on public.concern_ingredients(concern_id);
create index if not exists idx_concern_ingredients_ingredient on public.concern_ingredients(ingredient_id);
create index if not exists idx_products_brand on public.products(brand_id);
create index if not exists idx_product_availability_product on public.product_availability(product_id);
create index if not exists idx_product_availability_country on public.product_availability(country_code);

alter table public.skin_concerns enable row level security;
alter table public.ingredients enable row level security;
alter table public.concern_ingredients enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.product_availability enable row level security;

create policy "Allow public read on skin_concerns" on public.skin_concerns for select using (true);
create policy "Allow public read on ingredients" on public.ingredients for select using (true);
create policy "Allow public read on concern_ingredients" on public.concern_ingredients for select using (true);
create policy "Allow public read on brands" on public.brands for select using (true);
create policy "Allow public read on products" on public.products for select using (true);
create policy "Allow public read on product_ingredients" on public.product_ingredients for select using (true);
create policy "Allow public read on product_availability" on public.product_availability for select using (true);
