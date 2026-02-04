# Stack mobile: Next 16, Turbopack, gestos e PWA

Plano e justificativas para a stack mobile do Projeto Gênesis (cartas, duelos, instalação no celular).

---

## 1. Core (já adotado ou em adoção)

| Tecnologia | Uso | Nota |
|------------|-----|------|
| **Next.js 16** | App Router, RSC, API routes | Turbopack padrão (dev + build). Requer Node 20.9+. |
| **Turbopack** | Bundler padrão no Next 16 | Startup e HMR muito mais rápidos; build de produção também. |
| **React Compiler** | Memoização automática | Ativa em `next.config`. Menos `useMemo`/`useCallback` manuais. |
| **Tailwind CSS** | Layouts e UI | Já em uso (v4). Mobile-first: breakpoints, `min-h-[44px]`, `touch-manipulation`. |
| **next/image** | Todas as artes de cartas/avatares | Reduz memória no mobile (srcset, lazy load, formatos modernos). Evita travar o navegador. |
| **Vercel** | Deploy | Edge global, baixa latência. Conectar repositório e configurar env (Supabase). |
| **Vibration API** | Feedback tátil | `navigator.vibrate([50])` ao colocar carta em campo, resolver efeito, etc. Já usado em LoadoutModal. |

---

## 2. Gestos: React UseGesture

- **Pacote**: `@use-gesture/react`.
- **Uso**: Arrastar cartas com o dedo (hand → slot no duelo, reordenar deck). Funciona com mouse e touch.
- **Configuração orgânica**: Usar junto com `@react-spring/web` para movimento suave (spring physics). Exemplo:

```ts
const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));
const bind = useDrag(({ down, movement: [mx, my], first }) => {
  if (first && navigator.vibrate) navigator.vibrate(50); // haptic ao iniciar arraste
  api.start({ x: down ? mx : 0, y: down ? my : 0, immediate: down });
});
// bind() no elemento; style={{ x, y }} com animated.div
```

- **Importante**: `touch-action: none` (ou `touch-action: pan-y`) no elemento arrastável para não conflitar com scroll da página.
- **Onde integrar**: MatchBoard (jogar carta da mão no slot), LoadoutModal (reordenar/arrastar para slot), eventualmente inventário.

---

## 3. Haptics (Vibration API)

- Já usado em `LoadoutModal` ao preencher slot.
- Estender para:
  - Carta “poderosa” (ex.: raridade épica/lendária) entra em campo → `navigator.vibrate([80, 40, 80])`.
  - Resolução de efeito (ex.: dano, cura) → vibração curta `[30]`.
- Sempre checar `typeof navigator !== 'undefined' && navigator.vibrate` antes de chamar.

---

## 4. Memória no mobile (artes em alta resolução)

- **Problema**: Muitas `<img>` de cartas em alta resolução podem travar o navegador no celular.
- **Solução**: Usar **sempre** `<Image />` do Next.js para:
  - Avatares (UserMenu, perfil, amigos, clã, duelos).
  - Arte de cartas (inventário, MatchBoard, LoadoutModal, MatchSummary, FusionSlot).
- Configuração sugerida em `next.config`: `images.domains` ou `images.remotePatterns` se as artes vierem de CDN/Supabase storage.
- Tamanhos razoáveis: ex. `width={160}` `height={224}` para cartas, `width={40}` `height={40}` para avatares; Next gera srcset e lazy load.

---

## 5. Estudo: vale a pena?

### Animações: Framer Motion

- **Conclusão: sim.** Já usado (duels, fusion, gacha). Bom para layout e gestos visuais (entrada/saída de cartas, modais). Mantém-se como padrão de animação de UI.

### Lógica de jogo: XState

- **Conclusão: vale em duelos/match.** Para máquina de estados (turnos: escolha de carta → escolha de alvo → resolução → fim do turno; fases: setup, combat, end), XState deixa o fluxo explícito e testável. Recomendação: introduzir na tela de partida (`/duels/[matchId]`) quando a lógica de turnos/eventos crescer; não é obrigatório para o primeiro MVP, mas evita “state spaghetti”.

### Efeitos de som: Sonniss (GDC Bundles)

- **Conclusão: sim, para SFX.** Sonniss oferece bundles royalty-free; usar para sons de carta jogada, ataque, cura, vitória/derrota. Já existe Howler no projeto (gacha); integrar os mesmos arquivos (ou novos) em ações de duelo. Manter arquivos em `public/sounds/` e carregar sob demanda para não estourar memória.

### Ícones: Lucide React

- **Conclusão: sim.** Ícones consistentes e leves. Adicionar `lucide-react` e passar a usar em botões, navegação e labels (substituindo SVGs inline onde fizer sentido). Não substituir tudo de uma vez; migrar gradualmente.

### Interface: Shadcn/ui

- **Conclusão: adoptar com cuidado.** O projeto já tem design system (Button, Input, Badge, EssenceBadge em `src/components/ui/`). Shadcn traz mais componentes (Dialog, Sheet, Tabs, etc.) e acessibilidade. Opções:
  - **A)** Adicionar Shadcn e usar só componentes que ainda não existem (ex.: Sheet para menu mobile, Dialog para confirmações), mantendo os atuais para o que já está definido.
  - **B)** Migrar gradualmente para Shadcn (themes Tailwind compatíveis com o design system atual).

