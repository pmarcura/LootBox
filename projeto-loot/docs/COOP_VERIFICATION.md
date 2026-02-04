# Verificação da implementação — Modo Coop 2v1 Roguelike

Este documento confere a implementação contra o plano em `.cursor/plans/modo_coop_2v1_roguelike_*.plan.md`.

---

## 1. Tipos e engine (5 slots e lado aliado)

| Item | Status | Onde |
|------|--------|------|
| `SlotIndex = 1 \| 2 \| 3 \| 4 \| 5`, `SLOTS_3`, `SLOTS_5` | OK | `playground/lib/types.ts` |
| `MatchState.slotCount`, `currentAllyIndex`, `coop.passedThisRound` | OK | `types.ts` |
| `GameConfig.slotCount`, `initialDraw`, `maxHandSize`, `player2StartingLife` | OK | `types.ts` |
| `getSlotCount()`, `getSlots()` dinâmicos | OK | `game-engine.ts` |
| `createMatch` com `slotCount`, `initialDraw`, `player2StartingLife` | OK | `game-engine.ts` |
| Pass coop: alternar `currentAllyIndex`, rodada só termina quando ambos passam | OK | `game-engine.ts` (função `pass`) |
| `roundEnd` com `maxHandSize`, coop reset de `passedThisRound` e `currentAllyIndex` | OK | `game-engine.ts` |
| `playCard`/`declareAttack`/validação de slot 1..N | OK | `game-engine.ts` |

---

## 2. Run state, waves e buffs

| Item | Status | Onde |
|------|--------|------|
| `WaveDef`, `RunBuff`, `RunState`, `WAVES` (Escoteiro 18 → Boss 48 HP) | OK | `run-state.ts` |
| `createMatchForWave()`, vida aliada entre waves, `enemyLifeWithBotBalance` (~10% menos com bot) | OK | `run-state.ts` |
| `createRunState()` com vida 25, config (draw 4, maxHand 8) | OK | `run-state.ts` |
| Decks por wave: Escoteiro 8, Patrulha/Elite/Campeão/Boss 10 cartas | OK | `coop-decks.ts` |
| `getCoopDraftPool()`, `getCoopAllyBotDeck()` | OK | `coop-decks.ts` |
| `BUFF_LIST` (Nutriente, Casca Grossa, Raízes, Sintonia, Esporos, Surto Cromático) | OK | `run-buffs.ts` |
| `pickRandomBuffs(waveIndex, runState)` — 2 comuns + 1 raro cedo, mix depois | OK | `run-buffs.ts` |

---

## 3. Lobby (DB e RPCs)

| Item | Status | Onde |
|------|--------|------|
| Tabela `coop_lobbies` (id, host, guest, filled_with_bot, status, code), RLS | OK | `0038_coop_lobbies.sql` |
| RPCs: create, join, leave, fill_with_bot, start_coop_run | OK | Migração + `coop/actions/lobby.ts` |
| Server Actions com tratamento de erro e mensagens em PT | OK | `lobby.ts` |
| Realtime na tabela para updates do lobby | OK | Migração (alter publication) |

---

## 4. UI e fluxo

| Item | Status | Onde |
|------|--------|------|
| Link "Coop Boss" no Playground | OK | `PlaygroundSetup.tsx` |
| `/coop`: Criar lobby, Entrar com código, redirect com `?lobby=` | OK | `app/coop/page.tsx`, `CoopClient.tsx` |
| Tela lobby: código, copiar link, J1/J2 (ou bot), Preencher com bot, Iniciar run, Sair | OK | `CoopClient.tsx` |
| Realtime: ao receber UPDATE com status draft → redirect para `/coop/draft` | OK | `CoopClient.tsx` |
| `/coop/draft`: pool de cartas, escolher 10, salvar run no sessionStorage, redirect `/coop/run` | OK | `CoopDraftClient.tsx`, `app/coop/draft/page.tsx` |
| `/coop/run`: carregar run do storage, wave N, board, reward, game over, vitória | OK | `CoopRunClient.tsx`, `app/coop/run/page.tsx` |
| RewardScreen: 3 opções de buff, raridade, onPick | OK | `RewardScreen.tsx` |

---

## 5. Board e HUD no coop

