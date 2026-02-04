-- Phase 4: Unified catalog with JSONB attributes
-- Replaces collectibles_catalog and strains_catalog with a single catalog table.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'catalog_item_type') then
    create type catalog_item_type as enum ('vessel', 'strain', 'weapon');
  end if;
end $$;

create table if not exists catalog (
  id uuid primary key default gen_random_uuid(),
  type catalog_item_type not null,
  slug text not null,
  name text not null,
  rarity rarity not null,
  image_url text,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(type, slug)
);

create index if not exists catalog_type_rarity_idx on catalog (type, rarity);

comment on table catalog is 'Unified catalog: vessels, strains, and future item types. Attributes stored in JSONB.';

-- Migrate collectibles (vessels)
insert into catalog (id, type, slug, name, rarity, image_url, attributes, created_at, updated_at)
select
  id,
  'vessel'::catalog_item_type,
  slug,
  name,
  rarity,
  image_url,
  jsonb_build_object(
    'base_hp', coalesce(base_hp, 0),
    'base_atk', coalesce(base_atk, 0),
    'base_mana', coalesce(base_mana, 0),
    'series', series,
    'model_key', model_key,
    'lore', lore,
    'role', role,
    'tech', tech,
    'flavor_text', flavor_text
  ),
  created_at,
  updated_at
from collectibles_catalog
on conflict (id) do nothing;

-- Migrate strains
insert into catalog (id, type, slug, name, rarity, image_url, attributes, created_at, updated_at)
select
  id,
  'strain'::catalog_item_type,
  slug,
  name,
  rarity,
  image_url,
  jsonb_build_object(
    'family', family,
    'description', description,
    'penalty', penalty
  ),
  created_at,
  updated_at
from strains_catalog
on conflict (id) do nothing;

-- Update FKs: drop old, add new references to catalog
alter table user_inventory
  drop constraint if exists user_inventory_collectible_id_fkey;

alter table user_inventory
  add constraint user_inventory_collectible_id_fkey
  foreign key (collectible_id) references catalog(id);

alter table user_strains
  drop constraint if exists user_strains_strain_id_fkey;

alter table user_strains
  add constraint user_strains_strain_id_fkey
  foreign key (strain_id) references catalog(id);

alter table user_cards
  drop constraint if exists user_cards_vessel_collectible_id_fkey;

alter table user_cards
  add constraint user_cards_vessel_collectible_id_fkey
  foreign key (vessel_collectible_id) references catalog(id);

alter table user_cards
  drop constraint if exists user_cards_strain_id_fkey;

alter table user_cards
  add constraint user_cards_strain_id_fkey
  foreign key (strain_id) references catalog(id);

alter table audit_inventory_ledger
  drop constraint if exists audit_inventory_ledger_collectible_id_fkey;

alter table audit_inventory_ledger
  add constraint audit_inventory_ledger_collectible_id_fkey
  foreign key (collectible_id) references catalog(id);

alter table audit_strains_ledger
  drop constraint if exists audit_strains_ledger_strain_id_fkey;

alter table audit_strains_ledger
  add constraint audit_strains_ledger_strain_id_fkey
  foreign key (strain_id) references catalog(id);

-- Drop old tables
drop table if exists collectibles_catalog cascade;
drop table if exists strains_catalog cascade;

-- Create views for backward compatibility (Supabase/PostgREST exposes views as tables)
create view collectibles_catalog as
select
  id,
  slug,
  name,
  rarity,
  image_url,
  coalesce((attributes->>'base_hp')::int, 0) as base_hp,
  coalesce((attributes->>'base_atk')::int, 0) as base_atk,
  coalesce((attributes->>'base_mana')::int, 0) as base_mana,
  attributes->>'series' as series,
  attributes->>'model_key' as model_key,
  attributes->>'lore' as lore,
  attributes->>'role' as role,
  attributes->>'tech' as tech,
  attributes->>'flavor_text' as flavor_text,
  created_at,
  updated_at
from catalog
where type = 'vessel';

create view strains_catalog as
select
  id,
  slug,
  name,
  rarity,
  image_url,
  (attributes->>'family')::strain_family as family,
  attributes->>'description' as description,
  attributes->>'penalty' as penalty,
  created_at,
  updated_at
from catalog
where type = 'strain';
