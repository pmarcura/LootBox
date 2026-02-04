-- Friends: friend_requests + friends table, RPCs request_friend_by_email and respond_friend_request

create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

create index if not exists friend_requests_to_status_idx
  on friend_requests (to_user_id, status);

create index if not exists friend_requests_from_idx
  on friend_requests (from_user_id);

create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id != friend_id)
);

create index if not exists friends_user_idx on friends (user_id);

alter table friend_requests enable row level security;
alter table friends enable row level security;

-- friend_requests: user sees own as from or to; can insert as from; can update as to (respond)
create policy friend_requests_select_own
  on friend_requests for select
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy friend_requests_insert_own
  on friend_requests for insert
  with check (from_user_id = auth.uid());

create policy friend_requests_update_as_to
  on friend_requests for update
  using (to_user_id = auth.uid())
  with check (to_user_id = auth.uid());

-- friends: user sees rows where they are user_id or friend_id; can insert when they are user_id or friend_id (for RPC)
create policy friends_select_own
  on friends for select
  using (user_id = auth.uid() or friend_id = auth.uid());

create policy friends_insert_own
  on friends for insert
  with check (user_id = auth.uid() or friend_id = auth.uid());

-- Allow reading display_name of friends and request participants (for UI)
create policy profiles_select_friends_and_requests
  on profiles for select
  using (
    id = auth.uid()
    or id in (select friend_id from friends where user_id = auth.uid())
    or id in (select user_id from friends where friend_id = auth.uid())
    or id in (select from_user_id from friend_requests where to_user_id = auth.uid())
    or id in (select to_user_id from friend_requests where from_user_id = auth.uid())
  );

-- RPC: request friend by email (security definer to read auth.users)
create or replace function request_friend_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_id uuid := auth.uid();
  v_to_id uuid;
  v_request_id uuid;
  v_normalized_email text;
begin
  if v_from_id is null then
    raise exception 'not_authenticated';
  end if;

  v_normalized_email := lower(trim(p_email));
  if v_normalized_email = '' then
    raise exception 'invalid_email';
  end if;

  select id into v_to_id
  from auth.users
  where email = v_normalized_email;

  if v_to_id is null then
    raise exception 'user_not_found';
  end if;

  if v_to_id = v_from_id then
    raise exception 'cannot_add_self';
  end if;

  if exists (
    select 1 from friends
    where (user_id = v_from_id and friend_id = v_to_id)
       or (user_id = v_to_id and friend_id = v_from_id)
  ) then
    raise exception 'already_friends';
  end if;

  if exists (
    select 1 from friend_requests
    where from_user_id = v_from_id and to_user_id = v_to_id and status = 'pending'
  ) then
    raise exception 'request_already_sent';
  end if;

  insert into friend_requests (from_user_id, to_user_id, status)
  values (v_from_id, v_to_id, 'pending')
  on conflict (from_user_id, to_user_id) do update set status = 'pending', created_at = now()
  returning id into v_request_id;

  return v_request_id;
end;
$$;

comment on function request_friend_by_email(text) is 'Send a friend request to the user with the given email. Returns the friend_request id.';

-- RPC: respond to friend request (accept or reject)
create or replace function respond_friend_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to_id uuid := auth.uid();
  v_from_id uuid;
begin
  if v_to_id is null then
    raise exception 'not_authenticated';
  end if;

  select from_user_id into v_from_id
  from friend_requests
  where id = p_request_id and to_user_id = v_to_id and status = 'pending';

  if v_from_id is null then
    raise exception 'request_not_found';
  end if;

  if p_accept then
    update friend_requests set status = 'accepted' where id = p_request_id;

    insert into friends (user_id, friend_id)
    values (v_from_id, v_to_id), (v_to_id, v_from_id)
    on conflict (user_id, friend_id) do nothing;
  else
    update friend_requests set status = 'rejected' where id = p_request_id;
  end if;
end;
$$;

comment on function respond_friend_request(uuid, boolean) is 'Accept (true) or reject (false) a friend request. Only the recipient can respond.';
