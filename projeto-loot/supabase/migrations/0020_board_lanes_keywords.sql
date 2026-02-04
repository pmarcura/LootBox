-- Board: 30 HP, 3 slots per side (slot_index 1,2,3), end_turn with lane combat and keywords (BLOCKER=Taunt, OVERCLOCK=First Strike, VAMPIRISM=Lifesteal)

alter table matches
  alter column player1_life set default 30,
  alter column player2_life set default 30;

alter table match_cards
  add column if not exists slot_index int check (slot_index is null or (slot_index >= 1 and slot_index <= 3));

comment on column match_cards.slot_index is 'Board slot 1,2,3 (left to right). Null when position in (deck, hand).';

-- play_card: now accepts slot 1,2,3; does NOT switch turn (player can play more or pass)
create or replace function play_card(p_match_id uuid, p_match_card_id uuid, p_slot int default 1)
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
  v_occupied int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_slot is null or p_slot < 1 or p_slot > 3 then raise exception 'invalid_slot'; end if;

  select * into v_match from matches where id = p_match_id and status = 'active';
  if v_match is null then raise exception 'match_not_found'; end if;

  if (v_match.current_turn = 'player1' and v_match.player1_id != v_uid)
     or (v_match.current_turn = 'player2' and v_match.player2_id != v_uid) then
    raise exception 'not_your_turn';
  end if;

  select count(*) into v_occupied from match_cards
  where match_id = p_match_id and owner = v_match.current_turn and position = 'board' and slot_index = p_slot;
  if v_occupied > 0 then raise exception 'slot_occupied'; end if;

  select * into v_mc from match_cards
  where id = p_match_card_id and match_id = p_match_id
    and owner = v_match.current_turn and position = 'hand';
  if v_mc is null then raise exception 'invalid_card'; end if;

  select final_hp, mana_cost into v_uc from user_cards where id = v_mc.user_card_id;
  v_mana := case when v_match.current_turn = 'player1' then v_match.player1_mana else v_match.player2_mana end;
  if v_mana < v_uc.mana_cost then raise exception 'not_enough_mana'; end if;

  update match_cards set position = 'board', current_hp = v_uc.final_hp, slot_index = p_slot, order_index = p_slot where id = p_match_card_id;

  if v_match.current_turn = 'player1' then
    update matches set player1_mana = player1_mana - v_uc.mana_cost, updated_at = now() where id = p_match_id;
  else
    update matches set player2_mana = player2_mana - v_uc.mana_cost, updated_at = now() where id = p_match_id;
  end if;
end;
$$;

