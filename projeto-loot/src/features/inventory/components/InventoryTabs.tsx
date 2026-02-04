"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import type { InventoryItemGrouped, StrainItemGrouped, UserCardItem } from "../types";
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
};

type TabId = "vessels" | "strains" | "cards";

export function InventoryTabs({
  groupsBySeries,
  strainGroups,
  userCards,
  totalVessels,
  totalStrains,
  totalCards,
}: InventoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("vessels");

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "vessels", label: "Vessels", count: totalVessels },
    { id: "strains", label: "Strains", count: totalStrains },
    { id: "cards", label: "Cartas fundidas", count: totalCards },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100/50 p-1 dark:border-zinc-700 dark:bg-zinc-800/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "min-h-[44px] flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeTab === "vessels" && <InventoryGrid groupsBySeries={groupsBySeries} />}
      {activeTab === "strains" && <StrainGrid groupsByFamily={strainGroups} />}
      {activeTab === "cards" && <UserCardsGrid cards={userCards} />}
    </div>
  );
}
