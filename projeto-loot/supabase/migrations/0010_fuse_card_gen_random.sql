-- Fix fuse_card: use extensions.gen_random_bytes for Supabase (pgcrypto in extensions schema)
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

  v_token_id := encode(extensions.gen_random_bytes(12), 'hex');

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
