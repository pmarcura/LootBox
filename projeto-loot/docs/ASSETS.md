# Assets (áudio e imagens)

## Áudio da revelação

O reveal (abertura da caixa) usa sons para impacto, rachaduras, explosão e fanfarra por raridade. Os arquivos MP3 **não vêm no repositório**; o app funciona sem eles (fallback silencioso).

Para habilitar o áudio completo, siga as instruções em **[public/sounds/README.md](../public/sounds/README.md)**: lista de arquivos necessários, especificações e fontes sugeridas (freesound, mixkit, zapsplat).

## Imagens (vessels, strains e cartas)

### Formato e regra de exibição

- **Proporção padrão:** 2816×1536 px (horizontal, ~1,83:1). Todas as artes de personagens (vessels) e strains usam essa proporção.
- **Nada cortado:** o app exibe as imagens com `object-contain` e containers com `aspect-[2816/1536]`, para que a imagem inteira apareça (pode haver letterboxing).
- **Carta fundida:** a arte da carta fundida é **a mesma imagem do vessel** (gravada em `user_cards.image_url` no momento da fusão).
- **Placeholders:** quando `image_url` for null, o inventário e os cards usam placeholders por raridade em `public/images/creatures/` (common, uncommon, rare, epic, legendary).

### Responsivo e performance

- **next/image** é usado em todos os slots, com `sizes` por contexto (inventário, fusão, home, cartas no jogo) para o navegador carregar o tamanho adequado.
- **Lazy loading** é o padrão do `next/image`.
- URLs do Supabase Storage são otimizadas pelo Next; para outros domínios, configurar `images.remotePatterns` em `next.config` se necessário.
- Recomendação: fornecer imagens em **WebP** (ou AVIF) e &lt; 200–300 KB por arquivo quando possível.

### Admin

- **Vessels:** o admin permite definir `image_url` ao criar ou editar um vessel (catálogo).
- **Strains:** o admin já permite `image_url` ao criar ou editar strain.

---

## Imagens da home

Slots configuráveis por variáveis de ambiente. Proporção **2816:1536** em todos; o layout usa `object-contain` para não cortar.

| Variável de ambiente | Slot | Dimensões sugeridas (px) | Peso máximo |
|----------------------|------|---------------------------|-------------|
| `NEXT_PUBLIC_HOME_HERO_IMAGE` | Hero (ao lado do título) | 1408×768 ou 1120×630 | 300 KB |
| `NEXT_PUBLIC_HOME_FEATURE_RESGATAR_IMAGE` | Card "Resgatar" | 600×328 ou 400×218 | 200 KB |
| `NEXT_PUBLIC_HOME_FEATURE_FUSAO_IMAGE` | Card "Fusão" | Idem | 200 KB |
| `NEXT_PUBLIC_HOME_FEATURE_DUELOS_IMAGE` | Card "Duelos" | Idem | 200 KB |
| `NEXT_PUBLIC_HOME_FEATURE_INVENTARIO_IMAGE` | Card "Inventário" | Idem | 200 KB |

- **Formato:** WebP preferido; PNG/JPG aceitos.
- **Conteúdo:** manter zona importante (personagem, logo) na área central.
- Se a variável não estiver definida, o slot não exibe imagem (hero mantém só texto; features mostram o ícone padrão).
