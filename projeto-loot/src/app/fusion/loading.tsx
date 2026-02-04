export default function FusionLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-8 dark:from-zinc-950 dark:to-black sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div className="h-5 w-48 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-32 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </main>
  );
}
