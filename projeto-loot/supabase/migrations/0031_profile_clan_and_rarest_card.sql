-- get_clan_for_user: retorna o clã de um usuário (nome, slug) para exibir no perfil.
-- get_rarest_card_for_user: retorna a carta mais rara do usuário (para exibir no perfil).

create or replace function get_clan_for_user(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clan_id uuid;
  v_clan clans%rowtype;
begin
  if p_user_id is null then
    return null;
  end if;
  select clan_id into v_clan_id from clan_members where user_id = p_user_id limit 1;
  if v_clan_id is null then
    return null;
  end if;
  select * into v_clan from clans where id = v_clan_id;
  if not found then
    return null;
  end if;
  return json_build_object(
    'id', v_clan.id,
    'name', v_clan.name,
    'slug', v_clan.slug
  );
end;
$$;

comment on function get_clan_for_user(uuid) is 'Returns clan name and slug for a user profile (public info).';

-- Rarity order for "rarest": legendary > epic > rare > uncommon > common
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
  join user_inventory ui on ui.id = uc.vessel_inventory_id
  join collectibles_catalog c on c.id = ui.collectible_id
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

comment on function get_rarest_card_for_user(uuid) is 'Returns the rarest card (by vessel/strain rarity) for profile display.';

grant execute on function get_clan_for_user(uuid) to authenticated;
grant execute on function get_rarest_card_for_user(uuid) to authenticated;
