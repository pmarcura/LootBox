import { RedeemForm } from "./RedeemForm";

export function GachaRedeemPanel() {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">
          Resgate
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Abrir Lootbox
        </h1>
        <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
          Use códigos do seu kit físico para revelar criaturas biopunk. 
          Cada código libera 1 vessel + 1 strain.
        </p>
        <p className="text-xs text-zinc-500">
          Dica: códigos válidos têm 12 caracteres e não usam O, 0, I, 1 ou U.
        </p>
      </div>
      <div className="mt-8">
        <RedeemForm />
      </div>
    </section>
  );
}
