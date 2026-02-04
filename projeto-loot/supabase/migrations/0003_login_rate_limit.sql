create table if not exists login_attempts (
  id bigserial primary key,
  ip_hash text,
  email_hash text,
  created_at timestamptz not null default now(),
  success boolean not null default false
);

create index if not exists login_attempts_ip_recent_idx
  on login_attempts (ip_hash, created_at desc);

create index if not exists login_attempts_email_recent_idx
  on login_attempts (email_hash, created_at desc);

alter table login_attempts enable row level security;

create policy login_attempts_service_only
  on login_attempts for all
  to service_role
  using (true)
  with check (true);
