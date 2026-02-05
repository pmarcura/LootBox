-- Permite registrar que o usuário resgatou a recompensa de XP por completar a Season 01 (Purga).

alter table profiles
  add column if not exists season01_purge_claimed_at timestamptz;

comment on column profiles.season01_purge_claimed_at is 'When the user claimed the Season 01 completion XP reward (Purga). Null = not claimed yet.';
