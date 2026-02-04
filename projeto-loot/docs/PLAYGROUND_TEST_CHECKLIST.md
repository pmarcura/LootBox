# Playground – Checklist de Testes Manuais

## Pré-requisitos

- `npm run dev` rodando
- Navegador em `http://localhost:3000/playground`

---

## Fluxo vs IA (Pixi)

- [ ] Escolher deck "balanced" para jogador e IA
- [ ] Clicar "Iniciar vs IA"
- [ ] Ver board Pixi com 5 fatias, mana, vida
- [ ] Jogar carta: clicar carta → clicar slot vazio
- [ ] Ver faíscas no slot ao jogar
- [ ] Ver animação de metamorfose na carta
- [ ] Clicar "Passar a Vez"
- [ ] Ver turno da IA executar automaticamente
- [ ] Com deck vazio e descarte: botão "Comprar carta" aparece
- [ ] Long-press em carta abre zoom (modal DOM)
- [ ] Partida termina e exibe "Você venceu!" ou "A IA venceu."

---

## Fluxo vs IA (DOM)

- [ ] Trocar para modo DOM (botão "Pixi.js / DOM (trocar)")
- [ ] Iniciar partida vs IA
- [ ] Jogar com clique ou arrastar carta para slot
- [ ] Passar a vez e ver CombatOverlay (animações de dano)
- [ ] Transição "Turno da IA" entre turnos

---

## Fluxo vs Amigo (PvP)

- [ ] Escolher modo "vs Amigo"
- [ ] Iniciar partida
- [ ] Jogar como jogador 1
- [ ] Clicar "Passar a Vez"
- [ ] Ver "Vez do Oponente" / jogador 2
- [ ] Board inverte perspectiva: mão do jogador 2 embaixo
- [ ] Jogar como jogador 2
- [ ] Alternar turnos até fim da partida

---

## Paridade e Estabilidade

- [ ] Botão "Cancelar" ao selecionar carta
- [ ] Mana dinâmica (slider no setup afeta display)
- [ ] Barra de vida reativa (catch-up ao levar dano)
- [ ] oppHandCount visível na zona do inimigo (Pixi)
- [ ] Toggle Pixi/DOM durante partida mantém estado
