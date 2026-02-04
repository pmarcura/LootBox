-- redeem_code: drop = 1 vessel + 1 strain (same rarity 60/25/10/4/1)
create or replace function redeem_code(p_code text)
returns table (
  vessel_inventory_id uuid,
  vessel_collectible_id uuid,
  vessel_rarity rarity,
  vessel_name text,
  vessel_slug text,
  strain_id uuid,
  strain_catalog_id uuid,
  strain_name text,
  strain_slug text,
  strain_rarity rarity,
  strain_family strain_family
)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_user_id uuid := auth.uid();
  v_normalized text;
  v_code_hash text;
  v_roll double precision;
  v_rarity rarity;
  v_collectible_id uuid;
  v_inventory_id uuid;
  v_attempt_id bigint;
  v_now timestamptz := now();
  v_window interval := interval '5 minutes';
  v_user_limit int := 5;
  v_ip_limit int := 20;
  v_ip_header text := current_setting('request.header.x-forwarded-for', true);
  v_ip_hash text;
  v_code_row redemption_codes%rowtype;
  v_user_attempts int;
  v_ip_attempts int;
  v_vessel_name text;
  v_vessel_slug text;
  v_strain_catalog_id uuid;
  v_strain_name text;
  v_strain_slug text;
  v_strain_family strain_family;
  v_user_strain_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  v_normalized := upper(trim(p_code));
  if not is_valid_redemption_code(v_normalized) then
    raise exception 'invalid_code_format';
  end if;

  v_code_hash := encode(extensions.digest(v_normalized, 'sha256'), 'hex');
  v_ip_hash := nullif(encode(extensions.digest(coalesce(v_ip_header, ''), 'sha256'), 'hex'), '');

  select count(*) into v_user_attempts
  from redemption_attempts
  where user_id = v_user_id and created_at > v_now - v_window;
  if v_user_attempts >= v_user_limit then
    raise exception 'rate_limited';
  end if;

  if v_ip_hash is not null then
    select count(*) into v_ip_attempts
    from redemption_attempts
    where ip_hash = v_ip_hash and created_at > v_now - v_window;
    if v_ip_attempts >= v_ip_limit then
      raise exception 'rate_limited';
    end if;
  end if;

  insert into redemption_attempts (user_id, ip_hash, code_hash, created_at, success)
  values (v_user_id, v_ip_hash, v_code_hash, v_now, false)
  returning id into v_attempt_id;

  perform pg_advisory_xact_lock(hashtext(v_code_hash));

  select * into v_code_row from redemption_codes where code_hash = v_code_hash for update;
  if not found then
    raise exception 'code_not_found';
  end if;
  if v_code_row.is_active is false then
    raise exception 'code_inactive';
  end if;
  if v_code_row.redeemed_at is not null then
    raise exception 'code_already_redeemed';
  end if;

  v_roll := random();
  if v_roll < 0.60 then
    v_rarity := 'common';
  elsif v_roll < 0.85 then
    v_rarity := 'uncommon';
  elsif v_roll < 0.95 then
    v_rarity := 'rare';
  elsif v_roll < 0.99 then
    v_rarity := 'epic';
  else
    v_rarity := 'legendary';
  end if;

  select c.id, c.name, c.slug
  into v_collectible_id, v_vessel_name, v_vessel_slug
  from collectibles_catalog c
  where c.rarity = v_rarity
  order by random()
  limit 1;
  if v_collectible_id is null then
    raise exception 'no_collectible_for_rarity';
  end if;

  select s.id, s.name, s.slug, s.family
  into v_strain_catalog_id, v_strain_name, v_strain_slug, v_strain_family
  from strains_catalog s
  where s.rarity = v_rarity
  order by random()
  limit 1;
  if v_strain_catalog_id is null then
    raise exception 'no_strain_for_rarity';
  end if;

  insert into user_inventory (user_id, collectible_id, source, redemption_code_hash)
  values (v_user_id, v_collectible_id, 'redemption', v_code_hash)
  returning id into v_inventory_id;

  insert into user_strains (user_id, strain_id, source)
  values (v_user_id, v_strain_catalog_id, 'redemption')
  returning id into v_user_strain_id;

  update redemption_codes
  set redeemed_at = v_now, redeemed_by = v_user_id, redeemed_inventory_id = v_inventory_id, is_active = false
  where id = v_code_row.id;

  update redemption_attempts set success = true where id = v_attempt_id;

  return query select
    v_inventory_id,
    v_collectible_id,
    v_rarity,
    v_vessel_name,
    v_vessel_slug,
    v_user_strain_id,
    v_strain_catalog_id,
    v_strain_name,
    v_strain_slug,
    v_rarity,
    v_strain_family;
