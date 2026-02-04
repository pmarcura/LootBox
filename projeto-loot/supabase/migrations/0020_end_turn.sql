-- end_turn: draw 1, resolve combat per lane (1,2,3), BLOCKER/OVERCLOCK/VAMPIRISM, switch turn

create or replace function end_turn(p_match_id uuid)
returns void
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
  v_blocker_hp int;
  v_blocker_atk int;
  v_blocker_kw text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_match from matches where id = p_match_id and status = 'active';
  if v_match is null then raise exception 'match_not_found'; end if;

  if (v_match.current_turn = 'player1' and v_match.player1_id != v_uid)
     or (v_match.current_turn = 'player2' and v_match.player2_id != v_uid) then
    raise exception 'not_your_turn';
  end if;

  -- Draw 1 card
  select id into v_drawn_id from match_cards
  where match_id = p_match_id and owner = v_match.current_turn and position = 'deck'
  order by random() limit 1;
  if v_drawn_id is not null then
    update match_cards set position = 'hand', order_index = 0, slot_index = null where id = v_drawn_id;
  end if;

  v_new_p1_life := v_match.player1_life;
  v_new_p2_life := v_match.player2_life;

  -- Combat: lanes 1, 2, 3
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
      -- Lane has defender: combat
      -- OVERCLOCK: attacker hits first; if defender dies, no counter
      if v_att_kw = 'OVERCLOCK' then
        v_dmg_to_def := least(v_att_atk, v_def_hp);
        v_def_hp := v_def_hp - v_dmg_to_def;
        if v_att_kw = 'VAMPIRISM' and v_dmg_to_def > 0 then
          if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_def); else v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_def); end if;
        end if;
        if v_def_hp <= 0 then
          delete from match_cards where id = v_def_id;
          v_face_dmg := v_att_atk - v_dmg_to_def;
          if v_face_dmg > 0 then
            if v_match.current_turn = 'player1' then v_new_p2_life := greatest(0, v_new_p2_life - v_face_dmg); else v_new_p1_life := greatest(0, v_new_p1_life - v_face_dmg); end if;
            if v_att_kw = 'VAMPIRISM' then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_face_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_face_dmg); end if; end if;
          end if;
        else
          update match_cards set current_hp = v_def_hp where id = v_def_id;
          v_dmg_to_att := least(v_def_atk, v_att_hp);
          v_att_hp := v_att_hp - v_dmg_to_att;
          if v_def_kw = 'VAMPIRISM' and v_dmg_to_att > 0 then if v_match.current_turn = 'player1' then v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_att); else v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_att); end if; end if;
          if v_att_hp <= 0 then delete from match_cards where id = v_att_id; else update match_cards set current_hp = v_att_hp where id = v_att_id; end if;
        end if;
      else
        -- Simultaneous combat
        v_dmg_to_def := least(v_att_atk, v_def_hp);
        v_dmg_to_att := least(v_def_atk, v_att_hp);
        v_def_hp := v_def_hp - v_dmg_to_def;
        v_att_hp := v_att_hp - v_dmg_to_att;
        if v_att_kw = 'VAMPIRISM' and v_dmg_to_def > 0 then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_def); else v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_def); end if; end if;
        if v_def_kw = 'VAMPIRISM' and v_dmg_to_att > 0 then if v_match.current_turn = 'player1' then v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_att); else v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_att); end if; end if;
        if v_def_hp <= 0 then delete from match_cards where id = v_def_id; else update match_cards set current_hp = v_def_hp where id = v_def_id; end if;
        if v_att_hp <= 0 then delete from match_cards where id = v_att_id; else update match_cards set current_hp = v_att_hp where id = v_att_id; end if;
      end if;
    else
      -- No defender in lane: face or BLOCKER
      select count(*) into v_has_blocker from match_cards mc join user_cards uc on uc.id = mc.user_card_id
      where mc.match_id = p_match_id and mc.owner != v_match.current_turn and mc.position = 'board' and uc.keyword = 'BLOCKER';
      if v_has_blocker > 0 then
        select mc.id, mc.current_hp, uc.final_atk, uc.keyword into v_blocker_id, v_blocker_hp, v_blocker_atk, v_blocker_kw
        from match_cards mc join user_cards uc on uc.id = mc.user_card_id
        where mc.match_id = p_match_id and mc.owner != v_match.current_turn and mc.position = 'board' and uc.keyword = 'BLOCKER'
        order by mc.slot_index limit 1;
        v_dmg_to_def := least(v_att_atk, v_blocker_hp);
        v_blocker_hp := v_blocker_hp - v_dmg_to_def;
        if v_att_kw = 'VAMPIRISM' and v_dmg_to_def > 0 then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_dmg_to_def); else v_new_p2_life := least(30, v_new_p2_life + v_dmg_to_def); end if; end if;
        if v_blocker_hp <= 0 then delete from match_cards where id = v_blocker_id; v_face_dmg := v_att_atk - v_dmg_to_def; else update match_cards set current_hp = v_blocker_hp where id = v_blocker_id; v_face_dmg := 0; end if;
        if v_face_dmg > 0 then if v_match.current_turn = 'player1' then v_new_p2_life := greatest(0, v_new_p2_life - v_face_dmg); else v_new_p1_life := greatest(0, v_new_p1_life - v_face_dmg); end if; if v_att_kw = 'VAMPIRISM' then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_face_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_face_dmg); end if; end if; end if;
      else
        v_face_dmg := v_att_atk;
        if v_match.current_turn = 'player1' then v_new_p2_life := greatest(0, v_new_p2_life - v_face_dmg); else v_new_p1_life := greatest(0, v_new_p1_life - v_face_dmg); end if;
        if v_att_kw = 'VAMPIRISM' and v_face_dmg > 0 then if v_match.current_turn = 'player1' then v_new_p1_life := least(30, v_new_p1_life + v_face_dmg); else v_new_p2_life := least(30, v_new_p2_life + v_face_dmg); end if; end if;
      end if;
    end if;
  end loop;

  if v_match.current_turn = 'player1' then
    update matches set player1_life = v_new_p1_life, player2_life = v_new_p2_life, current_turn = 'player2', turn_number = turn_number + 1, player2_mana = least(10, turn_number + 1), updated_at = now(), winner_id = case when v_new_p2_life <= 0 then player1_id else winner_id end, status = case when v_new_p2_life <= 0 then 'finished'::match_status else status end where id = p_match_id;
  else
    update matches set player1_life = v_new_p1_life, player2_life = v_new_p2_life, current_turn = 'player1', turn_number = turn_number + 1, player1_mana = least(10, turn_number + 1), updated_at = now(), winner_id = case when v_new_p1_life <= 0 then player2_id else winner_id end, status = case when v_new_p1_life <= 0 then 'finished'::match_status else status end where id = p_match_id;
  end if;
end;
$$;
