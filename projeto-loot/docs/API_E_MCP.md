# App via API e MCP

O projeto funciona **100% via Supabase API** e é gerenciado via MCP. **Não há Supabase local** (sem Docker, sem `supabase start`).

## Regra: sempre usar MCP para o banco

Para **migrações**, **dados iniciais** e **qualquer SQL** no banco do projeto:

- Use **apenas** as ferramentas MCP do servidor **user-supabase**:
  - `apply_migration` – DDL (criar/alterar tabelas, funções, RLS)
  - `execute_sql` – queries e inserts (ex.: códigos de teste, seeds pontuais)

Não use o CLI para push de migrações como fluxo principal. O projeto está configurado para projeto remoto; migrações ficam em `supabase/migrations/` e são aplicadas via MCP.

## Migrações já aplicadas (MCP)

O schema no Supabase hospedado foi aplicado via MCP, incluindo:

- Redemption engine (tabelas, RLS, `redeem_code`, checksum)
- Admin auth (`is_admin`, políticas)
- Login rate limit
- Genesis: vessels com base_hp/atk/mana, strains, `user_strains`, `user_cards`, `fuse_card`, dissolve

## Fluxo de desenvolvimento

1. **`.env.local`** – URL e chaves do **projeto remoto** (Dashboard > Settings > API).
2. **Dados iniciais:** `npm run setup` (seed, códigos, admin).
3. **App:** `npm run dev` → [http://localhost:3000](http://localhost:3000).
4. **Tipos (opcional):** `npx supabase link --project-ref REF` e `npm run supabase:types`.

## MCP Supabase

Configurado em `.cursor/mcp.json`. Ferramentas principais:

- `execute_sql` – executar SQL
- `apply_migration` – aplicar migração (nome snake_case + query)
- `list_tables` / `list_migrations` – inspecionar estado
- `generate_typescript_types` – gerar tipos do schema
