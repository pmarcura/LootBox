"use client";

import { forwardRef, useEffect, useRef } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getStrainFamilyDisplay } from "@/lib/strain-family";
import type { DropResult } from "../../types";

type RevealSummaryProps = {
  drop: DropResult;
  onClose: () => void;
};

const rarityLabels: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export const RevealSummary = forwardRef<HTMLDivElement, RevealSummaryProps>(
  function RevealSummary({ drop, onClose }, ref) {
    const inventoryLinkRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
      inventoryLinkRef.current?.focus();
    }, []);

    const announceText = `Você obteve o vessel ${drop.vessel.collectibleName} e a strain ${drop.strain.name}. 1 vessel e 1 strain adicionados ao inventário.`;

    return (
      <div
        ref={ref}
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-8 pt-16 pb-[var(--content-bottom-safe)]"
        role="region"
        aria-label="Resultado da revelação"
      >
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announceText}
        </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            Vessel
          </span>
          <h2 className="text-xl font-bold text-white md:text-2xl">
            {drop.vessel.collectibleName}
          </h2>
          <Badge tone={drop.vessel.rarity} className="text-xs uppercase">
            {rarityLabels[drop.vessel.rarity] ?? drop.vessel.rarity}
          </Badge>
        </div>
        <span className="hidden text-zinc-500 sm:inline">+</span>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            Strain
          </span>
          <h2 className="text-xl font-bold text-white md:text-2xl">
            {drop.strain.name}
          </h2>
          <Badge tone={drop.strain.rarity} className="text-xs uppercase">
            {rarityLabels[drop.strain.rarity] ?? drop.strain.rarity}
          </Badge>
          <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
            {getStrainFamilyDisplay(drop.strain.family as "NEURO" | "SHELL" | "PSYCHO", false)}
          </span>
        </div>
      </div>

      <p className="text-center text-sm text-zinc-400">
        1 Vessel e 1 Strain adicionados ao inventário!
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onClose} variant="secondary" className="outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black">
          Resgatar outro
        </Button>
        <Link
          href="/inventory"
          ref={inventoryLinkRef}
          className="outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black focus:rounded-full"
          tabIndex={0}
        >
          <Button>Ver no inventário</Button>
        </Link>
      </div>
    </div>
    );
  }
);
