-- Phase 2: Hard delete + Ledger
-- 1. Audit tables for consumed items (fusion/dissolved)
-- 2. user_cards: replace vessel_inventory_id with vessel_collectible_id (catalog reference)
-- 3. Update get_rarest_card_for_user to use vessel_collectible_id

-- 1. Audit ledgers
create table if not exists audit_inventory_ledger (
  id uuid primary key default gen_random_uuid(),
  original_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  collectible_id uuid not null references collectibles_catalog(id),
  source text not null,
  consumed_at timestamptz not null default now(),
  consumed_reason text not null check (consumed_reason in ('fusion', 'dissolved'))
);

create table if not exists audit_strains_ledger (
  id uuid primary key default gen_random_uuid(),
  original_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  strain_id uuid not null references strains_catalog(id),
  source text not null,
  consumed_at timestamptz not null default now(),
  consumed_reason text not null check (consumed_reason in ('fusion', 'dissolved'))
);

create index if not exists audit_inventory_user_idx on audit_inventory_ledger (user_id);
create index if not exists audit_strains_user_idx on audit_strains_ledger (user_id);

comment on table audit_inventory_ledger is 'Snapshot of user_inventory rows before DELETE (fusion or dissolve)';
comment on table audit_strains_ledger is 'Snapshot of user_strains rows before DELETE (fusion or dissolve)';

-- 2. user_cards: add vessel_collectible_id, backfill, drop vessel_inventory_id
alter table user_cards add column if not exists vessel_collectible_id uuid references collectibles_catalog(id);

update user_cards uc
set vessel_collectible_id = (
  select ui.collectible_id
  from user_inventory ui
  where ui.id = uc.vessel_inventory_id
)
where uc.vessel_collectible_id is null and uc.vessel_inventory_id is not null;

-- Make vessel_collectible_id NOT NULL for rows that have it (existing cards get backfilled)
-- vessel_inventory_id is kept until Phase 3 migrates fuse logic to TS; then migration 0034 drops it
alter table user_cards alter column vessel_collectible_id set not null;

