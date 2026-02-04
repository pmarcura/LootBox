"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { getStrainFamilyDisplay } from "@/lib/strain-family";
import { fuseCardAction, type FuseState } from "../actions/fuse";

type VesselOption = {
  inventoryId: string;
  name: string;
  slug: string;
  rarity: string;
  baseHp: number;
  baseAtk: number;
  baseMana: number;
};

type StrainOption = {
  userStrainId: string;
  name: string;
  slug: string;
  rarity: string;
  family: string;
};

type FusionFormProps = {
  vessels: VesselOption[];
  strains: StrainOption[];
};

export function FusionForm({ vessels, strains }: FusionFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<FuseState, FormData>(
    fuseCardAction,
    { status: "idle" },
  );

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-6 dark:border-violet-800 dark:bg-violet-950/30">
        <h2 className="text-lg font-semibold text-violet-900 dark:text-violet-100">
          Carta fundida!
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-violet-600 dark:text-violet-400">HP</dt>
          <dd className="font-medium text-violet-900 dark:text-violet-50">{state.finalHp}</dd>
          <dt className="text-violet-600 dark:text-violet-400">ATK</dt>
          <dd className="font-medium text-violet-900 dark:text-violet-50">{state.finalAtk}</dd>
          <dt className="text-violet-600 dark:text-violet-400">Mana</dt>
          <dd className="font-medium text-violet-900 dark:text-violet-50">{state.manaCost}</dd>
          <dt className="text-violet-600 dark:text-violet-400">Keyword</dt>
          <dd className="font-medium text-violet-900 dark:text-violet-50">{state.keyword}</dd>
        </dl>
        <p className="mt-2 text-xs text-violet-600 dark:text-violet-400">
          ID: {state.tokenId.slice(0, 16)}…
        </p>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => router.push("/fusion")} variant="secondary">
            Fundir outra
          </Button>
          <Button onClick={() => router.push("/inventory")}>
            Ver no inventário
          </Button>
        </div>
      </div>
    );
  }

  const canFuse = vessels.length > 0 && strains.length > 0;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="fusion-vessel" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Vessel (personagem)
          </label>
          <select
            id="fusion-vessel"
            name="vesselInventoryId"
            required
            disabled={!canFuse}
            aria-describedby={state.status === "error" ? "fusion-error" : undefined}
            className="w-full min-h-[44px] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 disabled:opacity-50"
          >
            <option value="">Selecione um vessel</option>
            {vessels.map((v) => (
              <option key={v.inventoryId} value={v.inventoryId}>
                {v.name} (HP {v.baseHp} / ATK {v.baseAtk} / Mana {v.baseMana})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fusion-strain" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Strain
          </label>
          <select
            id="fusion-strain"
            name="userStrainId"
            required
            disabled={!canFuse}
            aria-describedby={state.status === "error" ? "fusion-error" : undefined}
            className="w-full min-h-[44px] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 disabled:opacity-50"
          >
            <option value="">Selecione um strain</option>
            {strains.map((s) => (
              <option key={s.userStrainId} value={s.userStrainId}>
                {s.name} ({getStrainFamilyDisplay(s.family as "NEURO" | "SHELL" | "PSYCHO", false)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.status === "error" && (
        <div id="fusion-error" role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          <p>{state.message}</p>
          <p className="mt-1 text-red-500 dark:text-red-400">Tente novamente ou escolha outro vessel ou strain.</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!canFuse || isPending}
        variant="primary"
        className="w-full sm:w-auto"
      >
        {!canFuse
          ? "Você precisa de pelo menos 1 vessel e 1 strain não usados"
          : isPending
            ? "Fundindo..."
            : "Fundir carta"}
      </Button>
    </form>
  );
}
