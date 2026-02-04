import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/features/auth/actions";
import { requireAdmin } from "@/features/admin/utils";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  const email = user?.email ?? "Admin";
  const displayName = email.split("@")[0];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Hide the global header/footer for admin */}
      <style>{`
        body > header, body > footer { display: none !important; }
        body { display: block !important; }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
                title="Voltar ao site"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
                  Admin
                </p>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Projeto Gênesis
                </h1>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-50" href="/admin">
                Painel
              </Link>
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-50" href="/admin#catalogo">
                Catálogo
              </Link>
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-50" href="/admin#codigos">
                Códigos
              </Link>
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-50" href="/admin#usuarios">
                Usuários
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {displayName}
                </span>
                <span className="text-xs text-zinc-500">Administrador</span>
              </div>
            </div>
            <form action={logoutAction}>
              <Button variant="ghost" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
