-- Experience on profiles and grant XP when a match finishes

alter table profiles
  add column if not exists experience int not null default 0;

comment on column profiles.experience is 'XP earned from finished duels; level can be derived (e.g. floor(sqrt(experience/100)) + 1)';

-- Trigger: when a match becomes finished, grant XP to both players (winner +50, loser +20)
create or replace function grant_experience_on_match_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'finished' and (old.status is null or old.status <> 'finished') then
    if new.winner_id is not null then
      update profiles set experience = experience + 50 where id = new.winner_id;
      if new.player1_id = new.winner_id then
        update profiles set experience = experience + 20 where id = new.player2_id;
      else
        update profiles set experience = experience + 20 where id = new.player1_id;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists match_finished_grant_xp on matches;
create trigger match_finished_grant_xp
  after update on matches
  for each row
  execute function grant_experience_on_match_finished();
