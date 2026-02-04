-- Log de ações da partida: tabela + inserções em end_turn, play_card, buy_card

create table if not exists match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  turn_number int not null,
  kind text not null check (kind in ('play_card', 'buy_card', 'combat')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists match_events_match_id_idx on match_events (match_id);
create index if not exists match_events_created_at_idx on match_events (match_id, created_at);

alter table match_events enable row level security;

create policy match_events_select_own_match
  on match_events for select
  using (
    exists (
      select 1 from matches m
      where m.id = match_events.match_id
        and (m.player1_id = auth.uid() or m.player2_id = auth.uid())
    )
  );

comment on table match_events is 'Log of match actions (play card, buy card, combat) for display in UI';
