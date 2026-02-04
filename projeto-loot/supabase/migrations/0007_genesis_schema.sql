-- Projeto Genesis: vessels stats, strains, user_strains, user_cards, is_used

-- 1.1 collectibles_catalog: base stats (vessels)
alter table collectibles_catalog
  add column if not exists base_hp int not null default 0,
  add column if not exists base_atk int not null default 0,
  add column if not exists base_mana int not null default 0;

comment on column collectibles_catalog.base_hp is 'Base HP for battle/fusion';
comment on column collectibles_catalog.base_atk is 'Base ATK for battle/fusion';
comment on column collectibles_catalog.base_mana is 'Base mana cost for battle/fusion';

-- 1.2 strain_family enum and strains_catalog
do $$
begin
  if not exists (select 1 from pg_type where typname = 'strain_family') then
    create type strain_family as enum ('NEURO', 'SHELL', 'PSYCHO');
  end if;
end $$;

create table if not exists strains_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  rarity rarity not null,
  family strain_family not null,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists strains_catalog_rarity_idx on strains_catalog (rarity);
create index if not exists strains_catalog_family_idx on strains_catalog (family);

alter table strains_catalog enable row level security;

create policy strains_catalog_select_public
  on strains_catalog for select
  using (true);

create policy strains_catalog_service_write
  on strains_catalog for all
  to service_role
  using (true)
  with check (true);

-- 1.3 user_inventory: is_used
alter table user_inventory
  add column if not exists is_used boolean not null default false;

comment on column user_inventory.is_used is 'True when consumed in fusion (cannot dissolve)';

-- 1.4 user_strains (strain instances)
create table if not exists user_strains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strain_id uuid not null references strains_catalog(id),
  acquired_at timestamptz not null default now(),
  source text not null default 'redemption' check (source in ('redemption', 'lootbox')),
  is_used boolean not null default false
);

create index if not exists user_strains_user_recent_idx
  on user_strains (user_id, acquired_at desc);

alter table user_strains enable row level security;

create policy user_strains_select_own
  on user_strains for select
  using (auth.uid() = user_id);

create policy user_strains_insert_own
  on user_strains for insert
  with check (auth.uid() = user_id);

-- 1.5 user_cards (fused cards)
create table if not exists user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_id text not null unique,
  vessel_inventory_id uuid not null references user_inventory(id),
  strain_id uuid not null references strains_catalog(id),
  final_hp int not null,
  final_atk int not null,
  mana_cost int not null,
  keyword text not null check (keyword in ('OVERCLOCK', 'BLOCKER', 'VAMPIRISM')),
  created_at timestamptz not null default now()
);

create index if not exists user_cards_user_idx on user_cards (user_id);

alter table user_cards enable row level security;

create policy user_cards_select_own
  on user_cards for select
  using (auth.uid() = user_id);

-- 1.6 dissolve_cards: only allow dissolving when is_used = false
create or replace function dissolve_cards(p_inventory_ids uuid[])
returns table (dissolved_count int, essence_earned bigint)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_essence bigint := 0;
  v_count int := 0;
  v_row record;
  v_essence_per_rarity bigint;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if array_length(p_inventory_ids, 1) is null or array_length(p_inventory_ids, 1) = 0 then
    raise exception 'empty_inventory_ids';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  for v_row in
    select ui.id, c.rarity
    from user_inventory ui
    join collectibles_catalog c on c.id = ui.collectible_id
    where ui.id = any(p_inventory_ids)
      and ui.user_id = v_user_id
      and ui.is_used = false
  loop
    v_essence_per_rarity := case v_row.rarity
      when 'common' then 5
      when 'uncommon' then 15
      when 'rare' then 50
      when 'epic' then 150
      when 'legendary' then 500
      else 5
    end;
    v_total_essence := v_total_essence + v_essence_per_rarity;
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'no_valid_cards';
  end if;

  if v_count < array_length(p_inventory_ids, 1) then
    raise exception 'unauthorized_cards';
  end if;

  update redemption_codes
  set redeemed_inventory_id = null
  where redeemed_inventory_id = any(p_inventory_ids);

  delete from user_inventory
  where id = any(p_inventory_ids)
    and user_id = v_user_id
    and is_used = false;

  update profiles
  set essence_balance = essence_balance + v_total_essence
  where id = v_user_id;

  dissolved_count := v_count;
  essence_earned := v_total_essence;
  return next;
end;
$$;
