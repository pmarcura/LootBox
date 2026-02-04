# Relatório de testes – Playground (1ª rodada)

**Data:** 2026-02-03  
**Referências:** Hearthstone, Legends of Runeterra, Magic: The Gathering

## Resumo executivo

O Playground está funcional para testes vs IA. Esta rodada focou em **design**, **animações** e **design de informações** comparado às referências.

---

## 1. Design de informações

### Referências (Hearthstone, LoR, Magic)

- **Hierarquia**: Vida e recursos devem dominar visualmente; ameaças imediatas em segundo plano.
- **LoR**: Informações no topo (jogador/oponente), mão de cartas, linhas de unidades, painéis de recurso (Nexus health, mana crystals).
- **Feedback imediato**: Ações claras com animações e áudio; hover com preview de efeitos.
- **Tipografia**: Legibilidade em diferentes tamanhos; hierarquia (título > efeito > custo).
- **Ícones**: Reduzir carga cognitiva com símbolos reconhecíveis para custo, dano, efeitos; tooltips quando necessário.

### Pontos positivos atuais

- Stats das cartas (HP, ATK) com ícones consistentes (coração, raio).
- Custo de mana em destaque no canto.
- Keywords em português (DISPOSIÇÃO, POSTURADO, LARICA).
- Slots de combate numerados (Posição 1, 2, 3).
- Cartas jogáveis com estilo distinto (borda âmbar).

### Lacunas identificadas

| Item | Referência | Estado atual |
|------|------------|--------------|
| **Vida como Nexus** | LoR: card grande, valor central | Número simples, pouco destaque |
| **Mana visual** | Hearthstone: cristais 1–10 | Só texto "1/10 mana" |
| **Estado do combate** | Feedback "Resolvendo..." | Falta no Playground |
| **Tooltip em keywords** | Magic: explicação em hover | Sem explicação |
| **Glow em cartas jogáveis** | Hearthstone: brilho verde | Borda âmbar, sem glow |
| **Faixas de combate** | LoR: alinhamento visual claro | Slots ok, mas pouco contraste entre faixas |

---

## 2. Animações

### O que existe

- **CombatOverlay**: Animações de dano, cura, morte (reutilizado do Duels).
- **Transição de turno**: Overlay "Turno da IA" com motion.
- **Cartas na mão**: Hover (y: -4, scale 1.02), seleção (scale 1.05, y: -6).
- **Arrastar**: useDragWithSpring para drag-and-drop.

### Lacunas

- **Spawn de carta**: MatchBoard tem wireframe + flash ao jogar; Playground não.
- **Feedback de mana**: Sem animação ao gastar mana.
- **Dano em tempo real**: CombatOverlay mostra; fora dele não há feedback visual de dano.
- **Vida**: Sem pulso/impacto ao perder ou ganhar vida.

---

## 3. Melhorias priorizadas

### Alta prioridade

1. **Indicador de mana visual** – Cristais/barras 1–10 (como no MatchBoard).
2. **Estado "Resolvendo combate..."** – Barra superior durante overlay.
3. **Vida em destaque** – Cards ou painéis para vida (tipo Nexus).
4. **Tooltips em keywords** – `title` com explicação (ex.: POSTURADO = Taunt).

### Média prioridade

5. **Glow em cartas jogáveis** – `shadow-amber-400/30` ou similar.
6. **Animação de spawn** – Wireframe + flash ao jogar carta (como MatchBoard).
7. **Hint de arrastar** – Texto "Arraste a carta até um slot" na mão.

### Baixa prioridade

8. **Faixas numeradas** – Labels "Esquerda" / "Centro" / "Direita" para alinhamento com LoR.
9. **Histórico de turno** – Log colapsável de ações (como LoR).

---

## 4. Conformidade com Design System

- Tokens de cor (amber, zinc, red para vida) seguidos.
- `rounded-xl` em cards e slots.
- Touch targets adequados (min-h-[44px]).
- Uso de `Button` e componentes UI existentes.

---

## Implementado (1ª rodada)

- [x] **Indicador de mana visual** – 10 cristais (dots) verdes para mana disponível.
- [x] **Estado "Resolvendo combate..."** – Barra superior durante overlay.
- [x] **Vida em destaque** – Painéis tipo Nexus (bordas, fundo, texto maior).
- [x] **Tooltips em keywords** – `title` com explicação ao passar o mouse.
- [x] **Glow em cartas jogáveis** – `shadow-[0_0_12px_rgba(245,158,11,0.25)]`.
- [x] **Animação de spawn** – Wireframe + flash + shake ao jogar carta.
- [x] **Hint de arrastar** – Texto na mão: "Arraste a carta até um slot ou clique...".
- [x] **Labels de faixas** – "Faixas: Esquerda · Centro · Direita".
- [x] **Indicador de turno pulsante** – Bolinha animada quando é sua vez.

## Pixi.js (implementado)

- Board renderizado via Pixi.js (WebGL) para desempenho e animações fluidas
- Toggle "Pixi.js / DOM" para alternar entre implementações
- Cartas, slots, mana e vida desenhados com Graphics (roundRect, fill, stroke)
- Texto com pixiText
- Interação via onClick nos containers

## Próximos passos

1. Replicar ajustes no MatchBoard dos Duelos para consistência
2. Rodar nova rodada de testes com usuários
3. Animação de spawn de carta em Pixi (tween da mão para o slot)
