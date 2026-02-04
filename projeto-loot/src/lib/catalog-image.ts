/**
 * URLs antigas de placeholder (.svg) foram removidas do projeto.
 * Se o banco ainda tiver esses valores, tratamos como "sem imagem" para evitar 404.
 */
export function normalizeCatalogImageUrl(
  url: string | null | undefined
): string | null {
  if (url == null || url === "") return null;
  if (
    url.endsWith(".svg") ||
    url.includes("/creatures/common.svg") ||
    url.includes("/creatures/uncommon.svg") ||
    url.includes("/creatures/rare.svg") ||
    url.includes("/creatures/epic.svg") ||
    url.includes("/creatures/legendary.svg")
  ) {
    return null;
  }
  return url;
}
