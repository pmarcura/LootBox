# Arquitetura (resumo)

Visão rápida do fluxo de dados e onde estão as peças principais.

## Fluxo principal

1. **Resgate** – Usuário informa código em `/gacha`. A action `redeemAction` usa Drizzle + lógica em TypeScript (rate limit, burn-on-redeem, gacha) e retorna 1 vessel + 1 strain. O front exibe o reveal (caixa com maior raridade) e depois o summary.
2. **Inventário** – `/inventory` lista vessels, strains e cartas fundidas (tabelas `user_inventory`, `user_strains`, `user_cards`). Itens já consumidos (fusão ou dissolver) são identificados via ledger (`audit_inventory_ledger` / `audit_strains_ledger`), não há coluna `is_used`. Dissolver devolve essência e faz hard delete; histórico nos ledgers.
3. **Fusão** – Em `/fusion` o usuário escolhe 1 vessel + 1 strain. A action `fuseCardAction` usa Drizzle: valida que itens não estejam nos ledgers, hard delete dos consumidos, INSERT em `user_cards` com stats (previewFusion).
4. **Marketplace** – Compra de lootbox com essência (action com Drizzle), retornando 1 vessel + 1 strain; o reveal é o mesmo do resgate.

## Onde está o quê

| Área | Actions (server) | RPCs (Supabase) | Componentes principais |
|------|------------------|------------------|------------------------|
| Gacha/Resgate | `features/gacha/actions/redeem.ts` | — (lógica em TS) | `GachaRedeemPanel`, `RevealExperience`, `RevealScene`, `RevealSummary` |
| Inventário | `features/inventory/actions/dissolve.ts`, `dissolve-strains.ts` | — (lógica em TS) | `InventoryTabs`, `InventoryGrid`, `StrainGrid`, `UserCardsGrid` |
| Fusão | `features/fusion/actions/fuse.ts` | — (lógica em TS) | `FusionForm` |
| Marketplace | `features/marketplace/actions/purchase.ts` | — (lógica em TS) | `MarketplacePanel` |
| Auth | `features/auth/actions.ts` | (Auth do Supabase) | `AuthForm`, `ForgotPasswordForm` |
| Amigos | `features/friends/actions.ts` | `request_friend_by_email`, `request_friend_by_display_name` | `FriendsPanel` |
| Admin | `features/admin/actions/catalog.ts`, `strains.ts` | — | `app/admin/page.tsx` (CRUD) |

## Banco (principais tabelas)

- `catalog` – tabela unificada (type: vessel|strain|weapon, attributes JSONB). Views `collectibles_catalog` e `strains_catalog` para compatibilidade.
- `user_inventory` – vessels do usuário (referência a catalog). Consumido = hard delete + snapshot em `audit_inventory_ledger`; “já consumido” é conferido via ledger (não há `is_used`).
- `user_strains` – strains do usuário. Consumido = hard delete + snapshot em `audit_strains_ledger`; “já consumido” via ledger.
- `user_cards` – cartas fundidas (vessel_collectible_id, strain_id, final_hp/atk, mana_cost, keyword).
- `profiles` – essência, is_admin.
- `redemption_codes` – códigos de resgate (burn-on-redeem).

## Stack técnica

- **Drizzle ORM** para operações de banco (Server Actions). `getDbWithAuth()` retorna `{ db, userId }` após validar sessão.
- **Supabase Auth** (@supabase/ssr) para login, OAuth, cookies.
- **Zod** para validação em Server Actions.

Migrações em `supabase/migrations/`. Aplicar sempre via MCP (`apply_migration`), nunca depender de Supabase local.
