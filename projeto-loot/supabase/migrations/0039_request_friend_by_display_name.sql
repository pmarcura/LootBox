-- RPC: request friend by display_name (profile name). Limit 1: if multiple users have the same name, return error.
create or replace function request_friend_by_display_name(p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_id uuid := auth.uid();
  v_to_id uuid;
  v_request_id uuid;
  v_normalized text;
  v_match_count int;
begin
  if v_from_id is null then
    raise exception 'not_authenticated';
  end if;

  v_normalized := trim(p_display_name);
  if v_normalized = '' then
    raise exception 'invalid_name';
  end if;

  select count(*), min(id) into v_match_count, v_to_id
  from profiles
  where trim(lower(display_name)) = lower(v_normalized);

  if v_match_count = 0 then
    raise exception 'user_not_found';
  end if;

  if v_match_count > 1 then
    raise exception 'multiple_users_same_name';
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

comment on function request_friend_by_display_name(text) is 'Send a friend request by profile display_name. Fails if zero or multiple users have that name.';
