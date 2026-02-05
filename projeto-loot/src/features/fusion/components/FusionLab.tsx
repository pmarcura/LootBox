"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/features/gacha/hooks/useReducedMotion";
import { fuseCardAction, type FuseState } from "../actions/fuse";
import { previewFusion } from "../utils/previewFusion";
import type { VesselItem, StrainItem } from "./FusionSlot";
import { FusionSlot } from "./FusionSlot";
import { FusionRevealExperience } from "./FusionRevealExperience";
import { MutationGrid } from "./MutationGrid";
import { ReactorLever } from "./ReactorLever";
import { FusionVoltmeter } from "./FusionVoltmeter";
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

  const handleDropVessel = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const v = JSON.parse(raw) as VesselOption;
        if (v?.inventoryId) setSelectedVessel(v);
      } catch {
        // ignore
      }
    },
    [],
  );
  const handleDropStrain = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const s = JSON.parse(raw) as StrainOption;
        if (s?.userStrainId) setSelectedStrain(s);
      } catch {
        // ignore
      }
    },
    [],
  );
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Success: mesmo padrão do resgate — 3D (carta sai) + Continuar → tela de detalhes
  if (state.status === "success" && selectedVessel && selectedStrain) {
    return (
      <FusionRevealExperience
        vessel={selectedVessel}
        strain={selectedStrain}
        state={state}
        onClose={() => window.location.reload()}
      />
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

        {/* Hero: painel do reator — tubo no topo, tanques + câmara de reação */}
        <section
          className="relative crt-container biopunk-panel-metal rounded-xl border-2 border-[var(--biopunk-metal-light)] p-4 pt-12 shadow-[var(--biopunk-glow-cyan)]"
          aria-label="Bancada de fusão"
          style={{ boxShadow: "0 0 30px rgba(34, 211, 238, 0.08), inset 0 0 40px rgba(0,0,0,0.3)" }}
        >
          <TransferTube />
          <div className="relative grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
            <div
              className="relative z-10 min-w-0"
              onDrop={handleDropVessel}
              onDragOver={handleDragOver}
            >
              <FusionSlot
                type="vessel"
                item={selectedVessel}
                onClick={() => setActiveTab("vessels")}
              />
            </div>
            {/* Câmara de reação: vórtice quando vazia, pronta quando ambos preenchidos */}
            <div
              className={bothSelected
                ? "flex w-12 flex-col items-center justify-center rounded-lg border-2 border-amber-500/60 bg-amber-950/30 shadow-[var(--biopunk-glow-amber)]"
                : "flex w-12 flex-col items-center justify-center rounded-lg border-2 border-cyan-500/30 bg-cyan-950/20"
              }
              aria-hidden
            >
              {bothSelected ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">OK</span>
              ) : (
                <span className="text-[10px] font-mono text-cyan-400/70 animate-pulse">...</span>
              )}
            </div>
            <div
              className="relative z-10 min-w-0"
              onDrop={handleDropStrain}
              onDragOver={handleDragOver}
            >
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
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify(v));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => setSelectedVessel(v)}
                    className={`cursor-grab active:cursor-grabbing rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors ${
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
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify(s));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => setSelectedStrain(s)}
                    className={`cursor-grab active:cursor-grabbing rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors ${
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

        {/* Painel de mutação (grid tático) + voltímetro + alavanca */}
        {bothSelected && preview && (
          <section aria-label="Previsão de mutação e sessão">
            <FusionVoltmeter value={100} className="mx-auto mb-4" />
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
              <ReactorLever
                onConfirm={handleConfirm}
                disabled={!bothSelected || isPending}
                isPending={isPending}
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
