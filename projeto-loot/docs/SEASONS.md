# Como adicionar uma nova temporada

O catálogo de vessels e strains é carregado a partir de um JSON em `supabase/data/`. A temporada atual é a **season01** (`season01.json`).

## Estrutura do JSON

- `schemaVersion` – número (ex.: 1).
- `season` – identificador da temporada (ex.: `"season01"`).
- `collectibles` – array de vessels. Cada item deve ter: `slug`, `name`, `rarity` (common|uncommon|rare|epic|legendary), `base_hp`, `base_atk`, `base_mana`, e opcionalmente `series`, `model_key`, `image_url`, `lore`, `flavor_text`.
- `strains` – array de strains. Cada item: `slug`, `name`, `rarity`, `family` (NEURO|SHELL|PSYCHO), e opcionalmente `description`, `penalty`.

Exemplo mínimo de vessel:

```json
{
  "slug": "novo-vessel",
  "name": "Novo Vessel",
  "rarity": "rare",
  "base_hp": 7,
  "base_atk": 7,
  "base_mana": 3,
  "image_url": "/images/creatures/rare.svg",
  "series": "season01",
  "lore": "Descrição narrativa do monstro."
}
```

Exemplo de strain:

```json
{
  "slug": "strain-exemplo",
  "name": "Strain Exemplo",
  "rarity": "common",
  "family": "NEURO",
  "description": "Descrição como software que hackeia o cérebro.",
  "penalty": "-50%"
}
```

## Passos para nova temporada

1. **Criar o arquivo** – Ex.: `supabase/data/season02.json` com a mesma estrutura de `season01.json` (collectibles e strains).
2. **Ajustar o seed** – O script `supabase/seed.ts` hoje carrega apenas `season01.json`. Para suportar várias temporadas, é preciso alterar o seed para ler o novo arquivo (ou um índice de temporadas) e inserir/atualizar os registros em `collectibles_catalog` e `strains_catalog`. Os códigos de resgate (tabela `redemption_codes`) continuam apontando para raridades; o sorteio na RPC `redeem_code` escolhe entre os itens do catálogo daquela raridade.
3. **Migrações** – Só é necessário nova migração se houver mudança de schema (novas colunas, tabelas). Só novos dados → basta rodar o seed (ou inserir via MCP `execute_sql` / script).
4. **Rodar o seed** – `npm run seed:catalog` (ou o comando que você configurar para a nova temporada) contra o projeto Supabase remoto, com `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.

## Códigos de resgate

Os códigos são importados separadamente (`npm run import:codes`) e associados a um batch (ex.: `season01`). A lógica de qual vessel/strain sortear está na RPC e usa o catálogo atual; não é obrigatório ter um “batch” por temporada, desde que o catálogo contenha os itens desejados para aquela raridade.
