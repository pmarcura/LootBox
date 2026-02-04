import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mb-safe-bottom border-t border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950 md:px-4 md:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 text-center text-xs text-zinc-500 md:flex-row md:gap-4 md:text-sm md:text-left">
        <p>&copy; {year} Projeto Gênesis</p>
        <nav className="hidden items-center gap-3 md:flex" aria-label="Links do rodapé">
          <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
            Início
          </Link>
          <Link href="/gacha" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
            Resgatar
          </Link>
          <Link href="/inventory" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
            Inventário
          </Link>
          <Link href="/fusion" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
            Fusão
          </Link>
          <Link href="/marketplace" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
            Marketplace
          </Link>
          <Link href="/friends" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
            Amigos
          </Link>
          <Link href="/duels" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
            Duelos
          </Link>
          <Link href="/clan" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
            Clã
          </Link>
        </nav>
      </div>
    </footer>
  );
}