| Item | Status | Onde |
|------|--------|------|
| Grid 5 colunas quando `slotCount === 5` (aliados e inimigo) | OK | `CombatBoardHybrid.tsx` |
| `cardSlotMap` e slots com `getSlotCount(state)` | OK | `CombatBoardHybrid.tsx` |
| Refs dos slots (array dinâmico) para drop de cartas | OK | `CombatBoardHybrid.tsx` |
| Labels "Inimigo" / "Aliados · Vez do Jogador N" no coop | OK | `CombatBoardHybrid.tsx` |
| Vitória/derrota: "Wave vencida!" / "Fim da run" / "Continuar" | OK | `CombatBoardHybrid.tsx` |
| CombatHUD: `myRole = "player1"` no coop, `isMyTurn` com `currentAllyIndex === myAllyIndex` | OK | `CombatHUD.tsx` |
| `hasEmptySlot` e declare attack com `slotCount` dinâmico | OK | `CombatHUD.tsx` |
| phaseLabel "Vez do Jogador 1/2" no coop | OK | `CombatHUD.tsx` |
| battleStore: `mode: "coop"`, `myAllyIndex`, `runState`, `setRunState` | OK | `battleStore.ts` |
| Ações (playCard, pass, declareAttack, buyCard) checam `currentAllyIndex === myAllyIndex` no coop | OK | `battleStore.ts` |
| EngagementLines com slots 1–5 | OK | `EngagementLines.tsx` |

---

## 6. Bot aliado e inimigo

| Item | Status | Onde |
|------|--------|------|
| `getAllyBotMove(state, allyIndex)` para player1, conservador | OK | `ai-opponent.ts` |
| `executeAllyBotMove(state, allyIndex)` com suporte a combate (playCard) | OK | `ai-opponent.ts` |
| Efeito no board: modo coop + `runState?.filledWithBot` + vez do ally 1 → executar bot | OK | `CombatBoardHybrid.tsx` |
| Inimigo (player2) joga no coop com a mesma IA (getAIMove) | OK | `CombatBoardHybrid.tsx` (mode === "coop" no efeito de IA) |

---

## 7. Ajustes de balanceamento

| Item | Status |
|------|--------|
| Vida aliados 25 | OK em `run-state.ts` (COOP_CONFIG) |
| Draw inicial 4, maxHand 8 | OK em `run-state.ts` e `createMatchForWave` |
| Inimigos com ~10% menos vida nas waves 1–3 quando `filledWithBot` | OK em `enemyLifeWithBotBalance` |

---

## 8. Testes e lint

| Item | Resultado |
|------|-----------|
| `game-engine.test.ts` | 9 passed |
| `ai-opponent.test.ts` | 4 passed |
| Lint (playground, coop, app/coop) | Sem erros |

*Nota: 2 testes falham por falta de `DATABASE_URL` (fusion e gacha), não relacionados ao coop.*

---

## 9. Pontos conhecidos / melhorias futuras

1. **Buffs apenas no estado**: Os buffs são guardados em `runState.collectedBuffs` e exibidos na tela de recompensa. Os **efeitos** dos buffs (ex.: +1 mana no início da rodada, esporos ao morrer) ainda não estão aplicados no engine; isso exige uma camada “run executor” que intercepte round start / unit death e aplique os buffs. O plano prevê isso como extensão.
2. **2 humanos no mesmo run**: Com dois jogadores reais, o estado da partida (MatchState) não é sincronizado via Realtime; cada cliente tem apenas o runState no sessionStorage. Para coop com 2 humanos na mesma run, é necessário host autoritário: host aplica ações e envia estado pelo Realtime, guest envia ações. O lobby e o draft já estão prontos; a sincronização do jogo em tempo real é fase 2.
3. **myAllyIndex com 2 humanos**: Em sessão local, o run inicia sempre com `myAllyIndex = 0` (host). Para o guest ter `myAllyIndex = 1`, seria preciso persistir o índice no run state (ou na URL) e passá-lo ao `initMatch`. Atualmente “Preencher com bot” cobre o caso 1 humano + bot sem necessidade disso.
4. **Draft 5+5 separado**: O plano menciona “cada um escolhe 5”; a implementação atual usa um único jogador escolhendo 10 cartas de um pool (MVP). Draft sincronizado (cada um escolhe 5 e merge) exigiria Realtime ou fluxo servidor.

---

## Conclusão

A implementação está **alinhada ao plano** para o escopo MVP:

- Engine e tipos com 5 slots e turno coop (pass alternado).
- Run state, waves, decks e buffs (definição + escolha; efeitos no engine opcionais).
- Lobby (DB, RPCs, Realtime para lobby).
- Fluxo completo: menu → lobby → draft (10 cartas) → run → wave → reward → próxima wave ou boss → vitória/derrota.
- Board e HUD adaptados ao coop (5 colunas, “Vez do Jogador N”).
- Bot aliado e IA inimiga no coop.
- Balanceamento (vida 25, draw 4, maxHand 8, -10% vida inimigo com bot).

Testes do engine e da IA passam; não há erros de lint nos módulos do coop/playground.
