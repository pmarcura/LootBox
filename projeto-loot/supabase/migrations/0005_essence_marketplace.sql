-- Essence, dissolution and marketplace
-- essence_balance on profiles
alter table profiles
  add column if not exists essence_balance bigint not null default 0;

comment on column profiles.essence_balance is 'Currency earned by dissolving duplicate collectibles';

-- Lootbox tiers
create table if not exists lootbox_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  cost_essence int not null check (cost_essence > 0),
  prob_common numeric(5,4) not null,
  prob_uncommon numeric(5,4) not null,
  prob_rare numeric(5,4) not null,
  prob_epic numeric(5,4) not null,
  prob_legendary numeric(5,4) not null,
  constraint lootbox_probs_sum check (
    prob_common + prob_uncommon + prob_rare + prob_epic + prob_legendary = 1
  )
);

alter table lootbox_tiers enable row level security;

create policy lootbox_tiers_select_public
  on lootbox_tiers for select
  using (true);

-- Seed tiers
insert into lootbox_tiers (slug, name, cost_essence, prob_common, prob_uncommon, prob_rare, prob_epic, prob_legendary)
values
  ('bronze', 'Lootbox Bronze', 50, 0.60, 0.25, 0.10, 0.04, 0.01),
  ('silver', 'Lootbox Prata', 150, 0.50, 0.30, 0.12, 0.06, 0.02),
  ('gold', 'Lootbox Ouro', 500, 0.30, 0.35, 0.20, 0.10, 0.05)
on conflict (slug) do nothing;

-- RLS: allow users to delete their own inventory rows (for dissolution)
create policy user_inventory_delete_own
  on user_inventory for delete
  using (auth.uid() = user_id);

-- Dissolve cards into essence
-- Essence per rarity: common=5, uncommon=15, rare=50, epic=150, legendary=500
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

  delete from user_inventory
  where id = any(p_inventory_ids)
    and user_id = v_user_id;

  update profiles
  set essence_balance = essence_balance + v_total_essence
  where id = v_user_id;

  dissolved_count := v_count;
  essence_earned := v_total_essence;
  return next;
end;
$$;

-- Purchase lootbox with essence
create or replace function purchase_lootbox(p_tier_slug text)
returns table (
  inventory_id uuid,
  collectible_id uuid,
  rarity rarity,
  collectible_name text,
  collectible_slug text
)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_user_id uuid := auth.uid();
  v_tier lootbox_tiers%rowtype;
  v_roll double precision;
  v_rarity rarity;
  v_collectible_id uuid;
  v_inventory_id uuid;
  v_result_rarity rarity;
  v_result_name text;
  v_result_slug text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_tier
  from lootbox_tiers
  where slug = p_tier_slug
  for update;

  if not found then
    raise exception 'tier_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  update profiles
  set essence_balance = essence_balance - v_tier.cost_essence
  where id = v_user_id
    and essence_balance >= v_tier.cost_essence;

  if not found then
    raise exception 'insufficient_essence';
  end if;

  v_roll := random();
  if v_roll < v_tier.prob_common then
    v_rarity := 'common';
  elsif v_roll < v_tier.prob_common + v_tier.prob_uncommon then
    v_rarity := 'uncommon';
  elsif v_roll < v_tier.prob_common + v_tier.prob_uncommon + v_tier.prob_rare then
    v_rarity := 'rare';
  elsif v_roll < v_tier.prob_common + v_tier.prob_uncommon + v_tier.prob_rare + v_tier.prob_epic then
    v_rarity := 'epic';
  else
    v_rarity := 'legendary';
  end if;

  select c.id, c.rarity, c.name, c.slug
  into v_collectible_id, v_result_rarity, v_result_name, v_result_slug
  from collectibles_catalog c
  where c.rarity = v_rarity
  order by random()
  limit 1;

  if v_collectible_id is null then
    update profiles set essence_balance = essence_balance + v_tier.cost_essence where id = v_user_id;
    raise exception 'no_collectible_for_rarity';
  end if;

  insert into user_inventory (user_id, collectible_id, source)
  values (v_user_id, v_collectible_id, 'lootbox')
  returning id into v_inventory_id;

  return query
  select v_inventory_id, v_collectible_id, v_result_rarity, v_result_name, v_result_slug;
end;
$$;

grant execute on function dissolve_cards(uuid[]) to authenticated;
grant execute on function purchase_lootbox(text) to authenticated;