-- Update fuse_card RPC to insert vessel_collectible_id (required for new rows)
create or replace function fuse_card(p_vessel_inventory_id uuid, p_user_strain_id uuid)
returns table (
  card_id uuid,
  token_id text,
  final_hp int,
  final_atk int,
  mana_cost int,
  keyword text
)
language plpgsql
security definer
set search_path = public, extensions
set row_security = off
as $$
declare
  v_user_id uuid := auth.uid();
  v_vessel_row user_inventory%rowtype;
  v_strain_row user_strains%rowtype;
  v_catalog collectibles_catalog%rowtype;
  v_strain_cat strains_catalog%rowtype;
  v_hp_mult numeric;
  v_atk_mult numeric;
  v_mana_bonus int;
  v_hp_bonus int;
  v_final_hp int;
  v_final_atk int;
  v_mana_cost int;
  v_keyword text;
  v_token_id text;
  v_card_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  select * into v_vessel_row
  from user_inventory
  where id = p_vessel_inventory_id and user_id = v_user_id and is_used = false;
  if not found then
    raise exception 'vessel_not_found_or_used';
  end if;

  select * into v_strain_row
  from user_strains
  where id = p_user_strain_id and user_id = v_user_id and is_used = false;
  if not found then
    raise exception 'strain_not_found_or_used';
  end if;

  select * into v_catalog from collectibles_catalog where id = v_vessel_row.collectible_id;
  if not found then
    raise exception 'vessel_catalog_not_found';
  end if;
  select * into v_strain_cat from strains_catalog where id = v_strain_row.strain_id;
  if not found then
    raise exception 'strain_catalog_not_found';
  end if;

  case v_strain_cat.family
    when 'NEURO' then
      v_keyword := 'OVERCLOCK';
      v_hp_mult := case v_strain_cat.rarity
        when 'common' then 0.50
        when 'uncommon' then 0.60
        when 'rare' then 0.70
        when 'epic' then 0.80
        when 'legendary' then 0.90
        else 0.50
      end;
      v_atk_mult := 1.0;
      v_mana_bonus := 0;
      v_hp_bonus := 0;
    when 'SHELL' then
      v_keyword := 'BLOCKER';
      v_hp_mult := 1.0;
      v_atk_mult := case v_strain_cat.rarity
        when 'common' then 0.50
        when 'uncommon' then 0.60
        when 'rare' then 0.70
        when 'epic' then 0.80
        when 'legendary' then 0.90
        else 0.50
      end;
      v_mana_bonus := 0;
      v_hp_bonus := 0;
    when 'PSYCHO' then
      v_keyword := 'VAMPIRISM';
      v_hp_mult := 1.0;
      v_atk_mult := 1.0;
      v_mana_bonus := case v_strain_cat.rarity
        when 'common' then 3
        when 'uncommon' then 2
        when 'rare' then 1
        when 'epic' then 1
        when 'legendary' then 0
        else 0
      end;
      v_hp_bonus := case v_strain_cat.rarity when 'epic' then 1 else 0 end;
    else
      raise exception 'invalid_strain_family';
  end case;

  v_final_hp := greatest(1, floor(v_catalog.base_hp * v_hp_mult) + v_hp_bonus);
  v_final_atk := greatest(0, floor(v_catalog.base_atk * v_atk_mult));
  v_mana_cost := greatest(0, v_catalog.base_mana + v_mana_bonus);

  v_token_id := encode(extensions.gen_random_bytes(12), 'hex');

  insert into user_cards (user_id, token_id, vessel_inventory_id, vessel_collectible_id, strain_id, final_hp, final_atk, mana_cost, keyword, image_url)
  values (v_user_id, v_token_id, p_vessel_inventory_id, v_vessel_row.collectible_id, v_strain_row.strain_id, v_final_hp, v_final_atk, v_mana_cost, v_keyword, v_catalog.image_url)
  returning
    user_cards.id,
    user_cards.token_id,
    user_cards.final_hp,
    user_cards.final_atk,
    user_cards.mana_cost,
    user_cards.keyword
  into v_card_id, v_token_id, v_final_hp, v_final_atk, v_mana_cost, v_keyword;

  update user_inventory set is_used = true where id = p_vessel_inventory_id;
  update user_strains set is_used = true where id = p_user_strain_id;

  return query select v_card_id, v_token_id, v_final_hp, v_final_atk, v_mana_cost, v_keyword;
end;
$$;

-- 3. Update get_rarest_card_for_user: join via vessel_collectible_id
create or replace function get_rarest_card_for_user(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_rarity_rank int;
  v_c_rank int;
  v_s_rank int;
begin
  if p_user_id is null then
    return null;
  end if;
  select
    uc.id as user_card_id,
    uc.image_url,
    c.rarity as vessel_rarity,
    s.rarity as strain_rarity
  into v_row
  from user_cards uc
  join collectibles_catalog c on c.id = uc.vessel_collectible_id
  join strains_catalog s on s.id = uc.strain_id
  where uc.user_id = p_user_id
  order by
    greatest(
      case c.rarity when 'legendary' then 5 when 'epic' then 4 when 'rare' then 3 when 'uncommon' then 2 else 1 end,
      case s.rarity when 'legendary' then 5 when 'epic' then 4 when 'rare' then 3 when 'uncommon' then 2 else 1 end
    ) desc,
    uc.created_at desc
  limit 1;
  if not found then
    return null;
  end if;
  v_c_rank := case v_row.vessel_rarity when 'legendary' then 5 when 'epic' then 4 when 'rare' then 3 when 'uncommon' then 2 else 1 end;
  v_s_rank := case v_row.strain_rarity when 'legendary' then 5 when 'epic' then 4 when 'rare' then 3 when 'uncommon' then 2 else 1 end;
  v_rarity_rank := greatest(v_c_rank, v_s_rank);
  return json_build_object(
    'user_card_id', v_row.user_card_id,
    'image_url', v_row.image_url,
    'rarity', case v_rarity_rank
      when 5 then 'legendary'
      when 4 then 'epic'
      when 3 then 'rare'
      when 2 then 'uncommon'
      else 'common'
    end
  );
end;
$$;