Recomendação: **A** — usar Shadcn para novos padrões (modais, drawers, dropdowns) sem reescrever tudo.

### PWA: instalável no celular

- **Conclusão: sim, sem next-pwa.** Next (15/16) tem suporte nativo: `app/manifest.ts` (ou `manifest.json`) para “Adicionar à tela inicial”. Para apenas “instalável” não é obrigatório service worker; para offline ou push notifications é preciso um SW (ex.: Serwist ou script em `public/sw.js`). Para o objetivo “app instalável no celular sem custo”, **manifest + HTTPS (Vercel)** já bastam. Plugin `next-pwa` pode conflitar com App Router; preferir abordagem nativa do Next.

### Imagens: next/image

- **Conclusão: obrigatório para artes e avatares.** Otimização automática, menos memória, melhor LCP. Ver seção 4.

---

## 6. Resumo de implementação

| Item | Ação |
|------|------|
| Next 16 + Turbopack | Upgrade com `npx @next/codemod@canary upgrade latest` ou `npm install next@latest react@latest react-dom@latest`; remover `--turbo` do script `dev` (Turbopack já é padrão). |
| React Compiler | Habilitar em `next.config` com `experimental: { reactCompiler: true }` (ou opção estável no 16). |
| PWA | `src/app/manifest.ts` com nome, ícones (192, 512), `display: standalone`, `theme_color`. Ícones em `public/`. |
| Tailwind | Já configurado; garantir padrões mobile (touch targets, safe-area). |
| UseGesture + spring | `@use-gesture/react` + `@react-spring/web`; hook ou componente `useDragCard` com haptic no primeiro movimento. |
| Haptics | Centralizar em helper `vibrateLight()`, `vibrateHeavy()` e chamar em eventos de jogo (carta em campo, efeito). |
| next/image | Componente `CardImage` (e avatar) usando `next/image`; substituir `<img>` em cartas e avatares. |
| Lucide | Instalar `lucide-react`; usar em novos ícones e substituir SVGs inline gradualmente. |
| XState | Introduzir quando modelar máquina de estados do duelo (opcional no MVP). |
| Shadcn | Adicionar para novos componentes (Sheet, Dialog); manter UI atual onde já definido. |
| Sonniss | Adicionar SFX em `public/sounds/` e tocar via Howler nas ações de duelo. |
| Vercel | Conectar repo, configurar env, deploy automático. |

---

## 7. O que já foi implementado neste repo

- **Next 16** (package.json): `next@^16.0.0`; script `dev` sem `--turbo` (Turbopack é padrão).
- **React Compiler**: `reactCompiler: true` em `next.config.ts`.
- **PWA**: `src/app/manifest.ts` com nome, cores, `display: standalone`. Ícones em `public/`: `icon-192x192.png` e `icon-512x512.png` são obrigatórios para o app ser instalável; instruções em `public/PWA_ICONS_README.txt`. Gerar em [realfavicongenerator.net](https://realfavicongenerator.net/) ou exportar do logo do projeto.
- **Imagens**: `images.remotePatterns` no next.config para Supabase; componente `src/components/ui/CardImage.tsx` para arte de cartas com next/image.
- **Gestos**: `@use-gesture/react` e `@react-spring/web` instalados; hook `src/hooks/useDragWithSpring.ts` para arraste com spring e haptic opcional. Integrar no MatchBoard/LoadoutModal quando for prioridade.
- **Lucide**: `lucide-react` instalado; usar em novos ícones e substituir SVGs inline aos poucos.
- **Haptics**: `src/lib/haptics.ts` com `vibrateLight()`, `vibrateHeavy()` e `vibratePattern()` para uso em duelos e LoadoutModal.

---

## 8. Ordem sugerida

1. Upgrade Next 16 + React Compiler + PWA manifest.  
2. next/image para cartas e avatares + config de `images` se usar CDN.  
3. @use-gesture/react + @react-spring/web + arraste orgânico em uma tela (ex.: carta no MatchBoard).  
4. Haptics centralizados e chamadas em “carta em campo” / efeitos.  
5. Lucide nos novos fluxos e substituição gradual de SVGs.  
6. Shadcn só para novos padrões (modal, sheet).  
7. XState e Sonniss quando a lógica de duelo e o áudio forem prioridade.

---

## 9. Requisitos para Next 16

- **Node.js 20.9+** (Node 18 não é mais suportado). Verifique com `node -v`. Compatível com Node 24.x.
- TypeScript 5.1.0+.
- Se o upgrade quebrar algo: `npx @next/codemod@canary upgrade latest` pode ajustar config e convenções.

## 10. Funcionalidades 2026 (próximos passos opcionais)

- **`"use cache"`** (Next 16): cache explícito em listas pesadas (ex.: página de inventário) para reduzir carga no servidor.
- **PPR (Partial Prerendering)**: shell estático + conteúdo dinâmico por região; útil para LCP em páginas com dados do utilizador.
- **Proxy.ts**: em vez de middleware, para clarificar limites de rede; considerar na reestruturação de rotas.
