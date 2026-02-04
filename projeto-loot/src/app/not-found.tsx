import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          404
        </h1>
        <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
          Página não encontrada
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
