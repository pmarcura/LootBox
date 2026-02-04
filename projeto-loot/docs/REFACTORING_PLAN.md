# Plano de refatoração: desempenho e qualidade

## Problema

Ao clicar em abas do menu (Resgatar, Inventário, Fusão, Duelos, etc.), a navegação às vezes demora demais e a interface parece “travada”.

## Causa raiz identificada

### 1. Layout reexecuta 3× auth + 3× profile a cada navegação

O **layout raiz** (`src/app/layout.tsx`) renderiza três Server Components assíncronos que **cada um** faz:

| Componente           | Chamadas |
|---------------------|----------|
| `Header`            | `createSupabaseServerClient()` → `getUser()` → `profiles` (is_admin, essence_balance, display_name, avatar_url) |
| `GrantStarterPack`   | `createSupabaseServerClient()` → `getUser()` → `profiles` (starter_pack_granted_at) → opcionalmente `grant_starter_pack()` |
| `NavBottomWrapper`   | `createSupabaseServerClient()` → `getUser()` → `profiles` (is_admin) |

Ou seja: **a cada clique em uma aba** o Next.js refaz o layout e dispara **3× `getUser()`** e **3× consulta à tabela `profiles`** (e possivelmente 1 RPC). Isso gera:

- Latência de rede multiplicada (Supabase pode serializar ou limitar concorrência).
- Sensação de “freeze” até todas as respostas voltarem.

### 2. Páginas pesadas sem loading explícito

- **Inventário**: 4+ queries em sequência (user_inventory, user_strains, user_cards, depois user_inventory de novo para nomes dos vessels).
- **Gacha**: já usa `dynamic()` para o reveal 3D (bom); o restante da página é leve.
- **Fusão / Duelos**: carregam framer-motion e componentes grandes no chunk da rota; não há `loading.tsx` em todas as rotas.

### 3. Possível falta de `loading.tsx` em rotas lentas

Algumas rotas têm `loading.tsx` (gacha, inventory), outras não. O usuário pode não ver feedback imediato ao trocar de aba.

---

## Plano de refatoração

### Fase 1 — Desempenho do layout (prioridade alta)

1. **Centralizar sessão no layout**
   - Criar um módulo que usa `cache()` do React para obter **uma única vez por request**: `getUser()` + **uma** query em `profiles` com todos os campos necessários (is_admin, essence_balance, display_name, avatar_url, starter_pack_granted_at).
   - No layout: chamar essa função **uma vez** e passar o resultado (user + profile ou null) para:
     - `Header`
     - `NavBottomWrapper`
     - `GrantStarterPack`
   - **Efeito**: elimina 2× `getUser()` e 2× query a `profiles` por navegação; reduz latência e sensação de travamento.

2. **Manter `GrantStarterPack` leve**
   - Receber apenas `user` + `starter_pack_granted_at` (ou um booleano); chamar RPC só quando necessário, sem nova leitura de auth.

### Fase 2 — Páginas e dados (prioridade média)

3. **Inventário: paralelizar e reduzir round-trips**
   - Rodar em paralelo: `user_inventory`, `user_strains`, `user_cards` (onde a lógica permitir).
   - Evitar segunda query em `user_inventory` só para nomes: incluir na primeira query (ou em uma única query agregada) os dados de vessel necessários para `user_cards`, se o schema permitir.

4. **Loading states**
   - Garantir `loading.tsx` em rotas que fazem muitas queries ou têm chunks grandes: fusion, duels, friends, clan, marketplace, profile.

5. **Dynamic import onde fizer sentido**
   - Páginas muito pesadas (ex.: duels com MatchBoard/CombatOverlay) podem usar `next/dynamic` com `ssr: false` ou `loading` para não bloquear a primeira paint da aba.

### Fase 3 — Limpeza e qualidade (prioridade menor)

6. **Remover código não utilizado**
   - Rodar `npm run lint` e corrigir imports/variáveis não usadas.
   - Revisar dependências em `package.json`: tudo que está listado está realmente importado? (howler, @react-spring/three, @radix-ui/react-slot, framer-motion, etc. estão em uso.)

