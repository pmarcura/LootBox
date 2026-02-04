-- Perfil do jogador: preencher display_name e avatar_url a partir de OAuth (Google: full_name, name, picture)
-- e atualizar em conflito para que re-login com Google atualize nome/foto.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_avatar_url text;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  v_avatar_url := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  insert into profiles (id, display_name, avatar_url)
  values (new.id, v_display_name, v_avatar_url)
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$;
