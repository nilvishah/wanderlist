-- ============================================================
-- Wanderlist schema
-- ============================================================
create extension if not exists pgcrypto;

-- ---------- Tables ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default 'terracotta'
              check (color in ('terracotta','teal','amber','pink','blue')),
  scene       text not null default 'other'
              check (scene in ('hike','beach','city','culture','other')),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.places (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid not null references public.categories(id) on delete cascade,
  name             text not null,
  location         text,
  lat              double precision,
  lng              double precision,
  google_place_id  text,
  starred          boolean not null default false,
  description      text,
  notes            text,
  photo_url        text,
  created_at       timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id          uuid primary key default gen_random_uuid(),
  place_id    uuid not null references public.places(id) on delete cascade,
  text        text not null,
  is_checked  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists places_category_idx  on public.places(category_id);
create index if not exists places_starred_idx   on public.places(starred) where starred;
create index if not exists checklist_place_idx  on public.checklist_items(place_id, sort_order);

-- ---------- Owner check (single user) ----------
create or replace function public.is_owner()
returns boolean
language sql stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'you@example.com'
$$;

-- ---------- Row Level Security ----------
alter table public.categories      enable row level security;
alter table public.places          enable row level security;
alter table public.checklist_items enable row level security;

drop policy if exists "owner_all" on public.categories;
drop policy if exists "owner_all" on public.places;
drop policy if exists "owner_all" on public.checklist_items;

create policy "owner_all" on public.categories
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner_all" on public.places
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "owner_all" on public.checklist_items
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

revoke all on public.categories, public.places, public.checklist_items from anon;

-- ---------- Widget view (anon read-only) ----------
-- Intentionally NOT security_invoker: the view runs as its owner, so anon
-- can read starred places through it while the base tables stay locked.
create or replace view public.starred_places as
select
  p.id,
  p.name,
  p.location,
  p.description,
  c.name  as category,
  c.color as color,
  c.scene as scene
from public.places p
join public.categories c on c.id = p.category_id
where p.starred = true;

revoke all on public.starred_places from anon, authenticated;
grant select on public.starred_places to anon, authenticated;

-- ============================================================
-- Seed data (skip this section if you already have data)
-- ============================================================
with cats as (
  insert into public.categories (name, color, scene, sort_order) values
    ('Hikes',   'terracotta', 'hike',  0),
    ('Beaches', 'teal',       'beach', 1),
    ('Cities',  'amber',      'city',  2)
  returning id, name
)
insert into public.places (category_id, name, location, lat, lng, starred, description)
select cats.id, v.name, v.location, v.lat, v.lng, v.starred, v.description
from cats
join (values
  ('Hikes',   'Dolomite Peaks',      'South Tyrol, Italy',       46.4102,  11.8440, true,  'Saw-toothed limestone rising above alpine meadows.'),
  ('Hikes',   'Torres del Paine',    'Patagonia, Chile',        -50.9423, -73.4068, false, 'Windswept granite towers at the edge of Patagonia.'),
  ('Hikes',   'The Narrows',         'Zion, Utah',               37.3048, -112.9474, false, 'Wading upstream between thousand-foot walls of glowing sandstone.'),
  ('Beaches', 'Navagio Beach',       'Zakynthos, Greece',        37.8590,  20.6248, true,  'A rusted shipwreck asleep in impossibly blue water.'),
  ('Beaches', 'Railay Beach',        'Krabi, Thailand',           8.0113,  98.8378, false, 'Limestone cliffs, longtail boats, and warm evening tides.'),
  ('Beaches', 'Whitehaven Beach',    'Whitsundays, Australia',  -20.2823, 149.0390, false, 'Silica sand so white it squeaks underfoot.'),
  ('Cities',  'Kyoto Backstreets',   'Kyoto, Japan',             35.0037, 135.7788, true,  'Lantern-lit lanes where wooden teahouses keep their secrets.'),
  ('Cities',  'Lisbon',              'Portugal',                 38.7223,  -9.1393, false, 'Yellow trams rattling up hills toward tiled rooftops.'),
  ('Cities',  'Mexico City',         'Mexico',                   19.4326, -99.1332, false, 'Jacaranda avenues, taco smoke, and endless museum afternoons.')
) as v(cat, name, location, lat, lng, starred, description)
  on v.cat = cats.name;

insert into public.checklist_items (place_id, text, is_checked, sort_order)
select p.id, v.text, v.checked, v.ord
from public.places p
join (values
  ('Dolomite Peaks',    'Book a rifugio for the Alta Via 1', false, 0),
  ('Dolomite Peaks',    'Go late June to mid-September',     true,  1),
  ('Dolomite Peaks',    'Pack layers and trekking poles',    false, 2),
  ('Navagio Beach',     'Boat tour from Porto Vromi',        false, 0),
  ('Navagio Beach',     'Viewpoint at sunrise',              false, 1),
  ('Kyoto Backstreets', 'Walk Gion after dark',              false, 0),
  ('Kyoto Backstreets', 'Reserve a kaiseki dinner',          false, 1)
) as v(place, text, checked, ord)
  on v.place = p.name;