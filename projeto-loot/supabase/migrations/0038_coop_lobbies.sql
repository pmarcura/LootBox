-- Coop lobbies for 2v1 roguelike mode: host creates, guest joins by code or fill with bot.

create table if not exists coop_lobbies (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete set null,
  filled_with_bot boolean not null default false,
  status text not null default 'waiting' check (status in ('waiting', 'draft', 'in_run')),
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code)
);

create index if not exists coop_lobbies_host_idx on coop_lobbies (host_user_id);
create index if not exists coop_lobbies_guest_idx on coop_lobbies (guest_user_id);
create index if not exists coop_lobbies_code_idx on coop_lobbies (code);
create index if not exists coop_lobbies_status_idx on coop_lobbies (status);

alter table coop_lobbies enable row level security;

create policy coop_lobbies_select_own
  on coop_lobbies for select
  using (host_user_id = auth.uid() or guest_user_id = auth.uid());

create policy coop_lobbies_insert_host
  on coop_lobbies for insert
  with check (host_user_id = auth.uid());

create policy coop_lobbies_update_host
  on coop_lobbies for update
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

create policy coop_lobbies_delete_host
  on coop_lobbies for delete
  using (host_user_id = auth.uid());

-- Generate short unique code (6 alphanumeric chars)
create or replace function gen_coop_lobby_code()
returns text
language sql
security definer
set search_path = public
as $$
  select upper(substring(md5(gen_random_uuid()::text || clock_timestamp()::text) from 1 for 6));
$$;

-- RPC: create coop lobby
create or replace function create_coop_lobby()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid := auth.uid();
  v_id uuid;
  v_code text;
begin
  if v_host_id is null then
    raise exception 'not_authenticated';
  end if;

  v_code := gen_coop_lobby_code();
  while exists (select 1 from coop_lobbies where code = v_code) loop
    v_code := gen_coop_lobby_code();
  end loop;

  insert into coop_lobbies (host_user_id, code, status)
  values (v_host_id, v_code, 'waiting')
  returning id, code into v_id, v_code;

  return jsonb_build_object('lobbyId', v_id, 'code', v_code);
end;
$$;

comment on function create_coop_lobby() is 'Create a new coop lobby. Returns { lobbyId, code } for sharing.';

-- RPC: join coop lobby by code
create or replace function join_coop_lobby(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_id uuid := auth.uid();
  v_id uuid;
begin
  if v_guest_id is null then
    raise exception 'not_authenticated';
  end if;

  if trim(upper(p_code)) = '' then
    raise exception 'code_required';
  end if;

  select id into v_id
  from coop_lobbies
  where upper(trim(code)) = upper(trim(p_code))
    and status = 'waiting'
    and filled_with_bot = false
    and guest_user_id is null
    and host_user_id != v_guest_id;

  if v_id is null then
    raise exception 'lobby_not_found';
  end if;

  update coop_lobbies
  set guest_user_id = v_guest_id, updated_at = now()
  where id = v_id;

  return jsonb_build_object('ok', true, 'lobbyId', v_id);
end;
$$;

comment on function join_coop_lobby(text) is 'Join an existing coop lobby by code. Fails if full or with bot.';

-- RPC: leave coop lobby
create or replace function leave_coop_lobby(p_lobby_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update coop_lobbies
  set guest_user_id = case when guest_user_id = v_uid then null else guest_user_id end,
      updated_at = now()
  where id = p_lobby_id and (host_user_id = v_uid or guest_user_id = v_uid);

  delete from coop_lobbies
  where id = p_lobby_id and host_user_id = v_uid and status = 'waiting';
end;
$$;

comment on function leave_coop_lobby(uuid) is 'Leave lobby (guest clears slot; host deletes if waiting).';

-- RPC: fill lobby with bot (host only)
create or replace function fill_coop_lobby_with_bot(p_lobby_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid := auth.uid();
begin
  if v_host_id is null then
    raise exception 'not_authenticated';
  end if;

  update coop_lobbies
  set filled_with_bot = true, guest_user_id = null, updated_at = now()
  where id = p_lobby_id and host_user_id = v_host_id and status = 'waiting';

  if not found then
    raise exception 'lobby_not_found_or_not_host';
  end if;
end;
$$;

comment on function fill_coop_lobby_with_bot(uuid) is 'Host fills the second slot with a bot.';

-- RPC: start coop run (host only; moves to draft)
create or replace function start_coop_run(p_lobby_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid := auth.uid();
begin
  if v_host_id is null then
    raise exception 'not_authenticated';
  end if;

  update coop_lobbies
  set status = 'draft', updated_at = now()
  where id = p_lobby_id
    and host_user_id = v_host_id
    and status = 'waiting'
    and (guest_user_id is not null or filled_with_bot = true);

  if not found then
    raise exception 'lobby_not_ready';
  end if;
end;
$$;

comment on function start_coop_run(uuid) is 'Host starts the run (requires 2 players or bot). Sets status to draft.';

-- Enable Realtime for lobby updates (guest join, fill bot, start)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table coop_lobbies;
  end if;
exception
  when others then null;
end $$;
