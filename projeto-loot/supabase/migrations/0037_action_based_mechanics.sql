-- Action-based mechanics: phase, round, attack_token, current_action, pass, declare_attack, defender_reaction
-- Playground usa estas mecânicas; Duels continua com end_turn/play_card legado até migração futura.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'game_phase') then
    create type game_phase as enum ('actions', 'attack_declared', 'defender_reaction', 'combat', 'round_end');
  end if;
end $$;

alter table matches
  add column if not exists phase game_phase default 'actions',
  add column if not exists round_number int default 1,
  add column if not exists attack_token match_player default 'player1',
  add column if not exists current_action match_player default 'player1',
  add column if not exists passed_p1 boolean default false,
  add column if not exists passed_p2 boolean default false,
  add column if not exists declared_attack_slots jsonb;

comment on column matches.phase is 'Action-based phase';
comment on column matches.round_number is 'Round number (mana increases each round)';
comment on column matches.attack_token is 'Player who can declare attack';
comment on column matches.current_action is 'Player with current priority';
comment on column matches.passed_p1 is 'Player1 passed this round';
comment on column matches.passed_p2 is 'Player2 passed this round';
comment on column matches.declared_attack_slots is 'Slots declared for attack [1,2,3]';

-- Inicializa colunas para partidas existentes
update matches
set
  phase = coalesce(phase, 'actions'),
  round_number = coalesce(round_number, greatest(1, turn_number)),
  attack_token = coalesce(attack_token, current_turn),
  current_action = coalesce(current_action, current_turn),
  passed_p1 = coalesce(passed_p1, false),
  passed_p2 = coalesce(passed_p2, false)
where phase is null or current_action is null;
