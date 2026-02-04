-- Clans and essence spent tracking for lootbox (clan contribution)

alter table profiles
  add column if not exists total_essence_spent_on_lootbox bigint not null default 0;

comment on column profiles.total_essence_spent_on_lootbox is 'Total essence ever spent on lootbox purchases; used for clan contribution';

create table if not exists clans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  total_essence_consumed bigint not null default 0
);

comment on table clans is 'Clan; total_essence_consumed is sum of members total_essence_spent_on_lootbox (updated on each purchase)';

create table if not exists clan_members (
  clan_id uuid not null references clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  primary key (clan_id, user_id)
);

create index if not exists clan_members_user_idx on clan_members (user_id);

alter table clans enable row level security;
alter table clan_members enable row level security;

-- Anyone can select a clan by slug to join; members can select their clan
create policy clans_select_member
  on clans for select
  using (id in (select clan_id from clan_members where user_id = auth.uid()));

create policy clan_members_select_own
  on clan_members for select
  using (user_id = auth.uid() or clan_id in (select clan_id from clan_members where user_id = auth.uid()));

-- Only leaders can update clan (name, slug); members can leave (delete self). Insert via RPC.
create policy clans_update_leader
  on clans for update
  using (id in (select clan_id from clan_members where user_id = auth.uid() and role = 'leader'));

create policy clan_members_delete_own
  on clan_members for delete
  using (user_id = auth.uid());

-- RPCs: create_clan, join_clan_by_slug, leave_clan (and optionally get_clan_for_user)
create or replace function create_clan(p_name text, p_slug text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_clan_id uuid;
  v_slug text := trim(lower(nullif(p_slug, '')));
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if trim(p_name) = '' then
    raise exception 'name_required';
  end if;
  if v_slug is not null and exists (select 1 from clans where slug = v_slug) then
    raise exception 'slug_taken';
  end if;
  insert into clans (name, slug)
  values (trim(p_name), case when v_slug = '' then null else v_slug end)
  returning id into v_clan_id;
  insert into clan_members (clan_id, user_id, role)
  values (v_clan_id, v_user_id, 'leader');
  return v_clan_id;
end;
$$;

create or replace function join_clan_by_slug(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_clan_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  select id into v_clan_id from clans where slug = trim(lower(p_slug));
  if not found then
    raise exception 'clan_not_found';
  end if;
  if exists (select 1 from clan_members where user_id = v_user_id) then
    raise exception 'already_in_clan';
  end if;
  insert into clan_members (clan_id, user_id, role)
  values (v_clan_id, v_user_id, 'member');
end;
$$;

create or replace function leave_clan()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_clan_id uuid;
  v_is_leader boolean;
  v_member_count int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  select cm.clan_id, (cm.role = 'leader') into v_clan_id, v_is_leader
  from clan_members cm where cm.user_id = v_user_id;
  if v_clan_id is null then
    raise exception 'not_in_clan';
  end if;
  delete from clan_members where user_id = v_user_id;
  if v_is_leader then
    select count(*) into v_member_count from clan_members where clan_id = v_clan_id;
    if v_member_count = 0 then
      delete from clans where id = v_clan_id;
    end if;
  end if;
end;
$$;

-- Return current user's clan and members (for dashboard)
create or replace function get_my_clan_with_members()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_clan_id uuid;
  v_clan clans%rowtype;
  v_members json;
begin
  if v_user_id is null then
    return null;
  end if;
  select clan_id into v_clan_id from clan_members where user_id = v_user_id limit 1;
  if v_clan_id is null then
    return null;
  end if;
  select * into v_clan from clans where id = v_clan_id;
  if not found then
    return null;
  end if;
  select json_agg(
    json_build_object(
      'user_id', cm.user_id,
      'role', cm.role,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'total_essence_spent_on_lootbox', coalesce(p.total_essence_spent_on_lootbox, 0)
    )
  ) into v_members
  from clan_members cm
  join profiles p on p.id = cm.user_id
  where cm.clan_id = v_clan_id;
  return json_build_object(
    'id', v_clan.id,
    'name', v_clan.name,
    'slug', v_clan.slug,
    'total_essence_consumed', v_clan.total_essence_consumed,
    'members', coalesce(v_members, '[]'::json)
  );
end;
$$;

grant execute on function create_clan(text, text) to authenticated;
grant execute on function join_clan_by_slug(text) to authenticated;
grant execute on function leave_clan() to authenticated;
grant execute on function get_my_clan_with_members() to authenticated;

-- Update purchase_lootbox: after successful debit, add to total_essence_spent_on_lootbox and to clan total
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
  set essence_balance = essence_balance - v_tier.cost_essence,
      total_essence_spent_on_lootbox = total_essence_spent_on_lootbox + v_tier.cost_essence
  where id = v_user_id and essence_balance >= v_tier.cost_essence;
  if not found then
    raise exception 'insufficient_essence';
  end if;

  update clans set total_essence_consumed = total_essence_consumed + v_tier.cost_essence
  where id = (select clan_id from clan_members where user_id = v_user_id limit 1);

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
    update profiles set essence_balance = essence_balance + v_tier.cost_essence, total_essence_spent_on_lootbox = total_essence_spent_on_lootbox - v_tier.cost_essence where id = v_user_id;
    update clans set total_essence_consumed = total_essence_consumed - v_tier.cost_essence where id = (select clan_id from clan_members where user_id = v_user_id limit 1);
    raise exception 'no_collectible_for_rarity';
  end if;

  select s.id, s.name, s.slug, s.family
  into v_strain_catalog_id, v_strain_name, v_strain_slug, v_strain_family
  from strains_catalog s
  where s.rarity = v_rarity
  order by random()
  limit 1;
  if v_strain_catalog_id is null then
    update profiles set essence_balance = essence_balance + v_tier.cost_essence, total_essence_spent_on_lootbox = total_essence_spent_on_lootbox - v_tier.cost_essence where id = v_user_id;
    update clans set total_essence_consumed = total_essence_consumed - v_tier.cost_essence where id = (select clan_id from clan_members where user_id = v_user_id limit 1);
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
