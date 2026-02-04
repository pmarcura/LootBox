# Projeto Loot (Genesis TCG)

App Next.js para resgate de códigos, gacha (lootbox) e fusão vessel + strain (Projeto Genesis).

## Requisitos

- Node.js 18+
- Projeto Supabase remoto (sem stack local)

## Configuração

1. Crie um projeto em [Supabase Dashboard](https://supabase.com/dashboard).
2. Em **Settings > API** copie: Project URL, Publishable Key, Service Role Key.
3. Crie `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

4. Aplique migrações e seed via **MCP** (Cursor): use `apply_migration` e, se necessário, `execute_sql`. Não é usado Supabase local nem `supabase start`.

## Desenvolvimento

```bash
npm install
npm run setup   # seed + códigos + admin (contra o projeto remoto)
npm run dev     # app em http://localhost:3000
```

## Documentação

- [LOCAL_DEV.md](docs/LOCAL_DEV.md) – desenvolvimento e comandos.
- [API_E_MCP.md](docs/API_E_MCP.md) – uso da API e **regra de sempre usar MCP** para migrações e SQL no banco.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) – fluxo resgate → inventário → fusão e onde estão actions/RPCs/componentes.
- [SEASONS.md](docs/SEASONS.md) – como adicionar nova temporada (JSON + seed).
- [ASSETS.md](docs/ASSETS.md) – áudio do reveal e imagens (placeholders por raridade).

## Qualidade e segurança

As regras em `.cursor/rules/` orientam o desenvolvimento: **security-data-integrity** (integridade de dados e segurança) e **core-quality** (higiene de código). Novas features e alterações devem seguir essas diretrizes.

## Testes

```bash
npm run test:run   # testes unitários (Vitest)
```

## Deploy

O app pode ser implantado em Vercel ou qualquer host Node; configure as mesmas variáveis de ambiente apontando para o projeto Supabase remoto.
