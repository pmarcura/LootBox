export default function GachaLoading() {
  return (
    <main className="bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <nav className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </nav>
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
          <div className="space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-9 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            <div className="h-12 flex-1 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-12 w-28 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </section>
      </div>
    </main>
  );
}
