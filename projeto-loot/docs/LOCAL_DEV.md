# Desenvolvimento local (sem Supabase local)

O projeto **não utiliza Supabase local** (sem Docker, sem `supabase start`). Tudo roda contra o **projeto Supabase remoto**.

## O que você precisa

1. **Projeto no [Supabase Dashboard](https://supabase.com/dashboard)** – criar e obter URL e chaves.
2. **`.env.local`** na raiz com:
   - `NEXT_PUBLIC_SUPABASE_URL` – Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY` – para rate limit de login e painel admin
   - `DATABASE_URL` – Connection string do Postgres (Supabase: Settings > Database > Connection string; usar **pooler** para serverless). Obrigatório para Server Actions que usam Drizzle (resgate, fusão, dissolução, marketplace).

## Rodar o app

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). O app fala só com a API do projeto remoto.

## Migrações e SQL no banco

**Regra:** usar **apenas MCP** para alterar o schema ou rodar SQL no Supabase:

- **Migrações:** ferramenta MCP `apply_migration` (nome em snake_case + query SQL).
- **Consultas/inserts manuais:** ferramenta MCP `execute_sql`.

Não usar `supabase db push`, `supabase start` nem SQL Editor manual como fluxo principal; o projeto está configurado para ser gerenciado via MCP.

## Setup inicial de dados

```bash
npm run setup
```

Isso roda seed do catálogo, import de códigos e bootstrap do admin contra o **projeto remoto** (usando as variáveis de `.env.local`).

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | App em desenvolvimento |
| `npm run setup` | Seed + códigos + admin |
| `npm run seed:catalog` | Insere criaturas de `supabase/data/season01.json` |
| `npm run seed:test-codes` | Gera 10 códigos de teste e insere no banco |
| `npm run seed:test-codes -- --count 50` | Gera N códigos (ex.: 50 para sessão com amigos) |
| `npm run import:codes` | Importa códigos do CSV |
| `npm run bootstrap:admin` | Cria usuário admin |
| `npm run supabase:types` | Gera tipos TS (requer `supabase link` ao projeto remoto) |

## Gerar tipos TypeScript

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npm run supabase:types
```

O Project Ref é o ID na URL do projeto (ex.: `https://xxxx.supabase.co` → `xxxx`).

## Testar com amigos em casa (6 pessoas)

Para jogar com vários amigos na mesma rede:

1. **Setup inicial**
   - Configure `.env.local` e rode `npm run setup`.
   - Aplique as migrações **0017_starter_pack**, **0018_friends** e **0019_duels** via MCP (`apply_migration`).

2. **Starter pack**
   - Cada usuário que criar conta e entrar no app recebe automaticamente um **starter pack** (4 vessels + 4 strains common/uncommon) na primeira sessão. Assim todos podem jogar sem depender de códigos físicos.

3. **Códigos de teste (opcional)**
   - Para gerar mais códigos de resgate (ex.: 50 para 6 pessoas):
   ```bash
   npm run seed:test-codes -- --count 50
   ```
   - Os códigos são impressos no terminal; cada pessoa pode resgatar em `/gacha`.

4. **Fluxo para 6 pessoas**
   - Cada um acessa o app (ex.: `http://SEU_IP:3000` na mesma rede), cria conta em **Registrar** e faz login.
   - Na primeira vez, o starter pack é concedido automaticamente.
   - Cada um pode: **Resgatar** (código, se tiver), **Inventário**, **Fusão** (vessel + strain → carta), **Marketplace** (comprar lootbox com essência).
   - Em **Amigos**, adicione os outros por email (cada um envia pedido; o outro aceita).
   - Em **Duelos**, escolha “Desafiar amigo”, selecione 5 cartas para o deck e envie o convite. O amigo aceita e escolhe seu deck; a partida começa.
   - Na tela da partida: jogue cartas (custa mana), ataque com cartas no tabuleiro para reduzir a vida do oponente. Quem zerar a vida do adversário vence.

5. **Requisitos para duelar**
   - Ter pelo menos 5 cartas fundidas (Lab de Fusão). O starter pack dá vessels e strains; funda algumas para ter cartas para o deck.

## Deploy (Vercel)

- **Node:** O projeto exige Node 20.9+ (compatível com Node 24.x). O Vercel usa Node 24 por padrão em 2026.
- **Configuração:** No dashboard da Vercel, importe o repositório e defina a raiz do projeto (ex.: `projeto-loot` se for monorepo). Build command: `next build` (padrão).
- **Variáveis de ambiente:** Configure as mesmas do desenvolvimento local: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), e `SUPABASE_SERVICE_ROLE_KEY` se usar server actions que precisem de role.
- **PWA:** O app é instalável (manifest). Para funcionar “Adicionar ao ecrã”, o deploy deve ser em HTTPS (garantido na Vercel). Ícones PWA em `public/`: `icon-192x192.png` e `icon-512x512.png` (ver [docs/MOBILE_STACK.md](MOBILE_STACK.md)).

## Troubleshooting

- **Variáveis ausentes:** crie `.env.local` com as três chaves do Dashboard (Settings > API).
- **Código não encontrado:** execute `npm run import:codes` com o CSV correto; códigos devem estar no banco remoto.
- **Rate limit:** aguarde a janela (ex. 5 min) ou, em dev, limpe as tabelas de tentativas via MCP `execute_sql`.
