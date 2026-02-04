-- Duels: matches + match_cards, RPCs create_match, accept_match, play_turn

do $$
begin
  if not exists (select 1 from pg_type where typname = 'match_status') then
    create type match_status as enum ('pending', 'active', 'finished');
  end if;
  if not exists (select 1 from pg_type where typname = 'match_player') then
    create type match_player as enum ('player1', 'player2');
  end if;
  if not exists (select 1 from pg_type where typname = 'card_position') then
    create type card_position as enum ('deck', 'hand', 'board');
  end if;
end $$;

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid not null references auth.users(id) on delete cascade,
  player2_id uuid not null references auth.users(id) on delete cascade,
  status match_status not null default 'pending',
  winner_id uuid references auth.users(id),
  current_turn match_player not null default 'player1',
  player1_life int not null default 20,
  player2_life int not null default 20,
  player1_mana int not null default 0,
  player2_mana int not null default 0,
  turn_number int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_player1_idx on matches (player1_id);
create index if not exists matches_player2_idx on matches (player2_id);
create index if not exists matches_status_idx on matches (status);

create table if not exists match_cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  user_card_id uuid not null references user_cards(id) on delete cascade,
  owner match_player not null,
  position card_position not null default 'deck',
  current_hp int,
  order_index int not null default 0
);

create index if not exists match_cards_match_idx on match_cards (match_id);

alter table matches enable row level security;
alter table match_cards enable row level security;

create policy matches_select_own
  on matches for select
  using (player1_id = auth.uid() or player2_id = auth.uid());

create policy matches_insert_own
  on matches for insert
  with check (player1_id = auth.uid());

create policy matches_update_own
  on matches for update
  using (player1_id = auth.uid() or player2_id = auth.uid());

create policy matches_delete_pending_as_player2
  on matches for delete
  using (player2_id = auth.uid() and status = 'pending');

create policy match_cards_select_own
  on match_cards for select
  using (
    exists (
      select 1 from matches m
      where m.id = match_cards.match_id
        and (m.player1_id = auth.uid() or m.player2_id = auth.uid())
    )
  );

create policy match_cards_insert_via_match
  on match_cards for insert
  with check (
    exists (
      select 1 from matches m
      where m.id = match_cards.match_id
        and (m.player1_id = auth.uid() or m.player2_id = auth.uid())
    )
  );

create policy match_cards_update_via_match
  on match_cards for update
  using (
    exists (
      select 1 from matches m
      where m.id = match_cards.match_id
        and (m.player1_id = auth.uid() or m.player2_id = auth.uid())
    )
  );

-- Allow reading user_cards that are in a match the user is part of (for displaying opponent cards)
create policy user_cards_select_in_own_match
  on user_cards for select
  using (
    user_id = auth.uid()
    or id in (
      select mc.user_card_id from match_cards mc
      join matches m on m.id = mc.match_id
      where m.player1_id = auth.uid() or m.player2_id = auth.uid()
    )
  );

