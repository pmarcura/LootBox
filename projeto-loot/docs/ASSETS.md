# Assets (áudio e imagens)

## Áudio da revelação

O reveal (abertura da caixa) usa sons para impacto, rachaduras, explosão e fanfarra por raridade. Os arquivos MP3 **não vêm no repositório**; o app funciona sem eles (fallback silencioso).

Para habilitar o áudio completo, siga as instruções em **[public/sounds/README.md](../public/sounds/README.md)**: lista de arquivos necessários, especificações e fontes sugeridas (freesound, mixkit, zapsplat).

## Imagens (vessels e strains)

**Decisão atual:** as telas de inventário e de reveal usam **placeholders por raridade** (um SVG por raridade em `public/images/creatures/`: common, uncommon, rare, epic, legendary). O catálogo e o admin permitem `image_url` por item; quando houver arte por vessel ou strain, basta preencher `image_url` no admin e o front pode passar a exibir essa URL no lugar do placeholder (ajuste no componente que monta a URL da imagem).
