# Gênesis

> **Colecione. Fusione. Duelo.** — Universo phygital de criaturas, fusão e partidas estratégicas.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green?logo=supabase)](https://supabase.com/)

---

## O que é o Gênesis?

Gênesis é um jogo de coleção e duelos que conecta o físico ao digital: você **resgata** criaturas com códigos, **fusione** cartas no laboratório e **duelo** contra a IA, amigos ou no modo cooperativo contra ondas de inimigos.

- **Resgate** — Use códigos (físicos ou digitais) para desbloquear criaturas e adicionar à sua coleção.
- **Fusão** — Combine duas criaturas e crie uma nova carta com atributos herdados para usar nos duelos.
- **Duelos** — Três modos: **Vs IA** (treino), **Vs Amigo** (PvP) e **Coop Boss** (2v1 contra ondas até o chefe).
- **Inventário** — Gerencie vessels, strains, cartas fundidas e essência; dissolva itens para ganhar recursos.

O projeto prioriza **integridade de dados**, **anti-fraude** (rate limit, burn-on-redeem) e uma base sólida para economia de itens phygital.

---

## Como jogar (produção)

Acesse o app em deploy (ex.: Vercel), crie sua conta e:

1. **Resgatar** — Cole um código válido para ganhar uma criatura.
2. **Fusão** — No laboratório, escolha 1 vessel + 1 strain para gerar uma carta jogável.
3. **Duelos** — Monte um deck de 5 cartas e jogue vs IA, desafie um amigo ou entre no Coop com outro jogador.
4. **Inventário** — Veja sua coleção, dissolva itens repetidos para essência e monte decks.

---

## Para desenvolvedores

### Requisitos

- **Node.js 18+**
- Projeto **Supabase** (remoto; migrações aplicadas via MCP ou CLI)

### Configuração rápida

1. Clone o repositório e entre na pasta do app:
   ```bash
   cd projeto-loot
   ```
2. Instale dependências:
   ```bash
   npm install
   ```
3. Crie `.env.local` com as variáveis do Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   ```
   Para **produção** (ex.: Vercel), configure também no painel do deploy: `DATABASE_URL` (connection string do Supabase, pooler) e, se quiser, `NEXT_PUBLIC_SITE_URL`. Veja `.env.example`.

4. Aplique migrações no banco (via Supabase Dashboard ou MCP; ver [API_E_MCP.md](docs/API_E_MCP.md)).
5. Rode o seed e o app:
   ```bash
   npm run setup   # seed + códigos de teste + admin
   npm run dev     # http://localhost:3000
   ```

### Scripts úteis

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run check` | Lint + typecheck |
| `npm run test:run` | Testes unitários (Vitest) |
| `npm run predeploy` | Build (recomendado antes de push para `main`) |

### Deploy (ex.: Vercel)

Configure no projeto (ex.: Vercel → Settings → Environment Variables) as mesmas variáveis do `.env.local`, em especial:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`
- **`DATABASE_URL`** — connection string do Postgres (Supabase: Settings → Database → Connection string; use **pooler**). Sem isso, inventário, fusão, resgate e marketplace falham em produção.

**Login com Google:** No Supabase → Authentication → URL Configuration, adicione em **Redirect URLs** a URL do seu deploy, por exemplo `https://seudominio.com/auth/callback` (e, se usar previews, `https://*-seu-projeto.vercel.app/auth/callback`). Assim o OAuth redireciona para o mesmo domínio e evita loop de login.

### Troubleshooting

- **`webpage_content_reporter.js`: Unexpected token 'export'** — Esse erro vem de scripts injetados por **extensões do navegador** (ex.: Cursor, ferramentas de acessibilidade), não do app. Pode ignorar ao depurar o Gênesis; para confirmar, teste em janela anônima sem extensões.

### Documentação

| Documento | Conteúdo |
|-----------|----------|
| [LOCAL_DEV.md](docs/LOCAL_DEV.md) | Desenvolvimento local e comandos |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Fluxo resgate → inventário → fusão → duelos e onde está cada peça |
| [API_E_MCP.md](docs/API_E_MCP.md) | Uso da API e regras para migrações/SQL (MCP) |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Layout, safe area e barra inferior |
| [SEASONS.md](docs/SEASONS.md) | Como adicionar nova temporada |
| [ASSETS.md](docs/ASSETS.md) | Áudio do reveal e imagens por raridade |

---

## Contribuindo

Contribuições são bem-vindas. Antes de enviar:

- Leia [CONTRIBUTING.md](CONTRIBUTING.md).
- Rode `npm run check` e `npm run test:run`.
- Para mudanças que tocam banco ou auth, siga as regras em `.cursor/rules/` (segurança e qualidade).

Use as **issues** para bugs e ideias e abra **pull requests** a partir de um fork.

---

## Stack

- **Next.js 16** (App Router)
- **Supabase** (Auth, Realtime)
- **Drizzle ORM** (queries e migrações aplicadas no Postgres)
- **TypeScript**, **Zod**, **Tailwind CSS**, **Vitest**

---

## Licença

Consulte o repositório para informações de licença.
