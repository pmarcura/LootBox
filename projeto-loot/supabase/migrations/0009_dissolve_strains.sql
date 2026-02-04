-- Dissolve strains (unused only) into essence; same essence per rarity as vessels
create or replace function dissolve_strains(p_strain_ids uuid[])
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

  if array_length(p_strain_ids, 1) is null or array_length(p_strain_ids, 1) = 0 then
    raise exception 'empty_strain_ids';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  for v_row in
    select us.id, s.rarity
    from user_strains us
    join strains_catalog s on s.id = us.strain_id
    where us.id = any(p_strain_ids)
      and us.user_id = v_user_id
      and us.is_used = false
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
    raise exception 'no_valid_strains';
  end if;

  if v_count < array_length(p_strain_ids, 1) then
    raise exception 'unauthorized_strains';
  end if;

  delete from user_strains
  where id = any(p_strain_ids)
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

grant execute on function dissolve_strains(uuid[]) to authenticated;