-- RPC: create match (challenge a friend with 5 cards)
create or replace function create_match(p_friend_id uuid, p_card_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player1_id uuid := auth.uid();
  v_match_id uuid;
  v_card_id uuid;
  i int := 0;
begin
  if v_player1_id is null then
    raise exception 'not_authenticated';
  end if;

  if array_length(p_card_ids, 1) is null or array_length(p_card_ids, 1) != 5 then
    raise exception 'invalid_deck_size';
  end if;

  if not exists (
    select 1 from friends
    where (user_id = v_player1_id and friend_id = p_friend_id)
       or (user_id = p_friend_id and friend_id = v_player1_id)
  ) then
    raise exception 'not_friends';
  end if;

  if p_friend_id = v_player1_id then
    raise exception 'cannot_challenge_self';
  end if;

  for i in 1..5 loop
    if not exists (
      select 1 from user_cards
      where id = p_card_ids[i] and user_id = v_player1_id
    ) then
      raise exception 'invalid_card_ownership';
    end if;
  end loop;

  insert into matches (player1_id, player2_id, status)
  values (v_player1_id, p_friend_id, 'pending')
  returning id into v_match_id;

  for i in 1..5 loop
    insert into match_cards (match_id, user_card_id, owner, position, order_index)
    values (v_match_id, p_card_ids[i], 'player1', 'deck', i - 1);
  end loop;

  return v_match_id;
end;
$$;

-- RPC: accept match (player2 sets deck and game starts)
create or replace function accept_match(p_match_id uuid, p_card_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player2_id uuid := auth.uid();
  v_player1_id uuid;
  v_card_id uuid;
  v_mc_id uuid;
  i int;
  r record;
begin
  if v_player2_id is null then
    raise exception 'not_authenticated';
  end if;

  select player1_id into v_player1_id
  from matches
  where id = p_match_id and player2_id = v_player2_id and status = 'pending';

  if v_player1_id is null then
    raise exception 'match_not_found';
  end if;

  if array_length(p_card_ids, 1) is null or array_length(p_card_ids, 1) != 5 then
    raise exception 'invalid_deck_size';
  end if;

  for i in 1..5 loop
    if not exists (
      select 1 from user_cards
      where id = p_card_ids[i] and user_id = v_player2_id
    ) then
      raise exception 'invalid_card_ownership';
    end if;
  end loop;

  for i in 1..5 loop
    insert into match_cards (match_id, user_card_id, owner, position, order_index)
    values (p_match_id, p_card_ids[i], 'player2', 'deck', i - 1);
  end loop;

  update matches
  set status = 'active', current_turn = 'player1', player1_mana = 1, turn_number = 1, updated_at = now()
  where id = p_match_id;

  -- Draw 3 cards for player1 (deck -> hand)
  for r in (
    select mc.id from match_cards mc
    where mc.match_id = p_match_id and mc.owner = 'player1' and mc.position = 'deck'
    order by random()
    limit 3
  ) loop
    update match_cards set position = 'hand', order_index = 0 where id = r.id;
  end loop;

  -- Draw 3 cards for player2
  for r in (
    select mc.id from match_cards mc
    where mc.match_id = p_match_id and mc.owner = 'player2' and mc.position = 'deck'
    order by random()
    limit 3
  ) loop
    update match_cards set position = 'hand', order_index = 0 where id = r.id;
  end loop;
end;
$$;

-- RPC: play card (hand -> board, costs mana)
create or replace function play_card(p_match_id uuid, p_match_card_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_match record;
  v_mc record;
  v_uc record;
  v_mana int;
  v_cost int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_match from matches where id = p_match_id and status = 'active';
  if v_match is null then
    raise exception 'match_not_found';
  end if;

  if (v_match.current_turn = 'player1' and v_match.player1_id != v_uid)
     or (v_match.current_turn = 'player2' and v_match.player2_id != v_uid) then
    raise exception 'not_your_turn';
  end if;

  select * into v_mc from match_cards
  where id = p_match_card_id and match_id = p_match_id
    and owner = v_match.current_turn and position = 'hand';
  if v_mc is null then
    raise exception 'invalid_card';
  end if;

  select final_hp, mana_cost into v_uc from user_cards where id = v_mc.user_card_id;
  v_mana := case when v_match.current_turn = 'player1' then v_match.player1_mana else v_match.player2_mana end;
  if v_mana < v_uc.mana_cost then
    raise exception 'not_enough_mana';
  end if;

  update match_cards set position = 'board', current_hp = v_uc.final_hp where id = p_match_card_id;

  if v_match.current_turn = 'player1' then
    update matches set player1_mana = player1_mana - v_uc.mana_cost,
      current_turn = 'player2',
      turn_number = turn_number + 1,
      player2_mana = least(10, turn_number + 1),
      updated_at = now()
    where id = p_match_id;
  else
    update matches set player2_mana = player2_mana - v_uc.mana_cost,
      current_turn = 'player1',
      turn_number = turn_number + 1,
      player1_mana = least(10, turn_number + 1),
      updated_at = now()
    where id = p_match_id;
  end if;
end;
$$;

-- RPC: attack (board card deals damage to opponent life)
create or replace function attack(p_match_id uuid, p_match_card_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_match record;
  v_mc record;
  v_atk int;
  v_new_life int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_match from matches where id = p_match_id and status = 'active';
  if v_match is null then
    raise exception 'match_not_found';
  end if;

  if (v_match.current_turn = 'player1' and v_match.player1_id != v_uid)
     or (v_match.current_turn = 'player2' and v_match.player2_id != v_uid) then
    raise exception 'not_your_turn';
  end if;

  select mc.*, uc.final_atk into v_mc, v_atk
  from match_cards mc
  join user_cards uc on uc.id = mc.user_card_id
  where mc.id = p_match_card_id and mc.match_id = p_match_id
    and mc.owner = v_match.current_turn and mc.position = 'board';
  if v_mc is null then
    raise exception 'invalid_card';
  end if;

  if v_match.current_turn = 'player1' then
    v_new_life := greatest(0, v_match.player2_life - v_atk);
    update matches
    set player2_life = v_new_life,
      current_turn = 'player2',
      turn_number = turn_number + 1,
      player2_mana = least(10, turn_number + 1),
      updated_at = now(),
      winner_id = case when v_new_life <= 0 then player1_id else winner_id end,
      status = case when v_new_life <= 0 then 'finished'::match_status else status end
    where id = p_match_id;
  else
    v_new_life := greatest(0, v_match.player1_life - v_atk);
    update matches
    set player1_life = v_new_life,
      current_turn = 'player1',
      turn_number = turn_number + 1,
      player1_mana = least(10, turn_number + 1),
      updated_at = now(),
      winner_id = case when v_new_life <= 0 then player2_id else winner_id end,
      status = case when v_new_life <= 0 then 'finished'::match_status else status end
    where id = p_match_id;
  end if;
end;
$$;

-- Fix mana on turn start: when we switch turn we give the other player mana. In accept_match we set player1_mana = 1 and turn_number = 1 (player1's first turn already has 1 mana). When player1 plays card we set current_turn = player2 and player2_mana = least(10, turn_number/2+1). So turn_number is 1, player2_mana = 1. When player2 plays we set player1_mana = least(10, (turn_number+1)/2+1). turn_number becomes 2, so player1_mana = 2. So formula: at start of turn N (1-based), mana = min(10, floor((N+1)/2) + 1)? For turn 1: 1, turn 2: 1, turn 3: 2, turn 4: 2... Actually standard is turn 1 = 1 mana, turn 2 = 2 mana, etc. So mana = min(10, turn_number). Let me use turn_number for mana: at end of play_card we set the *other* player's mana to least(10, turn_number + 1) since we're about to increment turn_number. So when we switch to player2 we do turn_number + 1 = 2, so player2_mana = 2. Then when player2 plays we do turn_number + 1 = 3, player1_mana = 3. So mana = least(10, turn_number + 1). But we're incrementing turn_number after the switch, so when we set player2_mana we have turn_number still the old value. So after play_card we have turn_number = turn_number + 1. So when we set player2_mana we want the new turn number's mana. So player2_mana = least(10, turn_number + 1) is correct (that's the turn we're switching to). Same for player1_mana. So we're good. Actually in the code I did player2_mana = least(10, turn_number / 2 + 1) which is wrong. Let me fix: mana for turn T (1-based) should be T, so min(10, T). When we end player1's turn we switch to player2's turn - that's turn_number+1. So player2_mana = least(10, turn_number + 1). And we increment turn_number. So after update turn_number is already incremented, so the next player's turn is turn_number. So when we set player2_mana we're giving mana for the *next* turn which is turn_number+1. So player2_mana = least(10, turn_number + 1). I had turn_number/2+1 which is wrong. Let me fix the migration.
</think>
Corrigindo a lógica de mana nos RPCs:
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace