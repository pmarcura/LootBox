"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/features/gacha/hooks/useReducedMotion";
import { fuseCardAction, type FuseState } from "../actions/fuse";
import { previewFusion } from "../utils/previewFusion";
import type { VesselItem, StrainItem } from "./FusionSlot";
import { FusionSlot } from "./FusionSlot";
import { MutationGrid } from "./MutationGrid";
import { SlideToConfirm } from "./SlideToConfirm";
import { FlavorTicker } from "./FlavorTicker";
import { StrainFamilyIcon } from "./StrainFamilyIcon";
import { TransferTube } from "./TransferTube";
import { getRarityBadgeClass } from "../utils/rarityStyles";

export type VesselOption = VesselItem;
export type StrainOption = StrainItem;

type FusionLabProps = {
  vessels: VesselOption[];
  strains: StrainOption[];
};

export function FusionLab({ vessels, strains }: FusionLabProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [state, formAction, isPending] = useActionState<FuseState, FormData>(
    fuseCardAction,
    { status: "idle" },
  );
  const [selectedVessel, setSelectedVessel] = useState<VesselOption | null>(
    null,
  );
  const [selectedStrain, setSelectedStrain] = useState<StrainOption | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"vessels" | "strains">("vessels");

  const preview =
    selectedVessel && selectedStrain
      ? previewFusion(
          {
            baseHp: selectedVessel.baseHp,
            baseAtk: selectedVessel.baseAtk,
            baseMana: selectedVessel.baseMana,
          },
          {
            rarity: selectedStrain.rarity as "common" | "uncommon" | "rare" | "epic" | "legendary",
            family: selectedStrain.family as "NEURO" | "SHELL" | "PSYCHO",
          },
        )
      : null;

  const geneticRisk =
    preview &&
    selectedVessel &&
    preview.finalHp < selectedVessel.baseHp * 0.6;

  const handleConfirm = useCallback(() => {
    if (!selectedVessel || !selectedStrain) return;
    formRef.current?.requestSubmit();
  }, [selectedVessel, selectedStrain]);

  const canFuse = vessels.length > 0 && strains.length > 0;
  const bothSelected = selectedVessel && selectedStrain;

  // Success: O Batismo (com animação se motion permitido)
  if (state.status === "success") {
    const familyColor =
      selectedStrain?.family === "NEURO"
        ? "border-violet-500"
        : selectedStrain?.family === "SHELL"
          ? "border-emerald-500"
          : "border-amber-500";
    const duration = prefersReducedMotion ? 0 : 0.4;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration }}
        className="mx-auto max-w-md space-y-6 rounded-2xl border-2 border-zinc-700 bg-zinc-900/80 p-6"
      >
        <motion.h2
          initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration, delay: prefersReducedMotion ? 0 : 0.1 }}
          className="text-center text-xl font-bold text-zinc-100"
        >
          Mutação concluída
        </motion.h2>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration, delay: prefersReducedMotion ? 0 : 0.15 }}
          className={`rounded-2xl border-2 ${familyColor} bg-zinc-900 p-4 shadow-lg`}
        >
          <h3 className="text-lg font-semibold text-zinc-100">
            {selectedVessel?.name ?? "Carta fundida"}
          </h3>
          <span className="mt-2 inline-block rounded bg-violet-600 px-2 py-0.5 text-xs font-semibold uppercase text-white">
            {state.keyword}
          </span>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <dt className="text-zinc-500">HP</dt>
            <dd className="font-medium text-zinc-100">{state.finalHp}</dd>
            <dt className="text-zinc-500">ATK</dt>
            <dd className="font-medium text-zinc-100">{state.finalAtk}</dd>
            <dt className="text-zinc-500">Mana</dt>
            <dd className="font-medium text-zinc-100">{state.manaCost}</dd>
          </dl>
          <p className="mt-3 font-mono text-xs text-zinc-400">
            #{state.tokenId.slice(0, 8).toUpperCase()}
          </p>
        </motion.div>
        <div className="flex flex-col gap-3">
          <Link href="/inventory">
            <Button className="w-full">Ver no inventário</Button>
          </Link>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Fundir outra
          </Button>
        </div>
      </motion.div>
    );
  }

  // Overlay durante submit
  const showOverlay = isPending;

  return (
    <div className="relative space-y-6">
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-zinc-950/90 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <span className="text-sm font-medium text-zinc-300">
                Iniciando sessão…
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <form ref={formRef} action={formAction} className="space-y-6">
        <input
          type="hidden"
          name="vesselInventoryId"
          value={selectedVessel?.inventoryId ?? ""}
        />
        <input
          type="hidden"
          name="userStrainId"
          value={selectedStrain?.userStrainId ?? ""}
        />

        {/* Hero: tubo de transferência no topo + dois slots */}
        <section
          className="relative rounded-2xl border border-cyan-500/20 bg-black/80 p-4 pt-12 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
          aria-label="Bancada de fusão"
        >
          <TransferTube />
          <div className="relative grid grid-cols-2 gap-4">
            <div className="relative z-10">
              <FusionSlot
                type="vessel"
                item={selectedVessel}
                onClick={() => setActiveTab("vessels")}
              />
            </div>
            <div className="relative z-10">
              <FusionSlot
                type="strain"
                item={selectedStrain}
                isPulsing={!!selectedVessel && !selectedStrain}
                onClick={() => setActiveTab("strains")}
              />
            </div>
          </div>
        </section>

        {/* Estoque: abas + lista */}
        <section aria-label="Estoque de hospedeiros e vírus">
          <div className="flex gap-2 border-b border-zinc-700">
            <button
              type="button"
              onClick={() => setActiveTab("vessels")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "vessels"
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Hospedeiros
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("strains")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "strains"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Vírus
            </button>
          </div>
          <div className="mt-3 max-h-40 overflow-y-auto">
            {activeTab === "vessels" && (
              <div className="flex flex-wrap gap-2">
                {vessels.map((v) => (
                  <button
                    key={v.inventoryId}
                    type="button"
                    onClick={() => setSelectedVessel(v)}
                    className={`rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors ${
                      selectedVessel?.inventoryId === v.inventoryId
                        ? "border-violet-500 bg-violet-950/50 text-zinc-100"
                        : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <span className="font-medium">{v.name}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs">
                      <span className={getRarityBadgeClass(v.rarity) + " rounded-full px-2 py-0.5"}>
                        {v.rarity}
                      </span>
                      <span className="text-zinc-500">
                        HP {v.baseHp} / ATK {v.baseAtk}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {activeTab === "strains" && (
              <div className="flex flex-wrap gap-2">
                {strains.map((s) => (
                  <button
                    key={s.userStrainId}
                    type="button"
                    onClick={() => setSelectedStrain(s)}
                    className={`rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors ${
                      selectedStrain?.userStrainId === s.userStrainId
                        ? "border-emerald-500 bg-emerald-950/50 text-zinc-100"
                        : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs">
                      <StrainFamilyIcon family={s.family} size="sm" />
                      <span className={getRarityBadgeClass(s.rarity) + " rounded-full px-2 py-0.5"}>
                        {s.rarity}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Painel de mutação (grid tático) + slider de sessão */}
        {bothSelected && preview && (
          <section aria-label="Previsão de mutação e sessão">
            <MutationGrid
              attack={{ base: selectedVessel.baseAtk, final: preview.finalAtk }}
              life={{ base: selectedVessel.baseHp, final: preview.finalHp }}
              cost={{ base: selectedVessel.baseMana, final: preview.manaCost }}
              keyword={preview.keyword}
            />
            {geneticRisk && (
              <p
                className="mt-3 animate-pulse text-center text-xs font-bold uppercase tracking-wider text-amber-400"
                role="alert"
                style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
              >
                Risco genético: penalidade alta
              </p>
            )}
            <FlavorTicker
              messageIndex={
                selectedVessel.baseHp + (selectedStrain?.name.length ?? 0)
              }
              className="mt-3"
            />
            <div className="mt-4">
              <SlideToConfirm
                onConfirm={handleConfirm}
                disabled={!bothSelected || isPending}
                isPending={isPending}
                label="ARRASTE PARA INICIAR SESSÃO"
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-2 w-full"
                onClick={handleConfirm}
                disabled={!bothSelected || isPending}
              >
                Confirmar sessão (acessibilidade)
              </Button>
            </div>
          </section>
        )}

        {state.status === "error" && (
          <div
            id="fusion-error"
            role="alert"
            className="rounded-2xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          >
            <p>{state.message}</p>
            <p className="mt-1 text-red-400">
              Tente novamente ou escolha outro vessel ou strain.
            </p>
          </div>
        )}
      </form>

      {!canFuse && (
        <p className="text-center text-sm text-zinc-500">
          Você precisa de pelo menos 1 vessel e 1 strain não usados.
        </p>
      )}
    </div>
  );
}
