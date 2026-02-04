alter table profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

create policy profiles_admin_select
  on profiles for select
  using (public.is_admin());

create policy collectibles_admin_write
  on collectibles_catalog for all
  using (public.is_admin())
  with check (public.is_admin());

create policy redemption_codes_admin_select
  on redemption_codes for select
  using (public.is_admin());

create policy user_inventory_admin_select
  on user_inventory for select
  using (public.is_admin());