-- end_turn: draw 1 card, resolve combat (lanes 1,2,3 with BLOCKER/OVERCLOCK/VAMPIRISM), switch turn and grant mana
create or replace function end_turn(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_match record;
  v_attacker record;
  v_defender record;
  v_slot int;
  v_atk int;
  v_dmg int;
  v_heal int;
  v_att_hp int;
  v_def_hp int;
  v_att_keyword text;
  v_def_keyword text;
  v_face_dmg int;
  v_has_blocker int;
  v_drawn uuid;
  v_new_p1_life int;
  v_new_p2_life int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_match from matches where id = p_match_id and status = 'active';
  if v_match is null then raise exception 'match_not_found'; end if;

  if (v_match.current_turn = 'player1' and v_match.player1_id != v_uid)
     or (v_match.current_turn = 'player2' and v_match.player2_id != v_uid) then
    raise exception 'not_your_turn';
  end if;

  -- Draw phase: draw 1 card for current player (from deck to hand)
  select mc.id into v_drawn from match_cards mc
  where mc.match_id = p_match_id and mc.owner = v_match.current_turn and mc.position = 'deck'
  order by random() limit 1;
  if v_drawn is not null then
    update match_cards set position = 'hand', order_index = 0, slot_index = null where id = v_drawn;
  end if;

  -- Combat phase: resolve lane by lane (1, 2, 3)
  v_new_p1_life := v_match.player1_life;
  v_new_p2_life := v_match.player2_life;

  for v_slot in 1..3 loop
    -- Attacker: current turn player's card in this slot
    select mc.id, mc.current_hp, uc.final_atk, uc.keyword
    into v_attacker
    from match_cards mc
    join user_cards uc on uc.id = mc.user_card_id
    where mc.match_id = p_match_id and mc.owner = v_match.current_turn and mc.position = 'board' and mc.slot_index = v_slot
    limit 1;

    if v_attacker.id is null then continue; end if;

    v_att_keyword := v_attacker.keyword;
    v_atk := v_attacker.final_atk;

    -- Defender: opponent's card in same slot
    select mc.id, mc.current_hp, uc.keyword
    into v_defender
    from match_cards mc
    join user_cards uc on uc.id = mc.user_card_id
    where mc.match_id = p_match_id and mc.owner != v_match.current_turn and mc.position = 'board' and mc.slot_index = v_slot
    limit 1;

    if v_defender.id is not null then
      v_def_keyword := v_defender.keyword;
      v_def_hp := v_defender.current_hp;
      v_att_hp := v_attacker.current_hp;

      -- OVERCLOCK (First Strike): attacker deals damage first; if defender dies, defender does not strike back
      if v_att_keyword = 'OVERCLOCK' then
        v_dmg := least(v_atk, v_def_hp);
        v_def_hp := v_def_hp - v_dmg;
        if v_def_hp <= 0 then
          update match_cards set position = 'board', current_hp = 0 where id = v_defender.id;
          delete from match_cards where id = v_defender.id;
          if v_match.current_turn = 'player1' then v_new_p2_life := greatest(0, v_new_p2_life - (v_atk - v_dmg)); else v_new_p1_life := greatest(0, v_new_p1_life - (v_atk - v_dmg)); end if;
          if v_att_keyword = 'VAMPIRISM' and v_dmg > 0 then
            if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_dmg); end if;
          end if;
          continue;
        end if;
        update match_cards set current_hp = v_def_hp where id = v_defender.id;
        if v_defender.keyword != 'OVERCLOCK' then
          v_dmg := least((select uc.final_atk from user_cards uc join match_cards mc on mc.user_card_id = uc.id where mc.id = v_defender.id), v_att_hp);
          v_att_hp := v_att_hp - v_dmg;
          if v_att_hp <= 0 then delete from match_cards where id = v_attacker.id; else update match_cards set current_hp = v_att_hp where id = v_attacker.id; end if;
          if v_defender.keyword = 'VAMPIRISM' and v_dmg > 0 then
            if v_match.current_turn = 'player1' then v_new_p2_life := least(30, v_new_p2_life + v_dmg); else v_new_p1_life := least(30, v_new_p1_life + v_dmg); end if;
          end if;
        end if;
        if v_att_keyword = 'VAMPIRISM' and v_dmg > 0 then
          if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_dmg); end if;
        end if;
        continue;
      end if;

      -- Normal combat: simultaneous (or defender first if defender has OVERCLOCK - skip for simplicity, treat as simultaneous)
      v_dmg := least(v_atk, v_def_hp);
      v_def_hp := v_def_hp - v_dmg;
      if v_def_hp <= 0 then delete from match_cards where id = v_defender.id; else update match_cards set current_hp = v_def_hp where id = v_defender.id; end if;
      if v_att_keyword = 'VAMPIRISM' and v_dmg > 0 then
        if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_dmg); end if;
      end if;

      v_dmg := (select least(uc.final_atk, v_att_hp) from user_cards uc join match_cards mc on mc.user_card_id = uc.id where mc.id = v_defender.id);
      if v_dmg is null then v_dmg := 0; end if;
      v_att_hp := v_att_hp - v_dmg;
      if v_att_hp <= 0 then delete from match_cards where id = v_attacker.id; else update match_cards set current_hp = v_att_hp where id = v_attacker.id; end if;
      if v_defender.keyword = 'VAMPIRISM' and v_dmg > 0 then
        if v_match.current_turn = 'player1' then v_new_p2_life := least(30, v_new_p2_life + v_dmg); else v_new_p1_life := least(30, v_new_p1_life + v_dmg); end if;
      end if;
    else
      -- Face damage: no enemy in slot. BLOCKER (Taunt): if any enemy has BLOCKER, redirect to one of them instead of face
      select count(*) into v_has_blocker from match_cards mc
      join user_cards uc on uc.id = mc.user_card_id
      where mc.match_id = p_match_id and mc.owner != v_match.current_turn and mc.position = 'board' and uc.keyword = 'BLOCKER';
      if v_has_blocker > 0 then
        select mc.id, mc.current_hp, uc.keyword into v_defender
        from match_cards mc join user_cards uc on uc.id = mc.user_card_id
        where mc.match_id = p_match_id and mc.owner != v_match.current_turn and mc.position = 'board' and uc.keyword = 'BLOCKER'
        order by mc.slot_index limit 1;
        v_def_hp := v_defender.current_hp;
        v_dmg := least(v_atk, v_def_hp);
        v_def_hp := v_def_hp - v_dmg;
        if v_def_hp <= 0 then delete from match_cards where id = v_defender.id; else update match_cards set current_hp = v_def_hp where id = v_defender.id; end if;
        v_face_dmg := v_atk - v_dmg;
        if v_face_dmg > 0 then
          if v_match.current_turn = 'player1' then v_new_p2_life := greatest(0, v_new_p2_life - v_face_dmg); else v_new_p1_life := greatest(0, v_new_p1_life - v_face_dmg); end if;
        end if;
        if v_att_keyword = 'VAMPIRISM' and v_atk > 0 then
          if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_atk); else v_new_p2_life := least(30, v_new_p2_life + v_atk); end if;
        end if;
      else
        v_face_dmg := v_atk;
        if v_match.current_turn = 'player1' then v_new_p2_life := greatest(0, v_new_p2_life - v_face_dmg); else v_new_p1_life := greatest(0, v_new_p1_life - v_face_dmg); end if;
        if v_att_keyword = 'VAMPIRISM' and v_face_dmg > 0 then
          if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_face_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_face_dmg); end if;
        end if;
      end if;
    end if;
  end loop;

  -- Update lives and switch turn
  if v_match.current_turn = 'player1' then
    update matches set
      player1_life = v_new_p1_life,
      player2_life = v_new_p2_life,
      current_turn = 'player2',
      turn_number = turn_number + 1,
      player2_mana = least(10, turn_number + 1),
      updated_at = now(),
      winner_id = case when v_new_p2_life <= 0 then player1_id else winner_id end,
      status = case when v_new_p2_life <= 0 then 'finished'::match_status else status end
    where id = p_match_id;
  else
    update matches set
      player1_life = v_new_p1_life,
      player2_life = v_new_p2_life,
      current_turn = 'player1',
      turn_number = turn_number + 1,
      player1_mana = least(10, turn_number + 1),
      updated_at = now(),
      winner_id = case when v_new_p1_life <= 0 then player2_id else winner_id end,
      status = case when v_new_p1_life <= 0 then 'finished'::match_status else status end
    where id = p_match_id;
  end if;
end;
$$;

comment on function play_card(uuid, uuid, int) is 'Play a card from hand to board slot 1,2,3. Does not end turn.';
comment on function end_turn(uuid) is 'Draw 1 card, resolve combat (lanes 1-3 with BLOCKER/OVERCLOCK/VAMPIRISM), switch turn.';
