-- Starter pack: grant vessels + strains once per user (source = 'starter')

alter table profiles
  add column if not exists starter_pack_granted_at timestamptz;

comment on column profiles.starter_pack_granted_at is 'When the user received the one-time starter pack (vessels + strains)';

-- Allow source = 'starter' in user_strains (constraint is inline, so alter column)
alter table user_strains
  drop constraint if exists user_strains_source_check;

alter table user_strains
  add constraint user_strains_source_check
  check (source in ('redemption', 'lootbox', 'starter'));

-- user_inventory: allow source = 'starter' (0001 has no check on source)
alter table user_inventory
  drop constraint if exists user_inventory_source_check;

alter table user_inventory
  add constraint user_inventory_source_check
  check (source in ('redemption', 'lootbox', 'starter'));

-- RPC: grant starter pack once per user (security definer to read catalog and write inventory/strains)
create or replace function grant_starter_pack()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_granted_at timestamptz;
  v_collectible_ids uuid[];
  v_strain_ids uuid[];
  i int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select starter_pack_granted_at into v_granted_at
  from profiles
  where id = v_user_id;

  if v_granted_at is not null then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  select array_agg(id)
  into v_collectible_ids
  from (
    select id from collectibles_catalog
    where rarity in ('common', 'uncommon')
    order by random()
    limit 4
  ) sub;

  select array_agg(id)
  into v_strain_ids
  from (
    select id from strains_catalog
    where rarity in ('common', 'uncommon')
    order by random()
    limit 4
  ) sub;

  if v_collectible_ids is not null and array_length(v_collectible_ids, 1) > 0 then
    for i in 1..array_length(v_collectible_ids, 1)
    loop
      insert into user_inventory (user_id, collectible_id, source)
      values (v_user_id, v_collectible_ids[i], 'starter');
    end loop;
  end if;

  if v_strain_ids is not null and array_length(v_strain_ids, 1) > 0 then
    for i in 1..array_length(v_strain_ids, 1)
    loop
      insert into user_strains (user_id, strain_id, source)
      values (v_user_id, v_strain_ids[i], 'starter');
    end loop;
  end if;

  update profiles
  set starter_pack_granted_at = now()
  where id = v_user_id;
end;
$$;

comment on function grant_starter_pack() is 'One-time grant: 4 vessels + 4 strains (common/uncommon) for new users';
