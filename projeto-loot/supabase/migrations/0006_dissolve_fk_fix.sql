-- Fix: dissolve_cards must clear redemption_codes.redeemed_inventory_id
-- before deleting user_inventory, else FK constraint blocks the delete.
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

  -- Clear FK references in redemption_codes before deleting user_inventory
  update redemption_codes
  set redeemed_inventory_id = null
  where redeemed_inventory_id = any(p_inventory_ids);

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
