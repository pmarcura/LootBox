export default function RegisterLoading() {
  return (
    <main className="bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-3">
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-11 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    </main>
  );
}
