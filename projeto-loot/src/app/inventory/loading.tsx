export default function InventoryLoading() {
  return (
    <main className="bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <nav className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </nav>
        <header className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex justify-between">
                <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="mt-4 h-28 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-3 h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
