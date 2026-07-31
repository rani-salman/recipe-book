-- Recipe Book database schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query) BEFORE seed.sql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Ingredients: the shared reference sheet (nutrition + price per pack)
-- ---------------------------------------------------------------------
create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  calories numeric not null default 0,      -- kcal per 100g
  protein numeric not null default 0,       -- g per 100g
  fat numeric not null default 0,           -- g per 100g
  sugar numeric not null default 0,         -- g per 100g
  fiber numeric not null default 0,         -- g per 100g
  pack_label text not null,                 -- e.g. "1 kg", "185 g can"
  pack_size_g numeric not null,             -- pack size in grams/ml
  price_sar numeric not null default 0,     -- price of the whole pack, in SAR
  price_source text not null default 'Market estimate',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Recipes: one row per recipe, grouped by meal category
-- ---------------------------------------------------------------------
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  meal_category text not null check (meal_category in ('Breakfast', 'Lunch', 'Dessert', 'Ice Cream', 'Snack')),
  rating int check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Recipe ingredients: join table, one row per ingredient in a recipe
-- ---------------------------------------------------------------------
create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantity_g numeric not null check (quantity_g > 0)
);

create index if not exists idx_recipe_ingredients_recipe on recipe_ingredients(recipe_id);
create index if not exists idx_recipe_ingredients_ingredient on recipe_ingredients(ingredient_id);

-- ---------------------------------------------------------------------
-- Convenience view: per-recipe totals (calories, macros, price)
-- Used for the recipe list; the recipe detail page computes live totals
-- client-side while you're editing.
-- ---------------------------------------------------------------------
create or replace view recipe_totals as
select
  r.id as recipe_id,
  r.name,
  r.meal_category,
  r.rating,
  r.notes,
  r.created_at,
  coalesce(sum(i.calories * ri.quantity_g / 100), 0) as total_calories,
  coalesce(sum(i.protein  * ri.quantity_g / 100), 0) as total_protein,
  coalesce(sum(i.fat      * ri.quantity_g / 100), 0) as total_fat,
  coalesce(sum(i.sugar    * ri.quantity_g / 100), 0) as total_sugar,
  coalesce(sum(i.fiber    * ri.quantity_g / 100), 0) as total_fiber,
  coalesce(sum(i.price_sar / i.pack_size_g * ri.quantity_g), 0) as total_price_sar,
  count(ri.id) as ingredient_count
from recipes r
left join recipe_ingredients ri on ri.recipe_id = r.id
left join ingredients i on i.id = ri.ingredient_id
group by r.id, r.name, r.meal_category, r.rating, r.notes, r.created_at;

-- ---------------------------------------------------------------------
-- Row Level Security
-- This is a personal single-user app with no login screen, so we open
-- read/write to anyone holding the public "anon" API key (which is
-- meant to be public -- it's baked into your deployed frontend).
--
-- IMPORTANT: this means anyone who finds your site URL can add/edit/
-- delete your recipes. That's fine for a private link only you use.
-- If you ever want this to be a public-facing site, add Supabase Auth
-- and tighten these policies to `using (auth.uid() = user_id)` instead.
-- ---------------------------------------------------------------------
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;

create policy "public read ingredients" on ingredients for select using (true);
create policy "public write ingredients" on ingredients for all using (true) with check (true);

create policy "public read recipes" on recipes for select using (true);
create policy "public write recipes" on recipes for all using (true) with check (true);

create policy "public read recipe_ingredients" on recipe_ingredients for select using (true);
create policy "public write recipe_ingredients" on recipe_ingredients for all using (true) with check (true);
