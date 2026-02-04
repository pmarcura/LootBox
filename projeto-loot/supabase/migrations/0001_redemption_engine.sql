create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'rarity') then
    create type rarity as enum ('common', 'uncommon', 'rare', 'epic', 'legendary');
  end if;
end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists collectibles_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  rarity rarity not null,
  series text,
  model_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists redemption_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null,
  batch_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id),
  redeemed_inventory_id uuid,
  constraint redemption_codes_code_hash_len check (char_length(code_hash) = 64)
);

create unique index if not exists redemption_codes_code_hash_uq
  on redemption_codes (code_hash);

create table if not exists user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collectible_id uuid not null references collectibles_catalog(id),
  acquired_at timestamptz not null default now(),
  source text not null default 'redemption',
  redemption_code_hash text
);

create index if not exists user_inventory_user_recent_idx
  on user_inventory (user_id, acquired_at desc);

create index if not exists collectibles_catalog_rarity_idx
  on collectibles_catalog (rarity);

alter table redemption_codes
  add constraint redemption_codes_redeemed_inventory_fk
  foreign key (redeemed_inventory_id) references user_inventory(id);

create table if not exists redemption_attempts (
  id bigserial primary key,
  user_id uuid,
  ip_hash text,
  code_hash text,
  created_at timestamptz not null default now(),
  success boolean not null default false
);

create index if not exists redemption_attempts_user_recent_idx
  on redemption_attempts (user_id, created_at desc);

create index if not exists redemption_attempts_ip_recent_idx
  on redemption_attempts (ip_hash, created_at desc);

alter table profiles enable row level security;
alter table collectibles_catalog enable row level security;
alter table redemption_codes enable row level security;
alter table user_inventory enable row level security;
alter table redemption_attempts enable row level security;

create policy profiles_select_own
  on profiles for select
  using (auth.uid() = id);

create policy profiles_update_own
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy collectibles_read_public
  on collectibles_catalog for select
  using (true);

create policy collectibles_service_write
  on collectibles_catalog for all
  to service_role
  using (true)
  with check (true);

create policy redemption_codes_service_only
  on redemption_codes for all
  to service_role
  using (true)
  with check (true);

create policy user_inventory_select_own
  on user_inventory for select
  using (auth.uid() = user_id);

create policy user_inventory_insert_own
  on user_inventory for insert
  with check (auth.uid() = user_id);

create policy redemption_attempts_service_only
  on redemption_attempts for all
  to service_role
  using (true)
  with check (true);

create or replace function crockford_index(p_char text)
returns int
language sql
immutable
as $$
  select case p_char
    when '2' then 0
    when '3' then 1
    when '4' then 2
    when '5' then 3
    when '6' then 4
    when '7' then 5
    when '8' then 6
    when '9' then 7
    when 'A' then 8
    when 'B' then 9
    when 'C' then 10
    when 'D' then 11
    when 'E' then 12
    when 'F' then 13
    when 'G' then 14
    when 'H' then 15
    when 'J' then 16
    when 'K' then 17
    when 'M' then 18
    when 'N' then 19
    when 'P' then 20
    when 'Q' then 21
    when 'R' then 22
    when 'S' then 23
    when 'T' then 24
    when 'V' then 25
    when 'W' then 26
    when 'X' then 27
    when 'Y' then 28
    when 'Z' then 29
    else null
  end;
$$;

create or replace function is_valid_redemption_code(p_code text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_code text := upper(trim(p_code));
  v_data text;
  v_check text;
  v_numeric text := '';
  v_c int := 0;
  v_d int[][] := array[
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];
  v_p int[][] := array[
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];
  v_inv int[] := array[0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
  v_i int;
  v_digit int;
  v_char text;
  v_idx int;
  v_expected int;
begin
  if length(v_code) <> 12 then
    return false;
  end if;

  v_data := left(v_code, 11);
  v_check := right(v_code, 1);

  if v_data !~ '^[A-HJ-KM-NP-TV-Z2-9]+$' then
    return false;
  end if;

  if v_check !~ '^[2-9]$' then
    return false;
  end if;

  for v_i in 1..length(v_data) loop
    v_char := substr(v_data, v_i, 1);
    v_idx := crockford_index(v_char);
    if v_idx is null then
      return false;
    end if;
    v_numeric := v_numeric || lpad(v_idx::text, 2, '0');
  end loop;

  for v_i in 1..length(v_numeric) loop
    v_digit := substr(v_numeric, length(v_numeric) - v_i + 1, 1)::int;
    v_c := v_d[v_c + 1][v_p[((v_i - 1) % 8) + 1][v_digit + 1] + 1];
  end loop;

  v_expected := v_inv[v_c + 1];
  return v_expected::text = v_check;
end;
$$;

create or replace function redeem_code(p_code text)
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
  v_result_rarity rarity;
  v_result_name text;
  v_result_slug text;
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

  select count(*)
  into v_user_attempts
  from redemption_attempts
  where user_id = v_user_id
    and created_at > v_now - v_window;

  if v_user_attempts >= v_user_limit then
    raise exception 'rate_limited';
  end if;

  if v_ip_hash is not null then
    select count(*)
    into v_ip_attempts
    from redemption_attempts
    where ip_hash = v_ip_hash
      and created_at > v_now - v_window;

    if v_ip_attempts >= v_ip_limit then
      raise exception 'rate_limited';
    end if;
  end if;

  insert into redemption_attempts (user_id, ip_hash, code_hash, created_at, success)
  values (v_user_id, v_ip_hash, v_code_hash, v_now, false)
  returning id into v_attempt_id;

  perform pg_advisory_xact_lock(hashtext(v_code_hash));

  select *
  into v_code_row
  from redemption_codes
  where code_hash = v_code_hash
  for update;

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

  select c.id, c.rarity, c.name, c.slug
  into v_collectible_id, v_result_rarity, v_result_name, v_result_slug
  from collectibles_catalog c
  where c.rarity = v_rarity
  order by random()
  limit 1;

  if v_collectible_id is null then
    raise exception 'no_collectible_for_rarity';
  end if;

  insert into user_inventory (user_id, collectible_id, source, redemption_code_hash)
  values (v_user_id, v_collectible_id, 'redemption', v_code_hash)
  returning id into v_inventory_id;

  update redemption_codes
  set redeemed_at = v_now,
      redeemed_by = v_user_id,
      redeemed_inventory_id = v_inventory_id,
      is_active = false
  where id = v_code_row.id;

  update redemption_attempts
  set success = true
  where id = v_attempt_id;

  return query
  select v_inventory_id, v_collectible_id, v_result_rarity, v_result_name, v_result_slug;
end;
$$;

grant execute on function redeem_code(text) to authenticated;