end;
$$;

-- purchase_lootbox: drop = 1 vessel + 1 strain (same tier rarity)
create or replace function purchase_lootbox(p_tier_slug text)
returns table (
  vessel_inventory_id uuid,
  vessel_collectible_id uuid,
  vessel_rarity rarity,
  vessel_name text,
  vessel_slug text,
  strain_id uuid,
  strain_catalog_id uuid,
  strain_name text,
  strain_slug text,
  strain_rarity rarity,
  strain_family strain_family
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
  v_vessel_name text;
  v_vessel_slug text;
  v_strain_catalog_id uuid;
  v_strain_name text;
  v_strain_slug text;
  v_strain_family strain_family;
  v_user_strain_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_tier from lootbox_tiers where slug = p_tier_slug for update;
  if not found then
    raise exception 'tier_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  update profiles
  set essence_balance = essence_balance - v_tier.cost_essence
  where id = v_user_id and essence_balance >= v_tier.cost_essence;
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

  select c.id, c.name, c.slug
  into v_collectible_id, v_vessel_name, v_vessel_slug
  from collectibles_catalog c
  where c.rarity = v_rarity
  order by random()
  limit 1;
  if v_collectible_id is null then
    update profiles set essence_balance = essence_balance + v_tier.cost_essence where id = v_user_id;
    raise exception 'no_collectible_for_rarity';
  end if;

  select s.id, s.name, s.slug, s.family
  into v_strain_catalog_id, v_strain_name, v_strain_slug, v_strain_family
  from strains_catalog s
  where s.rarity = v_rarity
  order by random()
  limit 1;
  if v_strain_catalog_id is null then
    update profiles set essence_balance = essence_balance + v_tier.cost_essence where id = v_user_id;
    raise exception 'no_strain_for_rarity';
  end if;

  insert into user_inventory (user_id, collectible_id, source)
  values (v_user_id, v_collectible_id, 'lootbox')
  returning id into v_inventory_id;

  insert into user_strains (user_id, strain_id, source)
  values (v_user_id, v_strain_catalog_id, 'lootbox')
  returning id into v_user_strain_id;

  return query select
    v_inventory_id,
    v_collectible_id,
    v_rarity,
    v_vessel_name,
    v_vessel_slug,
    v_user_strain_id,
    v_strain_catalog_id,
    v_strain_name,
    v_strain_slug,
    v_rarity,
    v_strain_family;
end;
$$;

-- Penalties/bonuses per family and rarity (spec)
-- NEURO: -% HP (common 50%, uncommon 40%, rare 30%, epic 20%, legendary 10%)
-- SHELL: -% ATK (same %)
-- PSYCHO: +Mana (common +3, uncommon +2, rare +1, epic +1 and +1 HP, legendary +0)
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
set search_path = public
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
  select * into v_strain_cat from strains_catalog where id = v_strain_row.strain_id;

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

  v_token_id := encode(gen_random_bytes(12), 'hex');

  insert into user_cards (user_id, token_id, vessel_inventory_id, strain_id, final_hp, final_atk, mana_cost, keyword)
  values (v_user_id, v_token_id, p_vessel_inventory_id, v_strain_row.strain_id, v_final_hp, v_final_atk, v_mana_cost, v_keyword)
  returning id, token_id, final_hp, final_atk, mana_cost, keyword
  into v_card_id, v_token_id, v_final_hp, v_final_atk, v_mana_cost, v_keyword;

  update user_inventory set is_used = true where id = p_vessel_inventory_id;
  update user_strains set is_used = true where id = p_user_strain_id;

  return query select v_card_id, v_token_id, v_final_hp, v_final_atk, v_mana_cost, v_keyword;
end;
$$;

grant execute on function fuse_card(uuid, uuid) to authenticated;
