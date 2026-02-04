-- Habilitar pgcrypto para gen_random_bytes na RPC fuse_card.
-- No Supabase Cloud, a extensão pode já estar ativa; este script é idempotente.
create extension if not exists pgcrypto with schema public;
