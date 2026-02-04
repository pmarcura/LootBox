-- Enrich match_events payloads: actor (play_card, buy_card) and attacker_side + events (combat)

drop function if exists end_turn(uuid);

create or replace function end_turn(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_match record;
  v_slot int;
  v_att_id uuid;
  v_def_id uuid;
  v_att_hp int;
  v_def_hp int;
  v_att_atk int;
  v_def_atk int;
  v_att_kw text;
  v_def_kw text;
  v_dmg_to_def int;
  v_dmg_to_att int;
  v_face_dmg int;
  v_new_p1_life int;
  v_new_p2_life int;
  v_drawn_id uuid;
  v_has_blocker int;
  v_blocker_id uuid;
  v_blocker_slot int;
  v_blocker_hp int;
  v_blocker_atk int;
  v_blocker_kw text;
  v_events jsonb := '[]'::jsonb;
  v_attacker_side text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_match from matches where id = p_match_id and status = 'active';
  if v_match is null then raise exception 'match_not_found'; end if;

  if (v_match.current_turn = 'player1' and v_match.player1_id != v_uid)
     or (v_match.current_turn = 'player2' and v_match.player2_id != v_uid) then
    raise exception 'not_your_turn';
  end if;

  v_attacker_side := case when v_match.current_turn = 'player1' then 'player1' else 'player2' end;

  select id into v_drawn_id from match_cards
  where match_id = p_match_id and owner = v_match.current_turn and position = 'deck'
  order by random() limit 1;
  if v_drawn_id is not null then
    update match_cards set position = 'hand', order_index = 0, slot_index = null where id = v_drawn_id;
  end if;

  v_new_p1_life := v_match.player1_life;
  v_new_p2_life := v_match.player2_life;

  for v_slot in 1..3 loop
    select mc.id, mc.current_hp, uc.final_atk, uc.keyword
    into v_att_id, v_att_hp, v_att_atk, v_att_kw
    from match_cards mc
    join user_cards uc on uc.id = mc.user_card_id
    where mc.match_id = p_match_id and mc.owner = v_match.current_turn and mc.position = 'board' and mc.slot_index = v_slot
    limit 1;

    if v_att_id is null then continue; end if;

    select mc.id, mc.current_hp, uc.final_atk, uc.keyword
    into v_def_id, v_def_hp, v_def_atk, v_def_kw
    from match_cards mc
    join user_cards uc on uc.id = mc.user_card_id
    where mc.match_id = p_match_id and mc.owner != v_match.current_turn and mc.position = 'board' and mc.slot_index = v_slot
    limit 1;

    if v_def_id is not null then
      if v_att_kw = 'OVERCLOCK' then
        v_events := v_events || jsonb_build_object('t', 'first_strike', 'lane', v_slot, 'attacker_id', v_att_id, 'defender_id', v_def_id);
        v_dmg_to_def := least(v_att_atk, v_def_hp);
        v_def_hp := v_def_hp - v_dmg_to_def;
        v_events := v_events || jsonb_build_object('t', 'damage', 'lane', v_slot, 'target_id', v_def_id, 'amount', v_dmg_to_def, 'side', 'defender');
        if v_att_kw = 'VAMPIRISM' and v_dmg_to_def > 0 then
          if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_def); else v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_def); end if;
          v_events := v_events || jsonb_build_object('t', 'heal', 'target', v_attacker_side, 'amount', v_dmg_to_def);
        end if;
        if v_def_hp <= 0 then
          v_events := v_events || jsonb_build_object('t', 'death', 'lane', v_slot, 'card_id', v_def_id);
          update match_cards set position = 'discard', slot_index = null where id = v_def_id;
          v_face_dmg := v_att_atk - v_dmg_to_def;
          if v_face_dmg > 0 then
            if v_match.current_turn = 'player1' then v_new_p2_life := greatest(0, v_new_p2_life - v_face_dmg); else v_new_p1_life := greatest(0, v_new_p1_life - v_face_dmg); end if;
            v_events := v_events || jsonb_build_object('t', 'face', 'target', case when v_match.current_turn = 'player1' then 'player2' else 'player1' end, 'amount', v_face_dmg, 'life_after', case when v_match.current_turn = 'player1' then v_new_p2_life else v_new_p1_life end);
            if v_att_kw = 'VAMPIRISM' then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_face_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_face_dmg); end if; v_events := v_events || jsonb_build_object('t', 'heal', 'target', v_attacker_side, 'amount', v_face_dmg); end if;
          end if;
        else
          update match_cards set current_hp = v_def_hp where id = v_def_id;
          v_dmg_to_att := least(v_def_atk, v_att_hp);
          v_att_hp := v_att_hp - v_dmg_to_att;
          v_events := v_events || jsonb_build_object('t', 'damage', 'lane', v_slot, 'target_id', v_att_id, 'amount', v_dmg_to_att, 'side', 'attacker');
          if v_def_kw = 'VAMPIRISM' and v_dmg_to_att > 0 then if v_match.current_turn = 'player1' then v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_att); else v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_att); end if; v_events := v_events || jsonb_build_object('t', 'heal', 'target', case when v_match.current_turn = 'player1' then 'player2' else 'player1' end, 'amount', v_dmg_to_att); end if;
          if v_att_hp <= 0 then v_events := v_events || jsonb_build_object('t', 'death', 'lane', v_slot, 'card_id', v_att_id); update match_cards set position = 'discard', slot_index = null where id = v_att_id; else update match_cards set current_hp = v_att_hp where id = v_att_id; end if;
        end if;
      else
        v_events := v_events || jsonb_build_object('t', 'attack', 'lane', v_slot, 'attacker_id', v_att_id, 'defender_id', v_def_id);
        v_dmg_to_def := least(v_att_atk, v_def_hp);
        v_dmg_to_att := least(v_def_atk, v_att_hp);
        v_def_hp := v_def_hp - v_dmg_to_def;
        v_att_hp := v_att_hp - v_dmg_to_att;
        v_events := v_events || jsonb_build_object('t', 'damage', 'lane', v_slot, 'target_id', v_def_id, 'amount', v_dmg_to_def, 'side', 'defender');
        v_events := v_events || jsonb_build_object('t', 'damage', 'lane', v_slot, 'target_id', v_att_id, 'amount', v_dmg_to_att, 'side', 'attacker');
        if v_att_kw = 'VAMPIRISM' and v_dmg_to_def > 0 then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_def); else v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_def); end if; v_events := v_events || jsonb_build_object('t', 'heal', 'target', v_attacker_side, 'amount', v_dmg_to_def); end if;
        if v_def_kw = 'VAMPIRISM' and v_dmg_to_att > 0 then if v_match.current_turn = 'player1' then v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_att); else v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_att); end if; v_events := v_events || jsonb_build_object('t', 'heal', 'target', case when v_match.current_turn = 'player1' then 'player2' else 'player1' end, 'amount', v_dmg_to_att); end if;
        if v_def_hp <= 0 then v_events := v_events || jsonb_build_object('t', 'death', 'lane', v_slot, 'card_id', v_def_id); update match_cards set position = 'discard', slot_index = null where id = v_def_id; else update match_cards set current_hp = v_def_hp where id = v_def_id; end if;
        if v_att_hp <= 0 then v_events := v_events || jsonb_build_object('t', 'death', 'lane', v_slot, 'card_id', v_att_id); update match_cards set position = 'discard', slot_index = null where id = v_att_id; else update match_cards set current_hp = v_att_hp where id = v_att_id; end if;
      end if;
    else
      select count(*) into v_has_blocker from match_cards mc join user_cards uc on uc.id = mc.user_card_id
      where mc.match_id = p_match_id and mc.owner != v_match.current_turn and mc.position = 'board' and uc.keyword = 'BLOCKER';
      if v_has_blocker > 0 then
        select mc.id, mc.slot_index, mc.current_hp, uc.final_atk, uc.keyword into v_blocker_id, v_blocker_slot, v_blocker_hp, v_blocker_atk, v_blocker_kw
        from match_cards mc join user_cards uc on uc.id = mc.user_card_id
        where mc.match_id = p_match_id and mc.owner != v_match.current_turn and mc.position = 'board' and uc.keyword = 'BLOCKER'
        order by mc.slot_index limit 1;
        v_events := v_events || jsonb_build_object('t', 'redirect', 'lane', v_slot, 'attacker_id', v_att_id, 'blocker_id', v_blocker_id, 'blocker_slot', v_blocker_slot);
        v_dmg_to_def := least(v_att_atk, v_blocker_hp);
        v_blocker_hp := v_blocker_hp - v_dmg_to_def;
        v_events := v_events || jsonb_build_object('t', 'damage', 'lane', v_blocker_slot, 'target_id', v_blocker_id, 'amount', v_dmg_to_def, 'side', 'defender');
        if v_att_kw = 'VAMPIRISM' and v_dmg_to_def > 0 then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_def); else v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_def); end if; v_events := v_events || jsonb_build_object('t', 'heal', 'target', v_attacker_side, 'amount', v_dmg_to_def); end if;
        if v_blocker_hp <= 0 then v_events := v_events || jsonb_build_object('t', 'death', 'lane', v_blocker_slot, 'card_id', v_blocker_id); update match_cards set position = 'discard', slot_index = null where id = v_blocker_id; v_face_dmg := v_att_atk - v_dmg_to_def; else update match_cards set current_hp = v_blocker_hp where id = v_blocker_id; v_face_dmg := 0; end if;
        if v_face_dmg > 0 then if v_match.current_turn = 'player1' then v_new_p2_life := greatest(0, v_new_p2_life - v_face_dmg); else v_new_p1_life := greatest(0, v_new_p1_life - v_face_dmg); end if; v_events := v_events || jsonb_build_object('t', 'face', 'target', case when v_match.current_turn = 'player1' then 'player2' else 'player1' end, 'amount', v_face_dmg, 'life_after', case when v_match.current_turn = 'player1' then v_new_p2_life else v_new_p1_life end); if v_att_kw = 'VAMPIRISM' then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_face_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_face_dmg); end if; v_events := v_events || jsonb_build_object('t', 'heal', 'target', v_attacker_side, 'amount', v_face_dmg); end if; end if;
      else
        v_face_dmg := v_att_atk;
        if v_match.current_turn = 'player1' then v_new_p2_life := greatest(0, v_new_p2_life - v_face_dmg); else v_new_p1_life := greatest(0, v_new_p1_life - v_face_dmg); end if;
        v_events := v_events || jsonb_build_object('t', 'face', 'target', case when v_match.current_turn = 'player1' then 'player2' else 'player1' end, 'amount', v_face_dmg, 'life_after', case when v_match.current_turn = 'player1' then v_new_p2_life else v_new_p1_life end);
        if v_att_kw = 'VAMPIRISM' and v_face_dmg > 0 then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_face_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_face_dmg); end if; v_events := v_events || jsonb_build_object('t', 'heal', 'target', v_attacker_side, 'amount', v_face_dmg); end if;
      end if;
    end if;
  end loop;

  insert into match_events (match_id, turn_number, kind, payload)
  values (p_match_id, v_match.turn_number, 'combat', jsonb_build_object('attacker_side', v_attacker_side, 'events', v_events));

  if v_match.current_turn = 'player1' then
    update matches set player1_life = v_new_p1_life, player2_life = v_new_p2_life, current_turn = 'player2', turn_number = turn_number + 1, player2_mana = least(10, turn_number + 1), updated_at = now(), winner_id = case when v_new_p2_life <= 0 then player1_id else winner_id end, status = case when v_new_p2_life <= 0 then 'finished'::match_status else status end where id = p_match_id;
  else
    update matches set player1_life = v_new_p1_life, player2_life = v_new_p2_life, current_turn = 'player1', turn_number = turn_number + 1, player1_mana = least(10, turn_number + 1), updated_at = now(), winner_id = case when v_new_p1_life <= 0 then player2_id else winner_id end, status = case when v_new_p1_life <= 0 then 'finished'::match_status else status end where id = p_match_id;
  end if;

  return v_events;