7. **Consolidar tipos**
   - Tipos repetidos entre páginas (ex.: CollectibleRow, InventoryRow em inventory/page.tsx) podem ser movidos para `features/inventory/types.ts` ou `src/types/`.

8. **Revisão contínua**
   - Seguir a regra do projeto: remover código morto, rodar `npm run lint` e `npm run typecheck` antes de finalizar.

---

## Resumo de impacto esperado

| Ação                         | Impacto na sensação de “freeze” / lentidão |
|-----------------------------|--------------------------------------------|
| Centralizar sessão no layout| **Alto** — menos chamadas por clique na aba |
| loading.tsx nas rotas       | **Médio** — feedback imediato ao trocar de aba |
| Paralelizar queries inventário | **Médio** — página inventário mais rápida |
| Dynamic import em rotas pesadas | **Médio** — primeiro paint mais rápido |
| Remover código/deps não usados | **Baixo** (bundle menor, menos ruído) |

---

## Ordem sugerida de implementação

1. Implementar **Fase 1** (sessão centralizada + layout passando props).
2. Medir/subjetivamente testar navegação entre abas; se ainda houver queixas, aplicar itens da Fase 2.
3. Fase 3 em seguida ou em paralelo, conforme tempo disponível.

---

## Status da implementação

| Item | Status |
|------|--------|
| **Fase 1** Sessão centralizada no layout (`getLayoutSession` + props em Header, NavBottomWrapper, GrantStarterPack) | ✅ Feito |
| **Fase 2** Inventário: queries em paralelo (`Promise.all` para user_inventory, user_strains, user_cards) | ✅ Feito |
| **Fase 2** Loading: `loading.tsx` em duels, friends, clan, marketplace | ✅ Feito |
| **Fase 2** Dynamic import: DuelsPanel em `/duels` com `ssr: false` e loading | ✅ Feito |
| **Fase 3** Lint: erro prefer-const e variáveis não usadas (DuelsPanel, LoadoutModal, MatchBoard) | ✅ Feito |
| **Fase 3** Tipos: CollectibleRow, InventoryRow, StrainRow, StrainCatalogRow em `features/inventory/types.ts` | ✅ Feito |
| **Fase 3** Typecheck: profile `[userId]` (viewerId para canViewMatch) | ✅ Feito |
| **Pendente** Warnings de `@next/next/no-img-element`: trocar `<img>` por `<Image />` onde fizer sentido | Opcional |

---

## Next.js, Turbopack e melhorias opcionais

### O que já fizemos

- **Turbopack no dev**: o script `npm run dev` usa `next dev --turbo`. No Next 15 o Turbopack para desenvolvimento é estável: startup e Fast Refresh bem mais rápidos (ordem de ~1s vs ~5s no primeiro start, HMR ~50ms vs ~300ms). Build de produção continua com webpack no Next 15.

### Vale a pena atualizar Next.js?

- **Sim, dentro do 15.x**: manter `next` e `eslint-config-next` atualizados (ex.: `npm update next eslint-config-next`) traz correções e melhorias sem quebrar a API.
- **Next 16 (quando sair/estabilizar)**: Turbopack passa a ser o bundler padrão também para **production build**. Migrar só quando a documentação de upgrade estiver clara e você tiver tempo para testar.

### Outras melhorias opcionais

| Melhoria | Benefício | Esforço |
|----------|-----------|---------|
| **Turbopack no dev** | Já ativo: dev mais rápido, HMR melhor | — |
| **Atualizar dependências** | `npm update` (minor/patch) de vez em quando | Baixo |
| **Bundle analyzer** | Ver tamanho dos chunks: `@next/bundle-analyzer` + script `analyze` | Baixo, só quando quiser investigar bundle |
| **next/image** | Trocar `<img>` por `<Image />` nos avatares/thumbnails (onde o lint avisa) | Médio; melhora LCP e cache |
| **PPR (Partial Prerendering)** | Experimental no 15; estático rápido + dinâmico por região | Alto; só se precisar de shell estático + dados dinâmicos por seção |

Recomendação: manter Next 15.x atualizado, usar Turbopack no dev (já configurado) e ir tratando os warnings de `next/image` quando mexer nas telas. Bundle analyzer e PPR só quando houver necessidade concreta de otimizar bundle ou UX de loading.
