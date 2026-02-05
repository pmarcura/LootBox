"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";
import type { InventoryItemGrouped, StrainItemGrouped, UserCardItem } from "../types";
import { claimSeasonRewardAction } from "../actions/claim-season-reward";
import { BioGauge } from "./BioGauge";
import { InventoryGrid } from "./InventoryGrid";
import { StrainGrid } from "./StrainGrid";
import { UserCardsGrid } from "./UserCardsGrid";

type InventoryTabsProps = {
  groupsBySeries: Map<string, InventoryItemGrouped[]>;
  strainGroups: Map<string, StrainItemGrouped[]>;
  userCards: UserCardItem[];
  totalVessels: number;
  totalStrains: number;
  totalCards: number;
  season01Total: number;
  season01Owned: number;
  season01PurgeClaimedAt?: string | null;
};

type TabId = "vessels" | "strains" | "cards";

export function InventoryTabs({
  groupsBySeries,
  strainGroups,
  userCards,
  totalVessels,
  totalStrains,
  totalCards,
  season01Total,
  season01Owned,
  season01PurgeClaimedAt = null,
}: InventoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("vessels");
  const [purgePending, setPurgePending] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const alreadyClaimed = Boolean(season01PurgeClaimedAt);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "vessels", label: "Vessels", count: totalVessels },
    { id: "strains", label: "Strains", count: totalStrains },
    { id: "cards", label: "Cartas fundidas", count: totalCards },
  ];

  const gaugeValue =
    season01Total > 0
      ? Math.min(100, Math.round((season01Owned / season01Total) * 100))
      : 0;
  const atPeak = season01Total > 0 && season01Owned >= season01Total;

  return (
    <div className="space-y-6">
      <BioGauge
        value={gaugeValue}
        atPeak={atPeak}
        season01Total={season01Total}
        season01Owned={season01Owned}
      />
      {atPeak && (
        <div className="rounded-xl border-2 border-amber-500/50 biopunk-panel-metal p-4">
          <p className="text-center text-xs font-mono uppercase tracking-wider text-amber-400/90">
            {alreadyClaimed ? "Recompensa da Season 01 já resgatada" : "Carga máxima — resgate experiência"}
          </p>
          {purgeMessage && (
            <p
              className={cn(
                "mt-2 text-center text-sm",
                purgeMessage.type === "success" ? "text-emerald-400" : "text-red-400",
              )}
            >
              {purgeMessage.text}
            </p>
          )}
          <button
            type="button"
            disabled={purgePending || alreadyClaimed}
            className="mt-3 w-full min-h-[48px] rounded-lg border-2 border-amber-500 bg-amber-600/30 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-amber-100 transition-colors hover:bg-amber-600/50 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={async () => {
              setPurgeMessage(null);
              setPurgePending(true);
              const result = await claimSeasonRewardAction();
              setPurgePending(false);
              if (result.ok) {
                setPurgeMessage({ type: "success", text: `+${result.xpGranted} XP resgatados!` });
                router.refresh();
              } else {
                setPurgeMessage({ type: "error", text: result.message });
              }
            }}
          >
            {purgePending ? "Resgatando..." : alreadyClaimed ? "Já resgatado" : "Purga de Sistema / Resgatar experiência"}
          </button>
        </div>
      )}
      {/* Filtros físicos: módulos de hardware encaixáveis */}
      <div className="flex gap-2 rounded-xl border-2 border-[var(--biopunk-metal-light)] biopunk-panel-metal p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "min-h-[44px] flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "border-amber-500/70 bg-amber-950/40 text-amber-200 shadow-[var(--biopunk-glow-amber)]"
                : "border-[var(--biopunk-metal)] bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
            )}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
              {tab.id}
            </span>
            <span className="mt-0.5 block font-semibold">{tab.label}</span>
            <span className="text-xs opacity-80">({tab.count})</span>
          </button>
        ))}
      </div>

      {activeTab === "vessels" && <InventoryGrid groupsBySeries={groupsBySeries} />}
      {activeTab === "strains" && <StrainGrid groupsByFamily={strainGroups} />}
      {activeTab === "cards" && <UserCardsGrid cards={userCards} />}
    </div>
  );
}
