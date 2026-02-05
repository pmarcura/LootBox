/**
 * No browser, converte URL absoluta de outro domínio (ex.: genesis.vercel.app)
 * para same-origin, evitando CORS. Paths /images/ são servidos pelo próprio app.
 */
export function toSameOriginImageUrl(url: string): string {
  if (typeof window === "undefined") return url;
  if (!url.startsWith("http")) return url;
  const normalized = url.replace(/\/\/+/g, "/");
  const pathMatch = normalized.match(/^(https?:)\/\/([^/]+)(\/.*)$/);
  const path = pathMatch ? pathMatch[3].replace(/\/\/+/g, "/") : url;
  if (path.startsWith("/images/")) return window.location.origin + path;
  return url;
}

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
