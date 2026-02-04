# Bíblia de Layout Vertical — Genesis Combat

Especificação do layout 100% viewport (estilo Marvel SNAP) para o combate de cartas. Objetivo: jogável com uma mão (dedão), sem scroll.

---

## 1. Regra de Ouro: The Safe Zone

- **Topo (10%)**: Avatar inimigo e status
- **Base (15%)**: Mão do jogador
- **Meio (75%)**: O jogo acontece
- Usar `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)` para notches e home bar

---

## 2. Layout "Sanduíche de Combate" — 5 Fatias Horizontais

| Fatia | % da tela | Conteúdo |
|-------|-----------|----------|
| 1 | 15% | **O Inimigo** — Avatar, vida circular, mão rival (verso empilhado), deck/cemitério |
| 2 | 20% | **Mesa Inimiga** — 3 slots, cartas como tokens quadrados |
| 3 | 15% | **Zona de Colisão** — Espaço vazio, linha neon ou grade holográfica |
| 4 | 20% | **Sua Mesa** — 3 slots, cartas como tokens |
| 5 | 30% | **Cockpit** — Barra mana, mão em leque, botão "METER MARCHA" |

---

## 3. Card Morphing (Duas Formas)

| Contexto | Formato | Conteúdo |
|----------|---------|----------|
| Na mão | Retrato (clássico) | Texto, nome, custo, stats, keyword |
| Na mesa | Token quadrado | Arte 80%, Atk/HP gigantes, sem texto |

Economiza ~40% de altura.

---

## 4. Zoom Contextual (Long Press)

- **Ação**: Segurar dedo em qualquer carta (mão, mesa sua ou inimiga)
- **Reação**: Fundo escurece; carta aparece grande no centro com texto completo
- **Soltar**: Overlay some
- Implementado em DOM (overlay sobre canvas Pixi)
- ~400ms para distinguir tap de long press

---

## 5. Dimensões de Referência

- **Grid base**: 360×800px (Android médio)
- **Slots**: 3 colunas × 100px + margem 20px + gap 10px = 360px
- **Slot width**: `min(100px, (100vw - 60px) / 3)`

---

## 6. Fluxo Visual (Olho do Jogador)

De baixo para cima:

1. Minha mão — "O que eu tenho?"
2. Minha mesa — "Onde eu jogo?"
3. Mesa inimiga — "Onde está o perigo?"
4. Vida inimiga — "Quanto falta pra ganhar?"

---

## 7. Variáveis CSS

```css
:root {
  --combat-slice-enemy: 15;
  --combat-slice-enemy-board: 20;
  --combat-slice-collision: 15;
  --combat-slice-my-board: 20;
  --combat-slice-cockpit: 30;
}
```

---

## 8. Implementação

- **PixiBoard** ([`src/features/playground/components/pixi/PixiBoard.tsx`](../src/features/playground/components/pixi/PixiBoard.tsx)): layout 100dvh, 5 fatias em %, safe-area
- **PixiCardToken**: token quadrado na mesa
- **PixiCardHand**: carta retrato na mão
- **PixiHandFan**: mão em arco (curva Bezier)
- **CardZoomOverlay**: overlay DOM para long press
- **useCombatLayout**: hook com ResizeObserver para posicionamento em %
