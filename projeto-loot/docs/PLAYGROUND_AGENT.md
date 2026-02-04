# Playground — Guia para o Agente

Este documento descreve como o agente (Cursor) pode usar o Playground para jogar partidas contra a IA, testar mecânicas e sugerir melhorias de balanceamento.

## Pré-requisitos

1. **Servidor rodando**: `npm run dev` na raiz do projeto
2. **MCP cursor-browser-extension**: Habilitado para controle do navegador

## Board híbrido

- **DOM**: HUD, cartas na mão, slots, overlays (zoom, combate). Interação e texto nítidos.
- **Pixi**: Camada de fundo com parallax e efeitos visuais (efeitos de partículas, screen shake).
- Um único modo: o melhor de cada tecnologia combinado.

## Navegação

1. Acesse `http://localhost:3000/playground`
2. Use `browser_navigate` com a URL
3. Use `browser_snapshot` para obter o estado da página e as refs dos elementos

## Fluxo de jogo

### Iniciar partida

1. Na tela inicial, escolha o deck (presets: balanced, aggressive, defensive, keywords, cheap)
2. Clique em "Iniciar vs IA" (`data-testid="playground-start-btn"`)

### Durante a partida

- **Sua vez**: Jogue cartas ou passe a vez
- **Cartas na mão**: `data-testid="playground-hand-card-0"`, `playground-hand-card-1`, etc.
- **Slots de combate**: `data-testid="playground-slot-1"`, `playground-slot-2`, `playground-slot-3`
- **Jogar carta**: Clique na carta (para selecionar) e depois no slot vazio
- **Passar a vez**: `data-testid="playground-end-turn"`
- **Comprar carta** (quando deck vazio): `data-testid="playground-buy-card"`
- **Sair**: `data-testid="playground-back"`

### Interpretar estado

- Vida do jogador: `data-testid="playground-my-life"`
- Vida da IA: `data-testid="playground-opp-life"`
- Mana atual: `data-testid="playground-mana"`
- Indicador de turno: `data-testid="playground-turn-indicator"`

## Ferramentas disponíveis

- **Painel de balanceamento** (`playground-balance-panel`): Sliders para vida inicial e mana máxima
- **Simulador Monte Carlo** (`playground-simulate-btn`): Roda N partidas para estimar win rate
- **Debug** (`playground-debug-tab`): Estado interno (deck, mão, board, discard)

## Sequência de ações para o agente

1. `browser_navigate` → `http://localhost:3000/playground`
2. `browser_snapshot` → obter refs
3. `browser_click` no botão "Iniciar vs IA" (element ref do snapshot)
4. Para cada turno:
   - `browser_snapshot` para ver cartas e slots
   - Se tiver carta jogável: `browser_click` na carta → `browser_click` no slot
   - Caso contrário: `browser_click` em "Passar a Vez"
5. Durante turno da IA: aguardar (a IA joga automaticamente)
6. Repetir até fim da partida

## Sugerir mudanças de balanceamento

Após jogar, use o **Simulador Monte Carlo** para rodar 10 ou 100 partidas. Analise:
- Win rate muito alto/baixo pode indicar desbalanceamento
- Decks agressivos vs defensivos: qual tende a vencer?
- Sliders de vida/mana: como afetam o resultado?
- Como está o fluxo do combate?
- As animações estão boas?
- Criar um relatório completo da situação atual e sempre criar pathnotes para rebalanceamento

Proponha ajustes com base nos dados observados.
