"use client";

import * as React from "react";
import { HeartIcon, AttackIcon } from "@/features/duels/components/CombatIcons";
import { KeywordIcon } from "../KeywordIcons";

type CardData = {
  final_hp: number;
  final_atk: number;
  mana_cost: number;
  keyword: string;
  current_hp?: number | null;
};

type CardZoomOverlayProps = {
  card: CardData;
  onClose: () => void;
};

/**
 * Overlay DOM sobre o canvas Pixi - carta grande no centro.
 * Long press em qualquer carta dispara este overlay.
 */
export function CardZoomOverlay({ card, onClose }: CardZoomOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label="Detalhes da carta"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="mx-4 max-w-sm rounded-2xl border border-zinc-600 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-amber-600 px-3 py-1 text-sm font-bold text-zinc-950">
            {card.mana_cost} mana
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-xl font-bold text-zinc-100">
            <HeartIcon size={24} className="text-red-400" />
            {card.current_hp ?? card.final_hp}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xl text-zinc-300">
            <AttackIcon size={24} className="text-amber-400" />
            {card.final_atk}
          </span>
        </div>
        {card.keyword && (
          <div className="mt-3 flex items-center gap-2">
            <KeywordIcon keyword={card.keyword} size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
