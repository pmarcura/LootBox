# Design system

## Margens e barra de navegação inferior

A aplicação usa uma **barra de navegação fixa na parte inferior** da tela. Para que botões e conteúdo não fiquem atrás dela:

### Variáveis CSS (`globals.css`)

| Variável | Valor | Uso |
|----------|--------|-----|
| `--bottom-nav-height` | `5.5rem` | Altura aproximada da barra inferior. |
| `--content-bottom-safe` | `6.5rem` | Margem/padding mínimo para manter conteúdo e botões **acima** da barra. |

### Regras de uso

1. **Conteúdo principal (layout)**  
   O wrapper das páginas usa a classe `safe-bottom-nav`, que aplica `padding-bottom: var(--content-bottom-safe)`. Não remova essa classe do layout.

2. **Footer**  
   O footer usa `mb-safe-bottom` para não ficar coberto pela barra ao rolar até o fim.

3. **Overlays / painéis fixos no rodapé**  
   Se um componente estiver posicionado no rodapé da tela (`bottom-0`, `absolute`/`fixed` no fundo) e tiver botões ou ações principais, adicione **padding-bottom** igual à área segura:
   - Use `pb-[var(--content-bottom-safe)]` no Tailwind, ou
   - A classe `safe-bottom-nav` no container, ou
   - `padding-bottom: var(--content-bottom-safe)` em CSS.

4. **Novas páginas ou seções com CTA no rodapé**  
   Garanta que o último bloco de conteúdo (ou o container que envolve os botões) tenha espaço inferior de pelo menos `var(--content-bottom-safe)` quando a barra inferior estiver visível.

### Exemplo

```tsx
// Painel de resultado no rodapé da tela – reservar espaço para a barra
<div className="absolute inset-x-0 bottom-0 ... pb-[var(--content-bottom-safe)]">
  <Button>Resgatar outro</Button>
</div>
```

### Resumo

- **Não** coloque botões ou CTAs importantes na última linha sem reservar `--content-bottom-safe` abaixo deles.
- **Sempre** que um bloco for ancorado ao `bottom` da viewport, adicione padding/margin inferior usando `--content-bottom-safe`.