end;
$$;

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

  select final_hp, final_atk, mana_cost into v_uc from user_cards where id = v_mc.user_card_id;
  v_mana := case when v_match.current_turn = 'player1' then v_match.player1_mana else v_match.player2_mana end;
  if v_mana < v_uc.mana_cost then raise exception 'not_enough_mana'; end if;

  update match_cards set position = 'board', current_hp = v_uc.final_hp, slot_index = p_slot, order_index = p_slot where id = p_match_card_id;

  if v_match.current_turn = 'player1' then
    update matches set player1_mana = player1_mana - v_uc.mana_cost, updated_at = now() where id = p_match_id;
  else
    update matches set player2_mana = player2_mana - v_uc.mana_cost, updated_at = now() where id = p_match_id;
  end if;

  insert into match_events (match_id, turn_number, kind, payload)
  values (p_match_id, v_match.turn_number, 'play_card', jsonb_build_object('slot', p_slot, 'mana_cost', v_uc.mana_cost, 'final_atk', v_uc.final_atk, 'final_hp', v_uc.final_hp, 'actor', v_match.current_turn));
end;
$$;

create or replace function buy_card(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_match record;
  v_card_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_match from matches where id = p_match_id and status = 'active';
  if v_match is null then raise exception 'match_not_found'; end if;

  if (v_match.current_turn = 'player1' and v_match.player1_id != v_uid)
     or (v_match.current_turn = 'player2' and v_match.player2_id != v_uid) then
    raise exception 'not_your_turn';
  end if;

  if (v_match.current_turn = 'player1' and v_match.player1_mana < 1)
     or (v_match.current_turn = 'player2' and v_match.player2_mana < 1) then
    raise exception 'no_mana';
  end if;

  if exists (select 1 from match_cards where match_id = p_match_id and owner = v_match.current_turn and position = 'deck') then
    raise exception 'deck_not_empty';
  end if;

  select id into v_card_id from match_cards
  where match_id = p_match_id and owner = v_match.current_turn and position = 'discard'
  order by random() limit 1;
  if v_card_id is null then
    raise exception 'no_discard';
  end if;

  update match_cards set position = 'hand', order_index = 0, slot_index = null where id = v_card_id;

  if v_match.current_turn = 'player1' then
    update matches set player1_mana = player1_mana - 1, updated_at = now() where id = p_match_id;
  else
    update matches set player2_mana = player2_mana - 1, updated_at = now() where id = p_match_id;
  end if;

  insert into match_events (match_id, turn_number, kind, payload)
  values (p_match_id, v_match.turn_number, 'buy_card', jsonb_build_object('actor', v_match.current_turn));
end;
$$;
